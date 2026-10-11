import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

import { buildExpectedSitemapXml, diffSitemapUrls } from './generateSitemap.mjs';

/**
 * コミット済みの public/sitemap.xml が、生成元（図書館データ・ガイドの HTML）と
 * 一致しているかを確かめる（#193）。sitemap は `npm run generate:sitemap` で作り直して
 * コミットする運用のため、作り直し忘れをここ（CI の npm test）で検知する。
 */
const SITEMAP_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/sitemap.xml');
const MAX_LISTED = 10;

function describeUrls(label, urls) {
  if (urls.length === 0) return '';
  const listed = urls.slice(0, MAX_LISTED).map((url) => `  - ${url}`).join('\n');
  const more = urls.length > MAX_LISTED ? `\n  …ほか ${urls.length - MAX_LISTED} 件` : '';
  return `${label}（${urls.length} 件）:\n${listed}${more}\n`;
}

describe('public/sitemap.xml（#193）', () => {
  test('生成元（図書館データ・ガイドの HTML）と URL が一致している', async () => {
    const committed = await readFile(SITEMAP_PATH, 'utf-8');
    const { missing, extra } = diffSitemapUrls(committed, await buildExpectedSitemapXml());

    const message =
      'public/sitemap.xml が生成元とずれています。' +
      '`npm run generate:sitemap -- --lastmod=YYYY-MM-DD` を実行してコミットしてください。\n' +
      describeUrls('足りない URL', missing) +
      describeUrls('余分な URL', extra);
    expect({ missing, extra }, message).toEqual({ missing: [], extra: [] });
  });
});
