import { describe, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import type { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';
import type { SearchHistoryRepository } from '@/domain/repositories/searchHistoryRepository';
import { renderWithProviders, makeFakeDeps, FakeBookMetadataRepository } from '@/test/testUtils';
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

  async save(entry: SearchHistoryEntry): Promise<SearchHistoryEntry[]> {
    this.entries = this.entries.filter((e) => e.isbn !== entry.isbn);
    this.entries.push(entry);
    return this.getAll();
  }

  async remove(isbn: string): Promise<SearchHistoryEntry[]> {
    this.entries = this.entries.filter((e) => e.isbn !== isbn);
    return this.getAll();
  }

  async removeAll(): Promise<SearchHistoryEntry[]> {
    this.entries = [];
    return [];
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

describe('検索履歴のメタデータ表示（#141・結合）', () => {
  it('履歴一覧に書籍タイトルが表示される', async () => {
    const repo = new FakeSearchHistoryRepository();
    await repo.save({
      isbn: '9784873117584',
      searchedAt: new Date(2026, 6, 1),
      libraryStatuses: { みなと: 'available' },
    });
    const deps = makeFakeDeps({
      searchHistoryRepository: repo,
      bookMetadataRepository: new FakeBookMetadataRepository({
        '9784873117584': { isbn: '9784873117584', title: 'リーダブルコード' },
      }),
    });
    renderWithProviders(<SearchHistoryPage />, { deps });

    expect(await screen.findByText('リーダブルコード')).toBeInTheDocument();
    expect(screen.getByText(/9784873117584/)).toBeInTheDocument();
  });
});

describe('検索履歴のカーリルへのリンク（#156）', () => {
  // カーリル図書館APIの仕様上、APIで取得した貸出状況を表示する場合は
  // カーリルへのリンクが必須。履歴カードは図書館名を表示しないため、
  // 一覧単位の帰属表示でリンクを担保する（詳細は docs/156-calil-linkback/design.md）。
  // https://calil.jp/doc/api_ref.html
  it('履歴があるとき、カーリルへのリンクを表示する', async () => {
    const repo = new FakeSearchHistoryRepository([
      {
        isbn: '9784003101018',
        searchedAt: new Date(2026, 1, 15),
        libraryStatuses: { Tokyo_Chiyoda: 'available' },
      },
    ]);

    renderPage(repo);

    await screen.findByText(/9784003101018/);
    const link = screen.getByRole('link', { name: /カーリル/ });
    expect(link).toHaveAttribute('href', 'https://calil.jp/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel') ?? '').toContain('noopener');
  });

  it('履歴が空のときは貸出状況を表示しないため、帰属表示も出さない', async () => {
    renderPage(new FakeSearchHistoryRepository());

    await screen.findByText(/検索履歴はありません/);
    expect(screen.queryByRole('link', { name: /カーリル/ })).not.toBeInTheDocument();
  });
});

describe('検索履歴アイテムの横スクロール対策（#153）', () => {
  it('タイトルが長い書籍でも履歴行が横幅いっぱいに広がらないよう minWidth:0 が設定されている', async () => {
    // 長いタイトルの書籍を履歴行の flex item ラッパーに minWidth: 0 が
    // 無いと、ネストした flexbox の自動最小サイズがタイトルの
    // 折り返し前の幅まで膨らみ、画面幅を超えて横スクロールバーが出る
    // （#153）。jsdom は実レイアウトを行わないため scrollWidth 等の
    // ピクセル計測はできないので、原因となっている宣言的なスタイル
    // （minWidth:0）が適用されていることを回帰テストとして固定する。
    const repo = new FakeSearchHistoryRepository();
    await repo.save({
      isbn: '9784873115658',
      searchedAt: new Date(2026, 6, 1),
      libraryStatuses: {},
    });
    const deps = makeFakeDeps({
      searchHistoryRepository: repo,
      bookMetadataRepository: new FakeBookMetadataRepository({
        '9784873115658': {
          isbn: '9784873115658',
          title:
            'リーダブルコード：より良いコードを書くためのシンプルで実践的なテクニック',
        },
      }),
    });
    renderWithProviders(<SearchHistoryPage />, { deps });

    await screen.findByText(/リーダブルコード/);
    const row = screen.getByTestId('search-history-row');

    expect(window.getComputedStyle(row).minWidth).toBe('0');
  });
});
