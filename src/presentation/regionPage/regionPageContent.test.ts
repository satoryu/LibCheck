import { describe, expect, it } from 'vitest';

import type { Library } from '../../domain/models/library';
import {
  buildCityPageContent,
  buildPrefectureIndexContent,
  buildPrefecturePageContent,
  isKnownPrefecture,
  regionPath,
} from './regionPageContent';

function lib(overrides: Partial<Library> & Pick<Library, 'city' | 'formalName'>): Library {
  return {
    systemId: 'Shiga_Yasu',
    systemName: '滋賀県野洲市',
    libKey: overrides.formalName,
    libId: overrides.formalName,
    shortName: overrides.formalName,
    address: `滋賀県${overrides.city}1-1`,
    pref: '滋賀県',
    category: 'MEDIUM',
    ...overrides,
  };
}

const SHIGA: Library[] = [
  lib({ city: '野洲市', formalName: '野洲市野洲図書館 ', tel: '077-586-0218', geocode: '136.03,35.06' }),
  lib({ city: '野洲市', formalName: '野洲市野洲図書館中主分館' }),
  lib({ city: '野洲市', formalName: '滋賀県総合教育センター図書資料室', category: 'SPECIAL' }),
  lib({ city: '大津市', formalName: '大津市立図書館' }),
  lib({ city: '大津市', formalName: '大津市立和邇図書館' }),
  lib({ city: '湖南市', formalName: '湖南市立甲西図書館' }),
];

const FORBIDDEN_WORDS = ['蔵書を検索', '蔵書検索'];

describe('regionPath', () => {
  it('都道府県・市区町村を encodeURIComponent したパスを返す', () => {
    expect(regionPath()).toBe('/library/add');
    expect(regionPath('滋賀県')).toBe(`/library/add/${encodeURIComponent('滋賀県')}`);
    expect(regionPath('滋賀県', '野洲市')).toBe(
      `/library/add/${encodeURIComponent('滋賀県')}/${encodeURIComponent('野洲市')}`,
    );
  });
});

describe('isKnownPrefecture', () => {
  it('47都道府県だけを既知とする', () => {
    expect(isKnownPrefecture('滋賀県')).toBe(true);
    expect(isKnownPrefecture('北海道')).toBe(true);
    expect(isKnownPrefecture('滋賀')).toBe(false);
    expect(isKnownPrefecture('')).toBe(false);
  });
});

describe('buildCityPageContent', () => {
  it('館数・館名（前後の空白を除く）を含む title / description / h1 を返す', () => {
    const content = buildCityPageContent('滋賀県', '野洲市', SHIGA);
    if (content.kind !== 'city') throw new Error('city を期待');

    expect(content.title).toBe(
      '滋賀県野洲市の図書館に対応｜本のバーコードで予約可否をチェック — LibCheck',
    );
    expect(content.h1).toBe('滋賀県野洲市の図書館（3館）');
    expect(content.description).toBe(
      '滋賀県野洲市の図書館3館（野洲市野洲図書館、野洲市野洲図書館中主分館、滋賀県総合教育センター図書資料室）に対応。本のバーコードを読み取るだけで、登録した図書館で借りられるか・予約できるかをまとめて確認できます。',
    );
    expect(content.libraries.map((l) => l.name)).toEqual([
      '野洲市野洲図書館',
      '野洲市野洲図書館中主分館',
      '滋賀県総合教育センター図書資料室',
    ]);
    expect(content.libraries[0]).toMatchObject({ tel: '077-586-0218', geocode: '136.03,35.06' });
  });

  it('4館以上のときは館名を3件までにして「ほか」を付ける', () => {
    const many = [
      ...SHIGA,
      lib({ city: '野洲市', formalName: '4館目図書館' }),
    ];
    const content = buildCityPageContent('滋賀県', '野洲市', many);
    if (content.kind !== 'city') throw new Error('city を期待');

    expect(content.description).toContain(
      '（野洲市野洲図書館、野洲市野洲図書館中主分館、滋賀県総合教育センター図書資料室ほか）',
    );
    expect(content.description).not.toContain('4館目図書館');
  });

  it('パンくずは トップ > 都道府県から探す > 都道府県 > 市区町村', () => {
    const content = buildCityPageContent('滋賀県', '野洲市', SHIGA);
    if (content.kind !== 'city') throw new Error('city を期待');

    expect(content.breadcrumbs).toEqual([
      { name: 'トップ', path: '/' },
      { name: '都道府県から探す', path: regionPath() },
      { name: '滋賀県', path: regionPath('滋賀県') },
      { name: '野洲市', path: regionPath('滋賀県', '野洲市') },
    ]);
  });

  it('同じ都道府県の他の市区町村を、自分を除き館数付き・名前順で返す', () => {
    const content = buildCityPageContent('滋賀県', '野洲市', SHIGA);
    if (content.kind !== 'city') throw new Error('city を期待');

    expect(content.otherCities).toEqual([
      { name: '大津市', path: regionPath('滋賀県', '大津市'), libraryCount: 2 },
      { name: '湖南市', path: regionPath('滋賀県', '湖南市'), libraryCount: 1 },
    ]);
  });

  it('体験版（#183）の見出しと説明を返す', () => {
    const content = buildCityPageContent('滋賀県', '野洲市', SHIGA);
    if (content.kind !== 'city') throw new Error('city を期待');

    expect(content.trial).toEqual({
      heading: 'この本、野洲市の図書館で借りられる？',
      description:
        '本の裏表紙にある ISBN（978 で始まる13桁の番号）を入力すると、野洲市の図書館で借りられるか・予約できるかを、ログインせずに1冊調べられます。',
    });
  });

  it('未知の都道府県・データにない市区町村は notFound', () => {
    expect(buildCityPageContent('滋賀', '野洲市', SHIGA).kind).toBe('notFound');
    expect(buildCityPageContent('滋賀県', '存在しない市', SHIGA).kind).toBe('notFound');
  });
});

describe('buildPrefecturePageContent', () => {
  it('市区町村数・館数を含む文言と、館数付きの市区町村リンクを返す', () => {
    const content = buildPrefecturePageContent('滋賀県', SHIGA);
    if (content.kind !== 'prefecture') throw new Error('prefecture を期待');

    expect(content.title).toBe(
      '滋賀県の図書館に対応｜市区町村から選んで予約可否をチェック — LibCheck',
    );
    expect(content.h1).toBe('滋賀県の図書館（3市区町村・6館）');
    expect(content.description).toBe(
      '滋賀県の3市区町村・図書館6館に対応。市区町村を選んで図書館を登録すると、本のバーコードを読み取るだけで借りられるか・予約できるかを確認できます。',
    );
    expect(content.cities).toEqual([
      { name: '大津市', path: regionPath('滋賀県', '大津市'), libraryCount: 2 },
      { name: '湖南市', path: regionPath('滋賀県', '湖南市'), libraryCount: 1 },
      { name: '野洲市', path: regionPath('滋賀県', '野洲市'), libraryCount: 3 },
    ]);
    expect(content.breadcrumbs.map((b) => b.name)).toEqual(['トップ', '都道府県から探す', '滋賀県']);
  });

  it('未知の都道府県・図書館0館の都道府県は notFound', () => {
    expect(buildPrefecturePageContent('滋賀', SHIGA).kind).toBe('notFound');
    expect(buildPrefecturePageContent('滋賀県', []).kind).toBe('notFound');
  });
});

describe('buildPrefectureIndexContent', () => {
  it('47都道府県を地方ごとにリンク付きで返す', () => {
    const content = buildPrefectureIndexContent();

    expect(content.h1).toBe('対応している図書館を都道府県から探す');
    expect(content.title).toBe('対応している図書館を都道府県から探す — LibCheck');
    expect(content.regions.flatMap((r) => r.prefectures)).toHaveLength(47);
    expect(content.regions[0].prefectures[0]).toEqual({ name: '北海道', path: regionPath('北海道') });
    expect(content.breadcrumbs.map((b) => b.name)).toEqual(['トップ', '都道府県から探す']);
  });
});

describe('文言', () => {
  it('アプリにない機能（キーワードでの蔵書検索）を連想させる語を含まない', () => {
    const texts = [
      buildCityPageContent('滋賀県', '野洲市', SHIGA),
      buildPrefecturePageContent('滋賀県', SHIGA),
      buildPrefectureIndexContent(),
    ].flatMap((c) => [
      c.title,
      c.h1,
      ...('description' in c ? [c.description] : []),
      ...('trial' in c ? [c.trial.heading, c.trial.description] : []),
    ]);

    for (const text of texts) {
      for (const word of FORBIDDEN_WORDS) {
        expect(text).not.toContain(word);
      }
    }
  });
});
