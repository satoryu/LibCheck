import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

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
