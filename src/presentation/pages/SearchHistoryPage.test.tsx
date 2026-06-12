import { describe, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import type { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';
import type { SearchHistoryRepository } from '@/domain/repositories/searchHistoryRepository';
import { renderWithProviders, makeFakeDeps } from '@/test/testUtils';
import { SearchHistoryPage } from '@/presentation/pages/SearchHistoryPage';

class FakeSearchHistoryRepository implements SearchHistoryRepository {
  private entries: SearchHistoryEntry[];

  constructor(entries: SearchHistoryEntry[] = []) {
    this.entries = [...entries];
  }

  async getAll(): Promise<SearchHistoryEntry[]> {
    return [...this.entries].sort(
      (a, b) => b.searchedAt.getTime() - a.searchedAt.getTime(),
    );
  }

  async save(entry: SearchHistoryEntry): Promise<void> {
    this.entries = this.entries.filter((e) => e.isbn !== entry.isbn);
    this.entries.push(entry);
  }

  async remove(isbn: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.isbn !== isbn);
  }

  async removeAll(): Promise<void> {
    this.entries = [];
  }
}

function renderPage(repo: SearchHistoryRepository) {
  return renderWithProviders(<SearchHistoryPage />, {
    deps: makeFakeDeps({ searchHistoryRepository: repo }),
  });
}

describe('SearchHistoryPage', () => {
  test('shows empty state when no history', async () => {
    renderPage(new FakeSearchHistoryRepository());

    expect(await screen.findByText(/検索履歴はありません/)).toBeInTheDocument();
  });

  test('shows history cards when entries exist', async () => {
    const repo = new FakeSearchHistoryRepository([
      {
        isbn: '9784003101018',
        searchedAt: new Date(2026, 1, 15, 10, 0),
        libraryStatuses: { Tokyo_Chiyoda: 'available' },
      },
      {
        isbn: '9784167158057',
        searchedAt: new Date(2026, 1, 14, 9, 0),
        libraryStatuses: { Tokyo_Shibuya: 'checkedOut' },
      },
    ]);

    renderPage(repo);

    expect(await screen.findByText(/9784003101018/)).toBeInTheDocument();
    expect(screen.getByText(/9784167158057/)).toBeInTheDocument();
    expect(screen.getAllByText(/^ISBN: /)).toHaveLength(2);
  });

  test('delete all shows confirmation dialog', async () => {
    const repo = new FakeSearchHistoryRepository([
      {
        isbn: '9784003101018',
        searchedAt: new Date(2026, 1, 15),
        libraryStatuses: {},
      },
    ]);

    const { user } = renderPage(repo);

    await screen.findByText(/9784003101018/);
    await user.click(screen.getByLabelText('全履歴を削除'));

    // Dialog title text.
    expect(screen.getByText('全履歴を削除', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText('削除')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  test('confirming delete all removes all entries', async () => {
    const repo = new FakeSearchHistoryRepository([
      {
        isbn: '9784003101018',
        searchedAt: new Date(2026, 1, 15),
        libraryStatuses: {},
      },
    ]);

    const { user } = renderPage(repo);

    await screen.findByText(/9784003101018/);
    await user.click(screen.getByLabelText('全履歴を削除'));
    await user.click(screen.getByText('削除'));

    expect(await screen.findByText(/検索履歴はありません/)).toBeInTheDocument();
    expect(screen.queryByText(/9784003101018/)).not.toBeInTheDocument();
  });

  test('delete button removes individual entry', async () => {
    const repo = new FakeSearchHistoryRepository([
      {
        isbn: '9784003101018',
        searchedAt: new Date(2026, 1, 15),
        libraryStatuses: {},
      },
      {
        isbn: '9784167158057',
        searchedAt: new Date(2026, 1, 14),
        libraryStatuses: {},
      },
    ]);

    const { user } = renderPage(repo);

    await screen.findByText(/9784003101018/);

    // Entries are sorted by searchedAt desc, so 9784003101018 is first.
    const deleteButtons = screen.getAllByLabelText('削除');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText(/9784003101018/)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/9784167158057/)).toBeInTheDocument();
  });
});
