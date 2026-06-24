import { describe, it, expect } from "vitest";

import { orderedMigrationStatements } from "./vite-dev-migrations";

describe("orderedMigrationStatements", () => {
  it("単一ファイルの複数文を順序どおり返す", () => {
    const stmts = orderedMigrationStatements([
      {
        name: "0001_init.sql",
        content: "CREATE TABLE a (id TEXT);\nCREATE TABLE b (id TEXT);",
      },
    ]);
    expect(stmts).toEqual(["CREATE TABLE a (id TEXT)", "CREATE TABLE b (id TEXT)"]);
  });

  it("-- 行コメントを除去する", () => {
    const stmts = orderedMigrationStatements([
      {
        name: "0001_init.sql",
        content: "-- これはコメント\nCREATE TABLE a (id TEXT);\n  -- 字下げコメント\n",
      },
    ]);
    expect(stmts).toEqual(["CREATE TABLE a (id TEXT)"]);
  });

  it("ファイル名の数値プレフィックス昇順で連結する（入力順に依らない）", () => {
    const stmts = orderedMigrationStatements([
      { name: "0002_add.sql", content: "ALTER TABLE a ADD COLUMN x TEXT;" },
      { name: "0001_init.sql", content: "CREATE TABLE a (id TEXT);" },
      { name: "0010_late.sql", content: "CREATE TABLE z (id TEXT);" },
    ]);
    expect(stmts).toEqual([
      "CREATE TABLE a (id TEXT)",
      "ALTER TABLE a ADD COLUMN x TEXT",
      "CREATE TABLE z (id TEXT)",
    ]);
  });

  it(".sql 以外のファイルは無視する", () => {
    const stmts = orderedMigrationStatements([
      { name: "0001_init.sql", content: "CREATE TABLE a (id TEXT);" },
      { name: "README.md", content: "not sql; should be ignored;" },
      { name: ".DS_Store", content: "bink" },
    ]);
    expect(stmts).toEqual(["CREATE TABLE a (id TEXT)"]);
  });

  it("空文・空白のみの断片は捨てる", () => {
    const stmts = orderedMigrationStatements([
      { name: "0001_init.sql", content: "CREATE TABLE a (id TEXT);;\n\n  ;\n" },
    ]);
    expect(stmts).toEqual(["CREATE TABLE a (id TEXT)"]);
  });
});
