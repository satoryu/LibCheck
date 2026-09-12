import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import type { Library } from '@/domain/models/library';
import type { LibraryStatus } from '@/domain/models/libraryStatus';
import { renderWithProviders } from '@/test/testUtils';
import { LibraryAvailabilityCard } from '@/presentation/widgets/LibraryAvailabilityCard';
import { trackLibraryReservationLinkClick } from '@/analytics/events';

// GA4 計測（#169）。
vi.mock('@/analytics/events', () => ({
  trackIsbnScanSuccess: vi.fn(),
  trackBookSearchResultView: vi.fn(),
  trackLibraryReservationLinkClick: vi.fn(),
  trackAmazonAffiliateLinkClick: vi.fn(),
}));

const library: Library = {
  systemId: 'Tokyo_Minato',
  systemName: '港区図書館',
  libKey: 'みなと',
  libId: '123',
  shortName: 'みなと図書館',
  formalName: '港区立みなと図書館',
  address: '東京都港区芝公園3-2-25',
  pref: '東京都',
  city: '港区',
  category: 'MEDIUM',
};

describe('LibraryAvailabilityCard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('displays library name', () => {
    const status: LibraryStatus = {
      systemId: 'Tokyo_Minato',
      status: AvailabilityStatus.available,
      libKeyStatuses: {},
    };

    renderWithProviders(
      <LibraryAvailabilityCard library={library} status={status} />,
    );

    expect(screen.getByText('港区立みなと図書館')).toBeInTheDocument();
  });

  test('displays availability status badge based on libKey', () => {
    const status: LibraryStatus = {
      systemId: 'Tokyo_Minato',
      status: AvailabilityStatus.available,
      libKeyStatuses: { みなと: '貸出可' },
    };

    renderWithProviders(
      <LibraryAvailabilityCard library={library} status={status} />,
    );

    expect(screen.getByText('貸出可能')).toBeInTheDocument();
  });

  test('displays notFound status when libKey is not in statuses', () => {
    const status: LibraryStatus = {
      systemId: 'Tokyo_Minato',
      status: AvailabilityStatus.available,
      libKeyStatuses: {},
    };

    renderWithProviders(
      <LibraryAvailabilityCard library={library} status={status} />,
    );

    expect(screen.getByText('蔵書なし')).toBeInTheDocument();
  });

  test('displays per-libKey status, not aggregated system status', () => {
    const status: LibraryStatus = {
      systemId: 'Tokyo_Minato',
      status: AvailabilityStatus.available,
      libKeyStatuses: { みなと: '貸出中', しば: '貸出可' },
    };

    renderWithProviders(
      <LibraryAvailabilityCard library={library} status={status} />,
    );

    // The library's libKey is 'みなと', which is '貸出中'.
    // Even though system status is 'available', the card should show '貸出中'.
    expect(screen.getByText('貸出中')).toBeInTheDocument();
  });

  test('displays reserve URL link when reservable status', () => {
    const status: LibraryStatus = {
      systemId: 'Tokyo_Minato',
      status: AvailabilityStatus.available,
      reserveUrl: 'https://example.com/reserve',
      libKeyStatuses: { みなと: '貸出可' },
    };

    renderWithProviders(
      <LibraryAvailabilityCard library={library} status={status} />,
    );

    expect(screen.getByText('予約する')).toBeInTheDocument();
  });

  test('does not display reserve URL link when notFound status', () => {
    const status: LibraryStatus = {
      systemId: 'Tokyo_Minato',
      status: AvailabilityStatus.available,
      reserveUrl: 'https://example.com/reserve',
      libKeyStatuses: {},
    };

    renderWithProviders(
      <LibraryAvailabilityCard library={library} status={status} />,
    );

    // libKey 'みなと' is not in libKeyStatuses, so status is notFound.
    expect(screen.queryByText('予約する')).not.toBeInTheDocument();
  });

  test('does not display reserve URL link when URL has javascript scheme', () => {
    const status: LibraryStatus = {
      systemId: 'Tokyo_Minato',
      status: AvailabilityStatus.available,
      reserveUrl: 'javascript:alert(1)',
      libKeyStatuses: { みなと: '貸出可' },
    };

    renderWithProviders(
      <LibraryAvailabilityCard library={library} status={status} />,
    );

    expect(screen.queryByText('予約する')).not.toBeInTheDocument();
  });

  test('予約は新しいタブで開く安全なリンクとして描画される', () => {
    const status: LibraryStatus = {
      systemId: 'Tokyo_Minato',
      status: AvailabilityStatus.available,
      reserveUrl: 'https://example.com/reserve',
      libKeyStatuses: { みなと: '貸出可' },
    };

    renderWithProviders(
      <LibraryAvailabilityCard library={library} status={status} />,
    );

    const link = screen.getByRole('link', { name: '予約する' });
    expect(link).toHaveAttribute('href', 'https://example.com/reserve');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel') ?? '').toContain('noopener');
  });
});

describe('LibraryAvailabilityCard カーリルへのリンク（#156）', () => {
  // カーリル図書館APIの仕様上、APIで取得した図書館名を表示する場合は
  // カーリルへのリンクが必須。図書館名そのものをリンクにして担保する。
  // https://calil.jp/doc/api_ref.html
  const status: LibraryStatus = {
    systemId: 'Tokyo_Minato',
    status: AvailabilityStatus.available,
    libKeyStatuses: { みなと: '貸出可' },
  };

  test('図書館名がカーリルの図書館ページへのリンクになっている', () => {
    renderWithProviders(
      <LibraryAvailabilityCard library={library} status={status} />,
    );

    const link = screen.getByRole('link', { name: '港区立みなと図書館' });
    expect(link).toHaveAttribute(
      'href',
      `https://calil.jp/library/123/${encodeURIComponent('港区立みなと図書館')}`,
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel') ?? '').toContain('noopener');
  });

  test('libId が欠けていても systemId と libKey によるリンクを描画する', () => {
    renderWithProviders(
      <LibraryAvailabilityCard library={{ ...library, libId: '' }} status={status} />,
    );

    const link = screen.getByRole('link', { name: '港区立みなと図書館' });
    expect(link).toHaveAttribute(
      'href',
      `https://calil.jp/library/search?s=Tokyo_Minato&k=${encodeURIComponent(
        'みなと',
      )}`,
    );
  });
});

describe('LibraryAvailabilityCard GA4 計測（#169）', () => {
  const trackClick = vi.mocked(trackLibraryReservationLinkClick);

  beforeEach(() => {
    trackClick.mockClear();
  });

  test('「予約する」のクリックを1回だけ計測する', async () => {
    const status: LibraryStatus = {
      systemId: 'Tokyo_Minato',
      status: AvailabilityStatus.available,
      reserveUrl: 'https://example.com/reserve',
      libKeyStatuses: { みなと: '貸出可' },
    };

    const { user } = renderWithProviders(
      <LibraryAvailabilityCard library={library} status={status} />,
    );

    await user.click(screen.getByRole('link', { name: '予約する' }));

    expect(trackClick).toHaveBeenCalledTimes(1);
  });

  test('カーリルへのリンクバック（図書館名）では計測しない', async () => {
    const status: LibraryStatus = {
      systemId: 'Tokyo_Minato',
      status: AvailabilityStatus.available,
      reserveUrl: 'https://example.com/reserve',
      libKeyStatuses: { みなと: '貸出可' },
    };

    const { user } = renderWithProviders(
      <LibraryAvailabilityCard library={library} status={status} />,
    );

    await user.click(screen.getByRole('link', { name: '港区立みなと図書館' }));

    expect(trackClick).not.toHaveBeenCalled();
  });
});
