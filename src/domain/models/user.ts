/**
 * 認証済みユーザー。`id` は Google ID トークンの `sub`（安定した一意識別子）。
 * email/name/picture は表示用の任意項目。
 */
export interface User {
  readonly id: string;
  readonly email?: string;
  readonly name?: string;
  readonly picture?: string;
}
