#!/usr/bin/env node
/**
 * 図書館データ（都道府県×市区町村×図書館一覧）を静的JSON化するスクリプト（#158）。
 *
 * 地域ページ（未ログインで公開）の閲覧時にカーリル API を一切呼ばずに済むよう、
 * ビルド前提でこのスクリプトを手元で実行し、結果をリポジトリにコミットする。
 * データ静的化方式の検討・採用理由は docs/158-regional-pages/requirements.md
 * を参照（① 手動スクリプト・随時更新を採用。カーリル自身が /library を
 * 「準静的」と説明しており、頻繁な自動更新は不要と判断）。
 *
 * 実行方法:
 *   node --env-file=.env.local scripts/generateLibraryData.mjs
 *
 * .env.local の CALIL_APP_KEY を読む。値はログに一切出力しない。
 * カーリルへの配慮として、都道府県ごとのリクエスト間隔を空ける
 * （REQUEST_INTERVAL_MS）。
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeSitemap } from './generateSitemap.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'public', 'data', 'libraries');
const CALIL_LIBRARY_ENDPOINT = 'https://api.calil.jp/library';
const REQUEST_INTERVAL_MS = 500;

/**
 * 全47都道府県。`src/domain/data/japanesePrefectures.ts` の
 * `JAPANESE_PREFECTURE_REGIONS` と同じ内容（意図的に複製）。
 * このスクリプトは素の Node で動かすため TS モジュールを import せず、
 * Node バージョンに依存しない形にしている。都道府県が増減することは
 * 実質無いが、`japanesePrefectures.ts` を変更した場合はこちらも
 * 合わせて更新すること。
 */
export const JAPANESE_PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県',
  '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

/**
 * カーリル `/library` の生レスポンス1件（snake_case）を、アプリの `Library`
 * 型（camelCase）に変換する。
 *
 * `src/data/models/libraryResponse.ts` の `libraryResponseFromJson` と
 * `src/data/repositories/libraryRepositoryImpl.ts` の既存マッピングに対応する
 * （このスクリプトは素の Node で動かすため TS モジュールを import できず、
 * 意図的に複製している。フィールドを増減した場合は両方を更新すること）。
 */
export function mapCalilLibraryToLibrary(raw) {
  const str = (v) => (typeof v === 'string' ? v : '');
  const optStr = (v) => (typeof v === 'string' ? v : undefined);

  return {
    systemId: str(raw.systemid),
    systemName: str(raw.systemname),
    libKey: str(raw.libkey),
    libId: str(raw.libid),
    shortName: str(raw.short),
    formalName: str(raw.formal),
    address: str(raw.address),
    pref: str(raw.pref),
    city: str(raw.city),
    category: str(raw.category),
    url: optStr(raw.url_pc),
    tel: optStr(raw.tel),
    geocode: optStr(raw.geocode),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLibrariesForPrefecture(pref, appKey) {
  const url = new URL(CALIL_LIBRARY_ENDPOINT);
  url.searchParams.set('appkey', appKey);
  url.searchParams.set('pref', pref);
  url.searchParams.set('format', 'json');
  url.searchParams.set('callback', 'no');

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`カーリル /library への問い合わせに失敗しました（${pref}）: ${res.status}`);
  }
  const body = await res.json();
  if (!Array.isArray(body)) {
    throw new Error(`カーリル /library のレスポンス形式が想定外です（${pref}）`);
  }
  return body.map(mapCalilLibraryToLibrary);
}

async function main() {
  const appKey = process.env.CALIL_APP_KEY;
  if (!appKey) {
    console.error(
      '環境変数 CALIL_APP_KEY が設定されていません。' +
        '`node --env-file=.env.local scripts/generateLibraryData.mjs` のように実行してください。',
    );
    process.exitCode = 1;
    return;
  }

  const prefectures = JAPANESE_PREFECTURES;

  await mkdir(OUTPUT_DIR, { recursive: true });

  const librariesByPrefecture = {};
  let totalLibraries = 0;

  for (const [index, pref] of prefectures.entries()) {
    process.stdout.write(`[${index + 1}/${prefectures.length}] ${pref} を取得中...\n`);
    const libraries = await fetchLibrariesForPrefecture(pref, appKey);
    totalLibraries += libraries.length;

    librariesByPrefecture[pref] = libraries;

    const outPath = path.join(OUTPUT_DIR, `${pref}.json`);
    await writeFile(outPath, JSON.stringify(libraries), 'utf-8');

    if (index < prefectures.length - 1) {
      await sleep(REQUEST_INTERVAL_MS);
    }
  }

  // sitemap.xml は図書館データから scripts/generateSitemap.mjs と同じ方法で
  // 生成する（#182）。lastmod は実行日。
  const urlCount = await writeSitemap({
    librariesByPrefecture,
    lastmod: new Date().toISOString().slice(0, 10),
  });

  const cityCount = Object.values(librariesByPrefecture)
    .map((libraries) => new Set(libraries.map((lib) => lib.city)).size)
    .reduce((a, b) => a + b, 0);
  console.log(
    `完了: ${prefectures.length}都道府県、図書館 ${totalLibraries}件、` +
      `市区町村 ${cityCount}件。sitemap.xml を更新しました（${urlCount} URL）。`,
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  });
}
