import * as Sentry from '@sentry/react';

/**
 * 対応不能な第三者スクリプト由来の例外を送らない（#179）。
 *
 * Sentry の `denyUrls` はページ URL ではなく、例外が throw された最内フレームの
 * スクリプト URL と照合される。そのため GIS から呼ばれた自コードのコールバックで
 * throw した例外（最内フレームが自バンドル）は除外されず、従来どおり送られる。
 * 前方一致の正規表現にして、似たホスト名や自サイトのパスを巻き込まない。
 */
export const SENTRY_DENY_URLS: RegExp[] = [
  // Google Identity Services（@react-oauth/google が読み込む）。GIS 内部の XHR
  // ハンドラで GIS 自身が throw する例外（minify 名 "pa" / "ta" 等、LIBCHECK-5/6/7）。
  /^https:\/\/accounts\.google\.com\/gsi\//,
];

/**
 * エラー監視（Sentry）の初期化（#118）。
 *
 * - スコープはエラー捕捉のみ。Tracing / Session Replay は使わない
 *   （バンドル・ノイズ・無料枠の節約）。
 * - DSN は公開値。ビルド時に `VITE_SENTRY_DSN`（GitHub Actions 変数
 *   `SENTRY_DSN`）から注入され、未設定（ローカル等）なら初期化しない。
 * - プライバシー: `sendDefaultPii` は無効（既定どおり明示）。ユーザー情報は
 *   設定しないため送信されない。詳細はプライバシーポリシー参照。
 * - 対応不能な第三者スクリプト由来の例外は `SENTRY_DENY_URLS` で除外する（#179）。
 */
export function initSentry(): void {
  const dsn = (import.meta.env.VITE_SENTRY_DSN ?? '').trim();
  if (dsn.length === 0 || import.meta.env.DEV) {
    return;
  }
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    denyUrls: SENTRY_DENY_URLS,
  });
}

/** ErrorBoundary 等から手動で例外を報告する（未初期化時は no-op）。 */
export function reportError(error: unknown): void {
  Sentry.captureException(error);
}
