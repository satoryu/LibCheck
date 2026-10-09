import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { regionPath } from '@/presentation/regionPage/regionPageContent';
import { RegionLinks } from '@/presentation/landing/RegionLinks';

describe('RegionLinks（#182）', () => {
  it('都道府県一覧と47都道府県ページへのリンクを表示する', () => {
    render(
      <MemoryRouter>
        <RegionLinks />
      </MemoryRouter>,
    );

    const section = screen.getByRole('region', { name: '対応している図書館を地域から探す' });
    expect(within(section).getByRole('link', { name: '都道府県から探す' })).toHaveAttribute(
      'href',
      regionPath(),
    );
    const prefLinks = within(section)
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') !== regionPath());
    expect(prefLinks).toHaveLength(47);
    expect(within(section).getByRole('link', { name: '滋賀県' })).toHaveAttribute(
      'href',
      regionPath('滋賀県'),
    );
  });
});
