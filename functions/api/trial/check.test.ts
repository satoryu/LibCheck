// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSqliteD1 } from '../../_shared/testing/sqliteD1';
import { onRequestPost } from './check.js';

const ISBN = '9784003101018'; // 有効な ISBN-13
const SHIGA = [
  { systemId: 'Shiga_Yasu', libKey: '野洲', libId: '1', formalName: '野洲市野洲図書館 ', city: '野洲市', category: 'MEDIUM' },
  { systemId: 'Shiga_Yasu', libKey: '中主', libId: '2', formalName: '野洲市野洲図書館中主分館', city: '野洲市', category: 'MEDIUM' },
  { systemId: 'Special_Shiga_Ec', libKey: '教育センター', libId: '3', formalName: '滋賀県総合教育センター図書資料室', city: '野洲市', category: 'SPECIAL' },
  { systemId: 'Shiga_Otsu', libKey: '大津', libId: '4', formalName: '大津市立図書館', city: '大津市', category: 'MEDIUM' },
];
const CALIL_BODY = {
  session: 's1',
  continue: 0,
  books: {
    [ISBN]: {
      Shiga_Yasu: { status: 'OK', reserveurl: 'https://lib.example/yasu?isbn=1', libkey: { 野洲: '貸出可', 中主: '貸出中' } },
      Special_Shiga_Ec: { status: 'OK', reserveurl: 'javascript:alert(1)', libkey: {} },
    },
  },
};

let db: ReturnType<typeof createSqliteD1>;
let calil: ReturnType<typeof vi.fn>;

function assets(libraries: unknown = SHIGA) {
  return {
    fetch: vi.fn(async () =>
      new Response(JSON.stringify(libraries), { headers: { 'content-type': 'application/json' } }),
    ),
  };
}

function env(overrides: Record<string, unknown> = {}) {
  return { DB: db, ASSETS: assets(), CALIL_APP_KEY: 'server-secret-key', TRIAL_IP_SALT: 'salt', ...overrides };
}

async function post(body: unknown, e = env(), ip = '203.0.113.7') {
  const pending: Promise<unknown>[] = [];
  const res = await onRequestPost({
    request: new Request('https://libcheck.app/api/trial/check', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    env: e,
    waitUntil: (p: Promise<unknown>) => pending.push(p),
  } as never);
  await Promise.all(pending);
  return res;
}

const VALID = { isbn: ISBN, pref: '滋賀県', city: '野洲市' };

function usage() {
  return db.raw.prepare('SELECT bucket, count FROM trial_usage ORDER BY bucket').all() as {
    bucket: string;
    count: number;
  }[];
}

beforeEach(() => {
  db = createSqliteD1();
  calil = vi.fn(async () => new Response(JSON.stringify(CALIL_BODY), { status: 200 }));
  globalThis.fetch = calil as never;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete (globalThis as { caches?: unknown }).caches;
});

describe('POST /api/trial/check', () => {
  it('市区町村の図書館ごとの貸出状況を返し、上限を加算する', async () => {
    const res = await post(VALID);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      isbn: ISBN,
      complete: true,
      omittedLibraryCount: 0,
      libraries: [
        { name: '野洲市野洲図書館', systemId: 'Shiga_Yasu', libKey: '野洲', libId: '1', status: '貸出可', systemStatus: 'OK', reserveUrl: 'https://lib.example/yasu?isbn=1' },
        { name: '野洲市野洲図書館中主分館', systemId: 'Shiga_Yasu', libKey: '中主', libId: '2', status: '貸出中', systemStatus: 'OK', reserveUrl: 'https://lib.example/yasu?isbn=1' },
        // http(s) 以外の予約 URL は返さない。蔵書が無い館は空文字（蔵書なし）。
        { name: '滋賀県総合教育センター図書資料室', systemId: 'Special_Shiga_Ec', libKey: '教育センター', libId: '3', status: '', systemStatus: 'OK', reserveUrl: null },
      ],
    });
    const url = new URL(String(calil.mock.calls[0][0]));
    expect(url.searchParams.get('systemid')).toBe('Shiga_Yasu,Special_Shiga_Ec');
    expect(url.searchParams.get('appkey')).toBe('server-secret-key');
    // 全体は書籍リクエスト数（1 ISBN × 2 システム）、接続元は回数。
    expect(usage().map((r) => [r.bucket.startsWith('ip:') ? 'ip' : r.bucket, r.count])).toEqual([
      ['global', 2],
      ['ip', 1],
    ]);
  });

  it('接続元の IP はそのまま保存せず、ソルト付きハッシュで保存する', async () => {
    await post(VALID);

    const buckets = usage().map((r) => r.bucket).join(',');
    expect(buckets).not.toContain('203.0.113.7');
    expect(buckets).toMatch(/ip:[0-9a-f]{64}/);
  });

  it.each([
    ['JSON でない本文', '{'],
    ['ISBN が不正', { ...VALID, isbn: '9784003101019' }],
    ['ISBN が無い', { pref: '滋賀県', city: '野洲市' }],
    ['未知の都道府県', { ...VALID, pref: '滋賀' }],
    ['データにない市区町村', { ...VALID, city: '存在しない市' }],
  ])('400: %s（カーリルも上限も使わない）', async (_label, body) => {
    const res = await post(body);

    expect(res.status).toBe(400);
    expect(calil).not.toHaveBeenCalled();
    expect(usage()).toEqual([]);
  });

  it('ISBN のハイフンは取り除いて扱う', async () => {
    const res = await post({ ...VALID, isbn: '978-4-00-310101-8' });

    expect(res.status).toBe(200);
    expect(new URL(String(calil.mock.calls[0][0])).searchParams.get('isbn')).toBe(ISBN);
  });

  it('429: 接続元の上限（5回/時）を超えたらカーリルを呼ばず Retry-After を返す', async () => {
    for (let i = 0; i < 5; i++) expect((await post(VALID)).status).toBe(200);
    calil.mockClear();

    const res = await post(VALID);

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'rate_limited', reason: 'ip' });
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(calil).not.toHaveBeenCalled();
    // 別の接続元は使える。
    expect((await post(VALID, env(), '198.51.100.1')).status).toBe(200);
  });

  it('429: 体験版全体の上限（300書籍リクエスト/時）を超えたらカーリルを呼ばない', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-10T10:30:00Z'));
    const hour = Math.floor(Date.now() / 3_600_000);
    db.raw.prepare("INSERT INTO trial_usage (bucket, hour, count) VALUES ('global', ?, 299)").all(hour);

    const res = await post(VALID); // 2 書籍リクエスト → 301

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'rate_limited', reason: 'global' });
    expect(res.headers.get('retry-after')).toBe('1800');
    expect(calil).not.toHaveBeenCalled();
  });

  it('同じ ISBN・同じ対象システムの2回目はキャッシュから返し、カーリルも上限も使わない', async () => {
    const store = new Map<string, Response>();
    (globalThis as { caches?: unknown }).caches = {
      default: {
        match: async (req: Request) => store.get(req.url)?.clone(),
        put: async (req: Request, res: Response) => {
          store.set(req.url, res);
        },
      },
    };

    const first = await post(VALID);
    const second = await post(VALID);

    expect(second.status).toBe(200);
    expect(second.headers.get('x-trial-cache')).toBe('hit');
    expect(await second.json()).toEqual(await first.json());
    expect(calil).toHaveBeenCalledTimes(1);
    expect(usage().find((r) => r.bucket.startsWith('ip:'))?.count).toBe(1);
  });

  it('502: カーリルの失敗（上限は消費済みのまま、詳細は返さない）', async () => {
    calil.mockImplementation(async () => new Response('down', { status: 503 }));

    const res = await post(VALID);

    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain('server-secret-key');
  });

  it('503: TRIAL_IP_SALT 未設定なら体験版を止める（安全側）', async () => {
    const res = await post(VALID, env({ TRIAL_IP_SALT: undefined }));

    expect(res.status).toBe(503);
    expect(calil).not.toHaveBeenCalled();
  });

  it('500: CALIL_APP_KEY 未設定', async () => {
    const res = await post(VALID, env({ CALIL_APP_KEY: undefined }));

    expect(res.status).toBe(500);
    expect(calil).not.toHaveBeenCalled();
  });
});
