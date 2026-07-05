#!/usr/bin/env bash
# PR の CI 完了を待って結果を表示する。
# 使い方: scripts/watch-pr.sh [PR番号]   （省略時は現在のブランチの PR）
# マージは必ず exit code に連動させること:
#   scripts/watch-pr.sh 123 && gh pr merge 123 --squash --delete-branch
# 終了コード: 0=全チェック成功 / 1=失敗あり / 2=PRなし / 3=チェック未報告
set -u

PR="${1:-}"
if [ -z "$PR" ]; then
  PR="$(gh pr view --json number -q .number)" || {
    echo "現在のブランチに PR がありません。番号を指定してください。" >&2
    exit 2
  }
fi

# PR 作成直後はチェックがまだ報告されておらず、gh pr checks が
# 「no checks」で非ゼロを返す（CI 失敗と区別できない）。報告されるまで待つ。
echo "=== PR #$PR のチェック登録を待機 ==="
lines=0
for _ in $(seq 1 18); do
  lines="$(gh pr checks "$PR" 2>/dev/null | wc -l | tr -d ' ')"
  [ "$lines" -gt 0 ] && break
  sleep 10
done
if [ "$lines" -eq 0 ]; then
  echo "チェックが報告されません（workflow が未トリガの可能性）。" >&2
  exit 3
fi

echo "=== PR #$PR の CI を待機 ==="
gh pr checks "$PR" --watch --interval 15
status=$?
echo "==="
if [ $status -eq 0 ]; then
  echo "CI: 全チェック成功 ✅ （マージ可能）"
else
  echo "CI: 失敗あり ❌ （gh pr checks $PR で詳細確認）"
fi
exit $status
