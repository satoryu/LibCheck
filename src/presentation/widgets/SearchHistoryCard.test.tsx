import { describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';

import type { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';
import { renderWithProviders } from '@/test/testUtils';
import { SearchHistoryCard } from '@/presentation/widgets/SearchHistoryCard';

describe('SearchHistoryCard', () => {
  test('displays ISBN', () => {
    const entry: SearchHistoryEntry = {
      isbn: '9784003101018',
      searchedAt: new Date(2026, 1, 15, 10, 30),
      libraryStatuses: { Tokyo_Chiyoda: 'available' },
    };

    renderWithProviders(<SearchHistoryCard entry={entry} onTap={() => {}} />);

    expect(screen.getByText(/9784003101018/)).toBeInTheDocument();
  });

  test('displays time for today', () => {
    const now = new Date(2026, 1, 15, 14, 0);
    const entry: SearchHistoryEntry = {
      isbn: '9784003101018',
      searchedAt: new Date(2026, 1, 15, 10, 30),
      libraryStatuses: {},
    };

    renderWithProviders(
      <SearchHistoryCard entry={entry} onTap={() => {}} now={now} />,
    );

    expect(screen.getByText('10:30')).toBeInTheDocument();
  });

  test('displays "昨日" for yesterday', () => {
    const now = new Date(2026, 1, 15, 14, 0);
    const entry: SearchHistoryEntry = {
      isbn: '9784003101018',
      searchedAt: new Date(2026, 1, 14, 10, 30),
      libraryStatuses: {},
    };

    renderWithProviders(
      <SearchHistoryCard entry={entry} onTap={() => {}} now={now} />,
    );

    expect(screen.getByText('昨日')).toBeInTheDocument();
  });

  test('displays date for older entries', () => {
    const now = new Date(2026, 1, 15, 14, 0);
    const entry: SearchHistoryEntry = {
      isbn: '9784003101018',
      searchedAt: new Date(2026, 0, 5, 10, 30),
      libraryStatuses: {},
    };

    renderWithProviders(
      <SearchHistoryCard entry={entry} onTap={() => {}} now={now} />,
    );

    expect(screen.getByText('2026/01/05')).toBeInTheDocument();
  });

  test('displays availability status badge with the best status', () => {
    const entry: SearchHistoryEntry = {
      isbn: '9784003101018',
      searchedAt: new Date(2026, 1, 15, 10, 30),
      libraryStatuses: {
        Tokyo_Chiyoda: 'available',
        Tokyo_Shibuya: 'checkedOut',
      },
    };

    renderWithProviders(<SearchHistoryCard entry={entry} onTap={() => {}} />);

    // Should show the best status (available).
    expect(screen.getByText('貸出可能')).toBeInTheDocument();
  });

  test('renders without crashing when a stored status name is unknown', () => {
    // 永続化された履歴に旧仕様や破損による未知のステータス名が含まれていても
    // 例外で履歴ページ全体がクラッシュしないこと。未知は「不明」として扱う。
    const entry: SearchHistoryEntry = {
      isbn: '9784003101018',
      searchedAt: new Date(2026, 1, 15, 10, 30),
      libraryStatuses: {
        Tokyo_Chiyoda: 'totally_unexpected_value',
      },
    };

    expect(() =>
      renderWithProviders(<SearchHistoryCard entry={entry} onTap={() => {}} />),
    ).not.toThrow();
    expect(screen.getByText('不明')).toBeInTheDocument();
  });

  test('calls onTap when tapped', async () => {
    const onTap = vi.fn();
    const entry: SearchHistoryEntry = {
      isbn: '9784003101018',
      searchedAt: new Date(2026, 1, 15, 10, 30),
      libraryStatuses: {},
    };

    const { user } = renderWithProviders(
      <SearchHistoryCard entry={entry} onTap={onTap} />,
    );

    await user.click(screen.getByText(/9784003101018/));

    expect(onTap).toHaveBeenCalledTimes(1);
  });
});

describe('SearchHistoryCard メタデータ表示（#141）', () => {
  const entry = {
    isbn: '9784873117584',
    searchedAt: new Date(2026, 6, 1),
    libraryStatuses: { みなと: 'available' },
  };

  test('metadata があればタイトルを主表記にし、ISBN は補助表記に降格する', () => {
    renderWithProviders(
      <SearchHistoryCard
        entry={entry}
        onTap={() => {}}
        metadata={{
          isbn: '9784873117584',
          title: 'リーダブルコード',
          coverImageUrl: 'https://cover.openbd.jp/9784873117584.jpg',
        }}
      />,
    );
    expect(screen.getByText('リーダブルコード')).toBeInTheDocument();
    // ISBN も補助表記として残る
    expect(screen.getByText(/9784873117584/)).toBeInTheDocument();
    // 書影（img か placeholder のどちらか）が描画される
    expect(
      screen.queryByTestId('book-cover') ??
        screen.queryByTestId('book-cover-placeholder'),
    ).not.toBeNull();
  });

  test('metadata が無ければ従来どおり ISBN が主表記', () => {
    renderWithProviders(<SearchHistoryCard entry={entry} onTap={() => {}} />);
    expect(screen.getByText('ISBN: 9784873117584')).toBeInTheDocument();
    expect(screen.queryByText('リーダブルコード')).not.toBeInTheDocument();
  });
});

describe('SearchHistoryCard の横オーバーフロー対策（#153）', () => {
  // タイトルと同様、ISBN 表記も 1 行で切り詰められることを保証する
  // （#153: 長いタイトルで履歴行が画面幅を超えて横スクロールバーが出た
  // 問題の副次対応）。jsdom は実レイアウトを行わないため、切り詰めを
  // 実現する CSS 宣言（overflow/textOverflow/whiteSpace）が適用されて
  // いることを固定する。
  const entry: SearchHistoryEntry = {
    isbn: '9784873117584',
    searchedAt: new Date(2026, 6, 1),
    libraryStatuses: {},
  };

  test('タイトル表示時、補助表記の ISBN キャプションが 1 行に切り詰められる', () => {
    renderWithProviders(
      <SearchHistoryCard
        entry={entry}
        onTap={() => {}}
        metadata={{ isbn: entry.isbn, title: 'リーダブルコード' }}
      />,
    );

    const isbnCaption = screen.getByText(/9784873117584/);
    const style = window.getComputedStyle(isbnCaption);
    expect(style.whiteSpace).toBe('nowrap');
    expect(style.overflow).toBe('hidden');
    expect(style.textOverflow).toBe('ellipsis');
  });

  test('metadata が無い場合の ISBN 主表記も 1 行に切り詰められる', () => {
    renderWithProviders(<SearchHistoryCard entry={entry} onTap={() => {}} />);

    const isbnPrimary = screen.getByText('ISBN: 9784873117584');
    const style = window.getComputedStyle(isbnPrimary);
    expect(style.whiteSpace).toBe('nowrap');
    expect(style.overflow).toBe('hidden');
    expect(style.textOverflow).toBe('ellipsis');
  });
});
