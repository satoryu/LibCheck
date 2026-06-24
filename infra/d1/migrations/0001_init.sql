-- 0001 ベースライン: #74 の永続化スキーマ（登録図書館・検索履歴）。
-- 既存の本番 D1 は migrations 導入前に手動適用済みのため、IF NOT EXISTS で
-- 冪等にし、初回 `wrangler d1 migrations apply` でも no-op で安全に通す。

CREATE TABLE IF NOT EXISTS registered_libraries (
  user_id      TEXT    NOT NULL,
  library_key  TEXT    NOT NULL,
  library_json TEXT    NOT NULL,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (user_id, library_key)
);

CREATE TABLE IF NOT EXISTS search_history (
  user_id       TEXT    NOT NULL,
  isbn          TEXT    NOT NULL,
  searched_at   TEXT    NOT NULL,
  statuses_json TEXT    NOT NULL,
  PRIMARY KEY (user_id, isbn)
);
