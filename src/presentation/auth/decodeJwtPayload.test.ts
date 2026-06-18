import { describe, it, expect } from 'vitest';

import { decodeJwtPayload } from '@/presentation/auth/decodeJwtPayload';

function base64url(obj: unknown): string {
  const json = JSON.stringify(obj);
  const b64 = btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_m, h) =>
      String.fromCharCode(parseInt(h, 16)),
    ),
  );
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fakeJwt(payload: unknown): string {
  return `${base64url({ alg: 'none' })}.${base64url(payload)}.sig`;
}

describe('decodeJwtPayload', () => {
  it('JWT のペイロードをデコードする', () => {
    const token = fakeJwt({ sub: '123', email: 'a@example.com', name: 'Alice' });
    expect(decodeJwtPayload(token)).toEqual({
      sub: '123',
      email: 'a@example.com',
      name: 'Alice',
    });
  });

  it('UTF-8（日本語）の name を復元する', () => {
    const token = fakeJwt({ sub: '1', name: '山田太郎' });
    expect(decodeJwtPayload(token)?.name).toBe('山田太郎');
  });

  it('不正なトークンは null', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
    expect(decodeJwtPayload('')).toBeNull();
  });
});
