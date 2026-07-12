#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash).
# CLAUDE.md "Known Pitfalls" の「git add -A を使わない（明示的なパスを stage する）」を強制する。
# stdin で受け取るツール入力 JSON から command を取り出し、一括 stage を検出したら
# exit 2（ブロック）で理由を stderr に返す。
set -eu

input=$(cat)

if command -v jq >/dev/null 2>&1; then
  cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
else
  # jq が無い環境では JSON 全体を対象に検査する（誤検出side に倒す）
  cmd=$input
fi

# heredoc 本文（コミットメッセージ等）とクォートされた文字列リテラルは
# コマンドとして実行されないため判定対象から外す
stripped=$(printf '%s\n' "$cmd" | awk '
  skip { if ($0 == delim) skip = 0; next }
  match($0, /<<-?[[:space:]]*["'\'']?[A-Za-z_][A-Za-z0-9_]*/) {
    delim = substr($0, RSTART, RLENGTH)
    sub(/^<<-?[[:space:]]*["'\'']?/, "", delim)
    skip = 1; print; next
  }
  { print }
' | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")

if printf '%s' "$stripped" | grep -Eq 'git[[:space:]]+add([[:space:]]+[^[:space:]]+)*[[:space:]]+(-A|--all|--no-ignore-removal|\.)([[:space:]]|$)'; then
  echo "Blocked by scripts/claude-hooks/block-git-add-all.sh: 'git add -A/--all/.' は禁止です (CLAUDE.md Known Pitfalls)。'git add <path>...' で明示的なパスを stage してください。" >&2
  exit 2
fi

exit 0
