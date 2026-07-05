#!/usr/bin/env bash
# 本番 (https://libcheck.app) のスモークテスト。
# デプロイ後・障害調査の一次切り分けに使う（読み取りのみ・破壊的操作なし）。
# 使い方: scripts/smoke.sh [BASE_URL]   （省略時は本番）
set -u

BASE="${1:-https://libcheck.app}"
PASS=0
FAIL=0

check() { # check <名前> <期待> <実際>
  local name="$1" expect="$2" actual="$3"
  if [ "$actual" = "$expect" ]; then
    printf '✅ %-28s %s\n' "$name" "$actual"
    PASS=$((PASS + 1))
  else
    printf '❌ %-28s expected=%s actual=%s\n' "$name" "$expect" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

code() { curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$1" 2>/dev/null; }
code_follow() { curl -sSL -o /dev/null -w '%{http_code}' --max-time 15 "$1" 2>/dev/null; }
header() { curl -sS -D - -o /dev/null --max-time 15 "$1" 2>/dev/null | grep -i "^$2:" | head -1; }

echo "=== smoke test: $BASE ==="

# 配信
check "SPA /"                    200 "$(code "$BASE/")"
check "robots.txt"               200 "$(code "$BASE/robots.txt")"
check "og-image.png"             200 "$(code "$BASE/og-image.png")"

# 認証境界（無認証はすべて 401 = サーバ検証が生きている）
check "/api/me (no auth)"        401 "$(code "$BASE/api/me")"
check "/api/registered-libraries" 401 "$(code "$BASE/api/registered-libraries")"
check "/api/calil/library"       401 "$(code "$BASE/api/calil/library?pref=%E6%9D%B1%E4%BA%AC%E9%83%BD&appkey=")"

# セキュリティヘッダ（CSP は enforce であること = Report-Only ではない）
csp="$(header "$BASE/" 'content-security-policy')"
if [ -n "$csp" ]; then check "CSP (enforce)" yes yes; else check "CSP (enforce)" yes no; fi
xfo="$(header "$BASE/" 'x-frame-options')"
case "$xfo" in *DENY*) check "X-Frame-Options DENY" yes yes ;; *) check "X-Frame-Options DENY" yes no ;; esac

# 法務ページ（.html は本番でクリーン URL へ 30x → 追従で 200）
check "privacy-policy"           200 "$(code_follow "$BASE/privacy-policy.html")"
check "terms"                    200 "$(code_follow "$BASE/terms.html")"

# PWA 配信物
check "manifest.webmanifest"     200 "$(code "$BASE/manifest.webmanifest")"
check "sw.js"                    200 "$(code "$BASE/sw.js")"

# www → apex 正規化（本番のみ）
if [ "$BASE" = "https://libcheck.app" ]; then
  www_code="$(code "https://www.libcheck.app/")"
  check "www → apex (301)"       301 "$www_code"
fi

echo "==="
echo "PASS: $PASS  FAIL: $FAIL"
[ "$FAIL" -eq 0 ]
