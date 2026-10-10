import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { GUIDE_PAGES, guideHref } from '@/presentation/guide/guidePages';
import { GuideLinks } from '@/presentation/widgets/GuideLinks';

describe('GuideLinks（#184）', () => {
  it('見出しと、3本の使い方ガイドへのリンク（静的ページなので通常の <a href>）を表示する', () => {
    render(<GuideLinks />);

    const section = screen.getByRole('region', { name: '使い方ガイド' });
    for (const guide of GUIDE_PAGES) {
      expect(within(section).getByRole('link', { name: guide.title })).toHaveAttribute(
        'href',
        guideHref(guide.slug),
      );
      expect(within(section).getByText(guide.summary)).toBeInTheDocument();
    }
  });
});
