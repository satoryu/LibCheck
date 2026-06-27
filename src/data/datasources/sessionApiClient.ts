import type { User } from '@/domain/models/user';

/**
 * セッション操作の抽象（#91）。AuthProvider から注入してテスト可能にする。
 */
export interface SessionApi {
  /** Cookie からセッションを復元する（未ログイン/失敗は null）。 */
  restore(): Promise<User | null>;
  /** GIS の ID トークンを送り、セッション Cookie を発行する。 */
  create(idToken: string): Promise<void>;
  /** セッション Cookie を削除する（ログアウト）。 */
  destroy(): Promise<void>;
}

/**
 * `/api/session`（POST/DELETE）と `/api/me`（GET）を叩く実装。
 * 認証は HttpOnly Cookie のため `credentials: 'same-origin'` で Cookie を送る。
 */
export class SessionApiClient implements SessionApi {
  constructor(
    private readonly fetchFn: typeof fetch = globalThis.fetch.bind(globalThis),
    private readonly baseUrl: string = '/api',
  ) {}

  async restore(): Promise<User | null> {
    try {
      const res = await this.fetchFn(`${this.baseUrl}/me`, {
        credentials: 'same-origin',
      });
      if (res.status !== 200) return null;
      const user = (await res.json()) as User;
      return user && typeof user.id === 'string' ? user : null;
    } catch {
      return null;
    }
  }

  async create(idToken: string): Promise<void> {
    await this.fetchFn(`${this.baseUrl}/session`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  }

  async destroy(): Promise<void> {
    await this.fetchFn(`${this.baseUrl}/session`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  }
}
