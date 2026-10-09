-- 0002 体験版（ログインなしの蔵書確認）の利用回数（#183）。
-- カーリル check の利用上限を全ユーザーで共有しているため、体験版の消費を
-- 時間バケットごとに数えて上限で止める（docs/183-trial-availability-check/design.md）。
--   bucket: 'global'（体験版全体の書籍リクエスト数）または 'ip:{SHA-256}'（接続元ごとの回数）
--   hour:   Unix 時間を 3600 秒で割った値（時間バケット）
-- 2時間より古い行は加算時に削除する（IP ハッシュを長く残さない）。
CREATE TABLE IF NOT EXISTS trial_usage (
  bucket TEXT    NOT NULL,
  hour   INTEGER NOT NULL,
  count  INTEGER NOT NULL,
  PRIMARY KEY (bucket, hour)
);
