import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';

import { makeFakeDeps, renderRouteWithProviders } from '@/test/testUtils';
import type { AppDependencies } from '@/app/dependencies';
import type { Library } from '@/domain/models/library';
import { librariesEqual } from '@/domain/models/library';
import type { RegisteredLibraryRepository } from '@/domain/repositories/registeredLibraryRepository';

/**
 * Port of `test/presentation/pages/home_page_test.dart`.
 *
 * The React `HomePage` hosts the empty-registered-libraries redirect that the
 * Flutter app performed in its router. To exercise the page content (rather than
 * the redirect) the tests inject a non-empty registered library list.
 */

const sampleLibrary: Library = {
  systemId: 'system1',
  systemName: 'テスト図書館システム',
  libKey: 'key1',
  libId: 'id1',
  shortName: 'テスト図書館',
  formalName: 'テスト図書館',
  address: '東京都港区',
  pref: '東京都',
  city: '港区',
  category: 'MEDIUM',
};

function fakeRegisteredRepo(initial: Library[]): RegisteredLibraryRepository {
  let state = [...initial];
  return {
    getAll: async () => [...state],
    saveAll: async (libraries) => {
      state = [...libraries];
    },
    add: async (library) => {
      state = [...state, library];
      return [...state];
    },
    addAll: async (libraries) => {
      state = [...state, ...libraries];
      return [...state];
    },
    remove: async (library) => {
      state = state.filter((l) => !librariesEqual(l, library));
      return [...state];
    },
  };
}

function depsWithRegistered(libraries: Library[]): AppDependencies {
  return makeFakeDeps({
    registeredLibraryRepository: fakeRegisteredRepo(libraries),
  });
}

describe('HomePage', () => {
  it('renders AppBar with title from appTitleProvider', async () => {
    renderRouteWithProviders('/', { deps: depsWithRegistered([sampleLibrary]) });

    expect(await screen.findByText('LibCheck')).toBeInTheDocument();
  });

  it('バーコードスキャンボタンで/scanへ遷移する', async () => {
    const { user } = renderRouteWithProviders('/', {
      deps: depsWithRegistered([sampleLibrary]),
    });

    await user.click(await screen.findByText('バーコードでスキャン'));

    expect(await screen.findByText('バーコードスキャン')).toBeInTheDocument();
  });

  it('ISBN手動入力ボタンで/isbn-inputへ遷移する', async () => {
    const { user } = renderRouteWithProviders('/', {
      deps: depsWithRegistered([sampleLibrary]),
    });

    await user.click(await screen.findByText('ISBNを入力'));

    expect(await screen.findByText('ISBN入力')).toBeInTheDocument();
  });
});

describe('HomePage 保留中の検索（#144）', () => {
  function setNavigatorOnline(value: boolean): void {
    Object.defineProperty(window.navigator, 'onLine', {
      value,
      configurable: true,
    });
    // 実ブラウザ同様、React Query の onlineManager にも状態を伝える
    // （BarcodeScannerPage.test.tsx の同名ヘルパー参照）。オフライン中でも
    // 保留カードが表示できること（ローカルデータのみのクエリが一時停止
    // しないこと）の回帰テストになる。
    onlineManager.setOnline(value);
  }

  beforeEach(() => {
    // 自動検索プロセッサが動かない状態で、カード表示だけを検証する。
    setNavigatorOnline(false);
  });

  afterEach(() => {
    setNavigatorOnline(true);
  });

  it('保留が0件のときはカードを表示しない', async () => {
    renderRouteWithProviders('/', { deps: depsWithRegistered([sampleLibrary]) });

    expect(await screen.findByText('LibCheck')).toBeInTheDocument();
    expect(screen.queryByText(/保留中の検索/)).not.toBeInTheDocument();
  });

  it('保留があるときは件数とISBNを表示する', async () => {
    const deps = depsWithRegistered([sampleLibrary]);
    await deps.pendingScanRepository.add({
      isbn: '9784003101018',
      scannedAt: new Date(2026, 7, 1, 10, 0),
    });
    await deps.pendingScanRepository.add({
      isbn: '9784167158057',
      scannedAt: new Date(2026, 7, 1, 10, 5),
    });

    renderRouteWithProviders('/', { deps });

    expect(await screen.findByText('保留中の検索（2件）')).toBeInTheDocument();
    expect(screen.getByText('9784003101018')).toBeInTheDocument();
    expect(screen.getByText('9784167158057')).toBeInTheDocument();
  });

  it('削除ボタンで保留項目を削除できる', async () => {
    const deps = depsWithRegistered([sampleLibrary]);
    await deps.pendingScanRepository.add({
      isbn: '9784003101018',
      scannedAt: new Date(2026, 7, 1, 10, 0),
    });

    const { user } = renderRouteWithProviders('/', { deps });

    await user.click(
      await screen.findByLabelText('保留中の9784003101018を削除'),
    );

    await waitFor(() => {
      expect(screen.queryByText(/保留中の検索/)).not.toBeInTheDocument();
    });
    expect(await deps.pendingScanRepository.getAll()).toHaveLength(0);
  });
});
