import { describe, it, expect } from 'vitest';

import { shouldRetryQuery } from '@/queryClient';

describe('shouldRetryQuery（#100 P2-7）', () => {
  it('401（セッション失効）は再試行しない', () => {
    expect(shouldRetryQuery(0, new Error('HTTP 401'))).toBe(false);
  });

  it('4xx（クライアントエラー）は再試行しない', () => {
    expect(shouldRetryQuery(0, new Error('HTTP 404'))).toBe(false);
    expect(shouldRetryQuery(0, new Error('HTTP 413'))).toBe(false);
  });

  it('5xx・ネットワーク断は1回だけ再試行する', () => {
    expect(shouldRetryQuery(0, new Error('HTTP 500'))).toBe(true);
    expect(shouldRetryQuery(0, new Error('Network error: fetch failed'))).toBe(true);
    expect(shouldRetryQuery(1, new Error('HTTP 500'))).toBe(false);
    expect(shouldRetryQuery(1, new Error('Network error: fetch failed'))).toBe(false);
  });
});
