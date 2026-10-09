import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { regionBreadcrumbs, regionPath } from '@/presentation/regionPage/regionPageContent';
import { RegionBreadcrumbs } from '@/presentation/widgets/RegionBreadcrumbs';

describe('RegionBreadcrumbs', () => {
  it('最後以外はリンク、最後は現在のページとして表示する', () => {
    render(
      <MemoryRouter>
        <RegionBreadcrumbs items={regionBreadcrumbs('滋賀県', '野洲市')} />
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation', { name: 'パンくずリスト' });
    expect(within(nav).getByRole('link', { name: 'トップ' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: '都道府県から探す' })).toHaveAttribute(
      'href',
      regionPath(),
    );
    expect(within(nav).getByRole('link', { name: '滋賀県' })).toHaveAttribute(
      'href',
      regionPath('滋賀県'),
    );
    expect(within(nav).queryByRole('link', { name: '野洲市' })).toBeNull();
    expect(within(nav).getByText('野洲市')).toHaveAttribute('aria-current', 'page');
  });
});
