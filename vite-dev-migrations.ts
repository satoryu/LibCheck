/**
 * dev サーバ / テスト用: D1 マイグレーションファイル群から、実行すべき SQL 文を
 * 連番順に取り出す純粋関数。本番は `wrangler d1 migrations apply` が同じ
 * `infra/d1/migrations/` を適用する（CI）。ローカルはこの結果を node:sqlite に流す。
 *
 * - `.sql` のファイルのみ対象
 * - ファイル名の先頭の数値プレフィックス昇順（同値はファイル名で安定整列）
 * - `--` で始まる行コメントを除去
 * - `;` で文分割し、空白のみの断片は捨てる（末尾の `;` は含めない）
 */
export function orderedMigrationStatements(
  files: { name: string; content: string }[],
): string[] {
  const numericPrefix = (name: string): number => {
    const m = /^(\d+)/.exec(name);
    return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
  };

  const sorted = files
    .filter((f) => f.name.toLowerCase().endsWith(".sql"))
    .sort((a, b) => {
      const d = numericPrefix(a.name) - numericPrefix(b.name);
      return d !== 0 ? d : a.name.localeCompare(b.name);
    });

  const statements: string[] = [];
  for (const file of sorted) {
    const stripped = file.content
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    for (const part of stripped.split(";")) {
      const stmt = part.trim();
      if (stmt) statements.push(stmt);
    }
  }
  return statements;
}
