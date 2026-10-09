/**
 * 地域ページ（`/library/add` 以下）の文言とページ内容を組み立てる純粋関数（#182）。
 *
 * Pages Functions（`functions/_middleware.js`）と SPA の両方から import し、
 * JS 非実行の配信 HTML と JS 実行後の描画が同じ内容になるようにする。
 * Functions のバンドルは tsconfig の paths を解決しないため、`@/` エイリアスは
 * 使わず相対パスで import すること（docs/182-region-page-structure/design.md）。
 *
 * 文言はアプリの実際の機能（本のバーコードで、登録した図書館の貸出・予約の
 * 可否を確認する）に沿わせる。キーワードでの蔵書検索ができるように読める
 * 表現（「蔵書を検索」等）は使わない（#181）。
 */
import { JAPANESE_PREFECTURE_REGIONS } from '../../domain/data/japanesePrefectures';
import type { Library } from '../../domain/models/library';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface RegionLibrary {
  name: string;
  address: string;
  category: string;
  url?: string;
  tel?: string;
  geocode?: string;
}

export interface RegionCityLink {
  name: string;
  path: string;
  libraryCount: number;
}

export interface CityPageContent {
  kind: 'city';
  pref: string;
  city: string;
  title: string;
  description: string;
  h1: string;
  breadcrumbs: BreadcrumbItem[];
  libraries: RegionLibrary[];
  otherCities: RegionCityLink[];
}

export interface PrefecturePageContent {
  kind: 'prefecture';
  pref: string;
  title: string;
  description: string;
  h1: string;
  breadcrumbs: BreadcrumbItem[];
  cities: RegionCityLink[];
  libraryCount: number;
}

export interface PrefectureIndexContent {
  kind: 'index';
  title: string;
  description: string;
  h1: string;
  breadcrumbs: BreadcrumbItem[];
  regions: { name: string; prefectures: { name: string; path: string }[] }[];
}

export interface NotFoundContent {
  kind: 'notFound';
  title: string;
  h1: string;
}

const SITE_SUFFIX = ' — LibCheck';

/** アプリの機能の一言説明。データ読み込み前の案内などに使う。 */
export const APP_SUMMARY =
  '本のバーコードを読み取るだけで、登録した図書館で借りられるか・予約できるかを確認できます。';
const INDEX_NAME = '都道府県から探す';
const INDEX_HEADING = '対応している図書館を都道府県から探す';
/** description に列挙する館名の上限。 */
const MAX_NAMED_LIBRARIES = 3;

const KNOWN_PREFECTURES: ReadonlySet<string> = new Set(
  JAPANESE_PREFECTURE_REGIONS.flatMap((region) => region.prefectures),
);

const NOT_FOUND: NotFoundContent = {
  kind: 'notFound',
  title: `ページが見つかりません${SITE_SUFFIX}`,
  h1: 'この地域の図書館は見つかりませんでした',
};

export function isKnownPrefecture(pref: string): boolean {
  return KNOWN_PREFECTURES.has(pref);
}

/** 地域ページのパス（各セグメントは encodeURIComponent 済み）。 */
export function regionPath(pref?: string, city?: string): string {
  let path = '/library/add';
  if (pref !== undefined) path += `/${encodeURIComponent(pref)}`;
  if (city !== undefined) path += `/${encodeURIComponent(city)}`;
  return path;
}

export function regionBreadcrumbs(pref?: string, city?: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { name: 'トップ', path: '/' },
    { name: INDEX_NAME, path: regionPath() },
  ];
  if (pref !== undefined) items.push({ name: pref, path: regionPath(pref) });
  if (pref !== undefined && city !== undefined) {
    items.push({ name: city, path: regionPath(pref, city) });
  }
  return items;
}

/** 市区町村名 → 館数（名前順）。旧 `useCityList` と同じ並び順（文字列ソート）。 */
function cityLinks(pref: string, prefLibraries: Library[]): RegionCityLink[] {
  const counts = new Map<string, number>();
  for (const library of prefLibraries) {
    counts.set(library.city, (counts.get(library.city) ?? 0) + 1);
  }
  return Array.from(counts.keys())
    .sort()
    .map((city) => ({
      name: city,
      path: regionPath(pref, city),
      libraryCount: counts.get(city) ?? 0,
    }));
}

function toRegionLibrary(library: Library): RegionLibrary {
  return {
    // データに '野洲市野洲図書館 ' のような前後の空白があるため除く。
    name: library.formalName.trim(),
    address: library.address,
    category: library.category,
    url: library.url,
    tel: library.tel,
    geocode: library.geocode,
  };
}

export function buildCityPageContent(
  pref: string,
  city: string,
  prefLibraries: Library[],
): CityPageContent | NotFoundContent {
  if (!isKnownPrefecture(pref)) return NOT_FOUND;
  const libraries = prefLibraries.filter((l) => l.city === city).map(toRegionLibrary);
  if (libraries.length === 0) return NOT_FOUND;

  const place = `${pref}${city}`;
  const named = libraries.slice(0, MAX_NAMED_LIBRARIES).map((l) => l.name).join('、');
  const more = libraries.length > MAX_NAMED_LIBRARIES ? 'ほか' : '';

  return {
    kind: 'city',
    pref,
    city,
    title: `${place}の図書館に対応｜本のバーコードで予約可否をチェック${SITE_SUFFIX}`,
    description:
      `${place}の図書館${libraries.length}館（${named}${more}）に対応。` +
      '本のバーコードを読み取るだけで、登録した図書館で借りられるか・予約できるかをまとめて確認できます。',
    h1: `${place}の図書館（${libraries.length}館）`,
    breadcrumbs: regionBreadcrumbs(pref, city),
    libraries,
    otherCities: cityLinks(pref, prefLibraries).filter((c) => c.name !== city),
  };
}

export function buildPrefecturePageContent(
  pref: string,
  prefLibraries: Library[],
): PrefecturePageContent | NotFoundContent {
  if (!isKnownPrefecture(pref) || prefLibraries.length === 0) return NOT_FOUND;

  const cities = cityLinks(pref, prefLibraries);
  const scale = `${cities.length}市区町村・図書館${prefLibraries.length}館`;

  return {
    kind: 'prefecture',
    pref,
    title: `${pref}の図書館に対応｜市区町村から選んで予約可否をチェック${SITE_SUFFIX}`,
    description:
      `${pref}の${scale}に対応。` +
      '市区町村を選んで図書館を登録すると、本のバーコードを読み取るだけで借りられるか・予約できるかを確認できます。',
    h1: `${pref}の図書館（${cities.length}市区町村・${prefLibraries.length}館）`,
    breadcrumbs: regionBreadcrumbs(pref),
    cities,
    libraryCount: prefLibraries.length,
  };
}

export function buildPrefectureIndexContent(): PrefectureIndexContent {
  return {
    kind: 'index',
    title: `${INDEX_HEADING}${SITE_SUFFIX}`,
    description:
      '全国の公共図書館・大学図書館などに対応しています。' +
      '都道府県・市区町村を選んで図書館を登録すると、本のバーコードを読み取るだけで借りられるか・予約できるかを確認できます。',
    h1: INDEX_HEADING,
    breadcrumbs: regionBreadcrumbs(),
    regions: JAPANESE_PREFECTURE_REGIONS.map((region) => ({
      name: region.name,
      prefectures: region.prefectures.map((pref) => ({ name: pref, path: regionPath(pref) })),
    })),
  };
}
