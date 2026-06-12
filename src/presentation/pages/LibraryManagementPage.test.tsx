import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';

import type { Library } from '@/domain/models/library';
import { librariesEqual } from '@/domain/models/library';
import type { RegisteredLibraryRepository } from '@/domain/repositories/registeredLibraryRepository';
import { renderWithProviders, makeFakeDeps } from '@/test/testUtils';
import { LibraryManagementPage } from '@/presentation/pages/LibraryManagementPage';

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  private libs: Library[];

  constructor(initial: Library[] = []) {
    this.libs = [...initial];
  }

  async getAll(): Promise<Library[]> {
    return [...this.libs];
  }

  async saveAll(libraries: Library[]): Promise<void> {
    this.libs = [...libraries];
  }

  async add(library: Library): Promise<Library[]> {
    if (!this.libs.some((e) => librariesEqual(e, library))) {
      this.libs.push(library);
    }
    return [...this.libs];
  }

  async addAll(libraries: Library[]): Promise<Library[]> {
    for (const lib of libraries) {
      if (!this.libs.some((e) => librariesEqual(e, lib))) {
        this.libs.push(lib);
      }
    }
    return [...this.libs];
  }

  async remove(library: Library): Promise<Library[]> {
    this.libs = this.libs.filter((e) => !librariesEqual(e, library));
    return [...this.libs];
  }
}

class ErrorRegisteredLibraryRepository implements RegisteredLibraryRepository {
  async getAll(): Promise<Library[]> {
    throw new Error('load error');
  }
  async saveAll(): Promise<void> {}
  async add(): Promise<Library[]> {
    return [];
  }
  async addAll(): Promise<Library[]> {
    return [];
  }
  async remove(): Promise<Library[]> {
    return [];
  }
}

const library1: Library = {
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

const library2: Library = {
  systemId: 'Tokyo_Shibuya',
  systemName: '渋谷区図書館',
  libKey: 'しぶや',
  libId: '456',
  shortName: '渋谷図書館',
  formalName: '渋谷区立中央図書館',
  address: '東京都渋谷区神宮前1-1-1',
  pref: '東京都',
  city: '渋谷区',
  category: 'LARGE',
};

function renderPage(repo: RegisteredLibraryRepository) {
  return renderWithProviders(<LibraryManagementPage />, {
    deps: makeFakeDeps({ registeredLibraryRepository: repo }),
  });
}

describe('LibraryManagementPage', () => {
  test('shows empty state when no libraries registered', async () => {
    renderPage(new FakeRegisteredLibraryRepository());

    expect(await screen.findByText('図書館が登録されていません')).toBeInTheDocument();
    expect(screen.getByText('図書館を登録する')).toBeInTheDocument();
  });

  test('shows registered libraries', async () => {
    renderPage(new FakeRegisteredLibraryRepository([library1, library2]));

    expect(await screen.findByText('港区立みなと図書館')).toBeInTheDocument();
    expect(screen.getByText('渋谷区立中央図書館')).toBeInTheDocument();
  });

  test('shows delete confirmation dialog', async () => {
    const { user } = renderPage(
      new FakeRegisteredLibraryRepository([library1]),
    );

    await screen.findByText('港区立みなと図書館');
    await user.click(screen.getByLabelText('削除'));

    expect(screen.getByText('図書館の登録を解除しますか？')).toBeInTheDocument();
    expect(
      screen.getByText('「港区立みなと図書館」の登録を解除します。'),
    ).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
    expect(screen.getByText('解除する')).toBeInTheDocument();
  });

  test('confirming delete removes library and shows SnackBar', async () => {
    const { user } = renderPage(
      new FakeRegisteredLibraryRepository([library1]),
    );

    await screen.findByText('港区立みなと図書館');
    await user.click(screen.getByLabelText('削除'));
    await user.click(screen.getByText('解除する'));

    expect(await screen.findByText('図書館の登録を解除しました')).toBeInTheDocument();
    expect(screen.getByText('元に戻す')).toBeInTheDocument();
    expect(await screen.findByText('図書館が登録されていません')).toBeInTheDocument();
  });

  test('undo restores deleted library', async () => {
    const { user } = renderPage(
      new FakeRegisteredLibraryRepository([library1]),
    );

    await screen.findByText('港区立みなと図書館');
    await user.click(screen.getByLabelText('削除'));
    await user.click(screen.getByText('解除する'));

    await user.click(await screen.findByText('元に戻す'));

    expect(await screen.findByText('港区立みなと図書館')).toBeInTheDocument();
  });

  test('shows ErrorStateWidget on error', async () => {
    renderPage(new ErrorRegisteredLibraryRepository());

    expect(await screen.findByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
  });
});
