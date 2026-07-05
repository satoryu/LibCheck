#!/usr/bin/env bash
# PR の CI 完了を待って結果を表示する。
# 使い方: scripts/watch-pr.sh [PR番号]   （省略時は現在のブランチの PR）
# 終了コード: CI がすべて成功なら 0、失敗があれば非 0（gh pr checks に準拠）。
set -u

PR="${1:-}"
if [ -z "$PR" ]; then
  PR="$(gh pr view --json number -q .number)" || {
    echo "現在のブランチに PR がありません。番号を指定してください。" >&2
    exit 2
  }
fi

echo "=== PR #$PR の CI を待機 ==="
# --watch は完了までポーリングし、失敗があれば非ゼロで返る。
gh pr checks "$PR" --watch --interval 15
status=$?
echo "==="
if [ $status -eq 0 ]; then
  echo "CI: 全チェック成功 ✅ （マージ可能）"
else
  echo "CI: 失敗あり ❌ （gh pr checks $PR で詳細確認）"
fi
exit $status
