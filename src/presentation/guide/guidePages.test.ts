import { describe, expect, it } from 'vitest';

import { GUIDE_PAGES, guideHref } from './guidePages';

describe('GUIDE_PAGES（#184）', () => {
  it('3本の使い方ガイドを、承認済みの見出しで持つ', () => {
    expect(GUIDE_PAGES.map((g) => [g.slug, g.title])).toEqual([
      ['bookstore', '本屋で見つけた本が、図書館で借りられるか調べる'],
      ['barcode', '本のバーコードを読むだけで、図書館の予約可否を確認する'],
      ['nearby-libraries', '近くの図書館をまとめて登録して、一度に確認する'],
    ]);
    for (const guide of GUIDE_PAGES) expect(guide.summary.length).toBeGreaterThan(0);
  });

  it('リンクは .html 付き（拡張子なしは本番の Pages にしか無いため）', () => {
    expect(guideHref('bookstore')).toBe('/guide/bookstore.html');
  });
});
