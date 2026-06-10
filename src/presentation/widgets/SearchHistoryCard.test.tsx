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
