export interface GoogleIdTokenPayload {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * JWT のペイロード部を base64url デコードして返す（**表示専用**・検証はしない）。
 * 署名検証はサーバー（functions/api/me.js の verifyGoogleIdToken）が行う。
 * パースに失敗したら null。
 */
export function decodeJwtPayload(token: string): GoogleIdTokenPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    // UTF-8 を正しく復元する。
    const json = decodeURIComponent(
      Array.from(binary)
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as GoogleIdTokenPayload;
  } catch {
    return null;
  }
}
