import * as Sentry from '@sentry/react';

/**
 * エラー監視（Sentry）の初期化（#118）。
 *
 * - スコープはエラー捕捉のみ。Tracing / Session Replay は使わない
 *   （バンドル・ノイズ・無料枠の節約）。
 * - DSN は公開値。ビルド時に `VITE_SENTRY_DSN`（GitHub Actions 変数
 *   `SENTRY_DSN`）から注入され、未設定（ローカル等）なら初期化しない。
 * - プライバシー: `sendDefaultPii` は無効（既定どおり明示）。ユーザー情報は
 *   設定しないため送信されない。詳細はプライバシーポリシー参照。
 */
export function initSentry(): void {
  const dsn = (import.meta.env.VITE_SENTRY_DSN ?? '').trim();
  if (dsn.length === 0 || import.meta.env.DEV) {
    return;
  }
  Sentry.init({
    dsn,
    sendDefaultPii: false,
  });
}

/** ErrorBoundary 等から手動で例外を報告する（未初期化時は no-op）。 */
export function reportError(error: unknown): void {
  Sentry.captureException(error);
}
