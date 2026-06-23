-- Cloudflare D1 スキーマ（#74 永続化）
-- 適用: wrangler d1 execute libcheck --remote --file infra/d1/schema.sql

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
