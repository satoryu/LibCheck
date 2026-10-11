#!/usr/bin/env node
/**
 * sitemap.xml を静的な図書館データ（public/data/libraries/*.json）から生成する（#182）。
 *
 * 以前は scripts/generateLibraryData.mjs がカーリル API からデータを取得する
 * ついでに生成していたが、sitemap の構成（lastmod・priority）を変えるたびに
 * API を叩かずに済むよう分離した。generateLibraryData.mjs も JSON を書き出した
 * あとにこのモジュールの buildSitemapXml を使う（依存はその一方向だけ）。
 *
 * 実行方法（API キー不要）:
 *   npm run generate:sitemap -- --lastmod=2026-10-10
 *
 * `--lastmod` を省略すると実行日（UTC）を使う。内容が変わったページの
 * lastmod を更新するときに実行し、結果をコミットする。
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const LIBRARIES_DIR = path.join(REPO_ROOT, 'public', 'data', 'libraries');
const SITEMAP_PATH = path.join(REPO_ROOT, 'public', 'sitemap.xml');
const GUIDE_DIR = path.join(REPO_ROOT, 'public', 'guide');
const BASE_URL = 'https://libcheck.app';
const CHANGEFREQ = 'monthly';

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function urlEntry(loc, { lastmod, priority }) {
  const parts = [
    `<loc>${escapeXml(loc)}</loc>`,
    `<lastmod>${lastmod}</lastmod>`,
    `<changefreq>${CHANGEFREQ}</changefreq>`,
    `<priority>${priority}</priority>`,
  ];
  return `  <url>\n    ${parts.join('\n    ')}\n  </url>`;
}

/**
 * 市区町村ページの priority を館数で段階化する（#173 から引き継ぎ）。
 * 館数の多い自治体ほどページの内容が厚いため、クロールの優先度を上げる。
 */
export function cityPriority(libraryCount) {
  if (libraryCount >= 10) return '0.6';
  if (libraryCount >= 5) return '0.5';
  if (libraryCount >= 2) return '0.4';
  return '0.3';
}

/**
 * sitemap.xml の全文を生成する。
 *
 * `librariesByPrefecture` は都道府県名 → 図書館配列（`city` を持つ）のマップ。
 * 図書館が0館の都道府県・市区町村はページが noindex になるため出力しない（#182）。
 * 市区町村は名前順（地域ページの一覧と同じ並び）。
 * `guideSlugs` は使い方ガイド（#184、public/guide/{slug}.html）のスラッグ。
 * 本番の Pages は `.html` を拡張子なしへ 308 で転送するため、拡張子なしで出す。
 */
export function buildSitemapXml({ baseUrl, librariesByPrefecture, guideSlugs = [], lastmod }) {
  const urls = [
    urlEntry(`${baseUrl}/`, { lastmod, priority: '1.0' }),
    urlEntry(`${baseUrl}/library/add`, { lastmod, priority: '0.8' }),
    ...guideSlugs.map((slug) => urlEntry(`${baseUrl}/guide/${slug}`, { lastmod, priority: '0.6' })),
  ];

  for (const [pref, libraries] of Object.entries(librariesByPrefecture)) {
    if (libraries.length === 0) continue;
    const prefUrl = `${baseUrl}/library/add/${encodeURIComponent(pref)}`;
    urls.push(urlEntry(prefUrl, { lastmod, priority: '0.7' }));

    const counts = new Map();
    for (const library of libraries) {
      counts.set(library.city, (counts.get(library.city) ?? 0) + 1);
    }
    for (const city of Array.from(counts.keys()).sort()) {
      urls.push(
        urlEntry(`${prefUrl}/${encodeURIComponent(city)}`, {
          lastmod,
          priority: cityPriority(counts.get(city)),
        }),
      );
    }
  }

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') +
    '\n</urlset>\n'
  );
}

function unescapeXml(value) {
  return value
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&');
}

/** sitemap の `<loc>` の中身（XML のエスケープを戻したもの）を集合で返す（#193）。 */
export function extractSitemapUrls(xml) {
  return new Set(Array.from(xml.matchAll(/<loc>([^<]*)<\/loc>/g), (m) => unescapeXml(m[1])));
}

/**
 * コミット済みの sitemap と、生成元から作った sitemap の URL の過不足を返す（#193）。
 * lastmod・priority・changefreq は比べない（lastmod は作り直した日で変わるため）。
 *
 * @returns {{missing: string[], extra: string[]}} missing はあるべきなのに無い URL、extra はその逆（名前順）
 */
export function diffSitemapUrls(committedXml, expectedXml) {
  const committed = extractSitemapUrls(committedXml);
  const expected = extractSitemapUrls(expectedXml);
  return {
    missing: [...expected].filter((url) => !committed.has(url)).sort(),
    extra: [...committed].filter((url) => !expected.has(url)).sort(),
  };
}

/** `--lastmod=YYYY-MM-DD` を読む。無ければ `now` の日付（UTC）。 */
export function parseLastmodArg(argv, now) {
  const arg = argv.find((a) => a.startsWith('--lastmod='));
  if (arg === undefined) return now.toISOString().slice(0, 10);
  const value = arg.slice('--lastmod='.length);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`--lastmod は YYYY-MM-DD 形式で指定してください: ${value}`);
  }
  return value;
}

/** `dir` の `{pref}.json` を読み、都道府県名 → 図書館配列のマップを返す。 */
export async function readLibrariesByPrefecture(dir) {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  const result = {};
  for (const file of files) {
    result[file.slice(0, -'.json'.length)] = JSON.parse(await readFile(path.join(dir, file), 'utf-8'));
  }
  return result;
}

/** `dir` の `*.html` のファイル名（拡張子なし）を名前順で返す。 */
export async function readGuideSlugs(dir) {
  return (await readdir(dir))
    .filter((f) => f.endsWith('.html'))
    .map((f) => f.slice(0, -'.html'.length))
    .sort();
}

/**
 * 生成元から sitemap.xml を組み立てる。`librariesByPrefecture` を省略すると
 * public/data/libraries/*.json を読む。使い方ガイドは public/guide/*.html の
 * ファイル一覧から作るため、ページを足したときに更新漏れが起きない。
 */
async function buildSitemapFromSources({ librariesByPrefecture, lastmod }) {
  return buildSitemapXml({
    baseUrl: BASE_URL,
    librariesByPrefecture: librariesByPrefecture ?? (await readLibrariesByPrefecture(LIBRARIES_DIR)),
    guideSlugs: await readGuideSlugs(GUIDE_DIR),
    lastmod,
  });
}

/**
 * 生成元から「あるべき sitemap」を作る（#193 の作り直し忘れの検知用）。
 * 比べるのは URL だけなので、lastmod は固定値でよい。
 */
export async function buildExpectedSitemapXml() {
  return buildSitemapFromSources({ lastmod: '1970-01-01' });
}

/** 図書館データと使い方ガイドから sitemap.xml を書き出す（generateLibraryData.mjs からも使う）。 */
export async function writeSitemap({ librariesByPrefecture, lastmod }) {
  const xml = await buildSitemapFromSources({ librariesByPrefecture, lastmod });
  await writeFile(SITEMAP_PATH, xml, 'utf-8');
  return (xml.match(/<url>/g) ?? []).length;
}

async function main() {
  const lastmod = parseLastmodArg(process.argv.slice(2), new Date());
  const count = await writeSitemap({ lastmod });
  console.log(`sitemap.xml を更新しました（${count} URL、lastmod ${lastmod}）。`);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  });
}
