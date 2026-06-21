/**
 * 現在の認証 ID トークンの保持場所（モジュール内 mutable）。
 *
 * `AuthProvider` がログイン状態に応じて `setAuthToken` を呼び、サーバー版
 * リポジトリは `getAuthToken` で現在のトークンを読む（React 状態と DI の薄い橋渡し）。
 * 必須ログインのため「切替」はなく「今のトークンを使う」だけ。
 */
let currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

export function getAuthToken(): string | null {
  return currentToken;
}
