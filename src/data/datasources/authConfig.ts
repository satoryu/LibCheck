import type { User } from '@/domain/models/user';

/**
 * 認証関連のクライアント設定。
 *
 * Google クライアント ID は公開値（GIS なのでシークレット不要）。
 * 認証モックは開発専用で、`import.meta.env.DEV` ガードにより本番ビルドでは
 * 常に false（＝モック経路は無効・除去される）。
 *
 * 値は呼び出し時に読む関数として公開し、テストで `vi.stubEnv` できるようにする。
 */

/** Google OAuth クライアント ID（未設定なら空文字）。 */
export function googleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();
}

/** 開発時の認証モックが有効か（dev かつ VITE_AUTH_MOCK=true のときのみ）。 */
export function authMockEnabled(): boolean {
  return import.meta.env.DEV === true && import.meta.env.VITE_AUTH_MOCK === 'true';
}

/** モック用の固定トークン。サーバー（functions/api/me.js）と一致させること。 */
export const MOCK_ID_TOKEN = 'mock.dev.token';

/** モック用の固定ユーザー。サーバー（functions/api/me.js）と一致させること。 */
export const MOCK_USER: User = {
  id: 'mock-user',
  email: 'dev@example.com',
  name: 'Dev User',
};
