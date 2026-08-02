import { describe, it, expect, afterEach } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';

import { makeFakeDeps, renderRouteWithProviders } from '@/test/testUtils';
import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import type { Library } from '@/domain/models/library';

function setNavigatorOnLine(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

describe('AppShell オフラインバナー（#145）', () => {
  afterEach(() => {
    setNavigatorOnLine(true);
  });

  it('オンライン時はバナーを表示しない', () => {
    renderRouteWithProviders('/', { authUser: { id: 'u1', name: 'Alice' } });
    expect(screen.queryByText('オフラインです')).not.toBeInTheDocument();
  });

  it('オフライン時は上部にバナーを表示する', () => {
    setNavigatorOnLine(false);
    renderRouteWithProviders('/', { authUser: { id: 'u1', name: 'Alice' } });
    expect(screen.getByText('オフラインです')).toBeInTheDocument();
  });

  it('表示中に offline/online イベントでバナーが切り替わる', () => {
    renderRouteWithProviders('/', { authUser: { id: 'u1', name: 'Alice' } });
    expect(screen.queryByText('オフラインです')).not.toBeInTheDocument();

    act(() => {
      setNavigatorOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText('オフラインです')).toBeInTheDocument();

    act(() => {
      setNavigatorOnLine(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.queryByText('オフラインです')).not.toBeInTheDocument();
  });
});

describe('AppShell オフラインバナー（#143: 図書館・履歴タブはキャッシュ閲覧である旨を追記）', () => {
  afterEach(() => {
    setNavigatorOnLine(true);
  });

  it('ホームタブはこれまで通り「オフラインです」のみ', () => {
    setNavigatorOnLine(false);
    renderRouteWithProviders('/', { authUser: { id: 'u1', name: 'Alice' } });
    expect(screen.getByText('オフラインです')).toBeInTheDocument();
  });

  it('図書館タブはキャッシュ閲覧である旨を追記する', () => {
    setNavigatorOnLine(false);
    renderRouteWithProviders('/library', { authUser: { id: 'u1', name: 'Alice' } });
    expect(
      screen.getByText('オフラインです。表示中のデータは前回取得時点のものです'),
    ).toBeInTheDocument();
  });

  it('履歴タブはキャッシュ閲覧である旨を追記する', () => {
    setNavigatorOnLine(false);
    renderRouteWithProviders('/history', { authUser: { id: 'u1', name: 'Alice' } });
    expect(
      screen.getByText('オフラインです。表示中のデータは前回取得時点のものです'),
    ).toBeInTheDocument();
  });
});

describe('AppShell 保留スキャンの自動検索（#144）', () => {
  afterEach(() => {
    setNavigatorOnLine(true);
  });

  it('オンラインでシェルを表示すると保留キューが自動検索される', async () => {
    setNavigatorOnLine(true);
    const chiyoda: Library = {
      systemId: 'Tokyo_Chiyoda',
      systemName: 'テストシステム',
      libKey: '千代田',
      libId: 'id1',
      shortName: '千代田',
      formalName: '千代田図書館',
      address: '東京都千代田区',
      pref: '東京都',
      city: '千代田区',
      category: 'MEDIUM',
    };
    const deps = makeFakeDeps({
      registeredLibraryRepository: {
        getAll: async () => [chiyoda],
        saveAll: async () => {},
        add: async () => [chiyoda],
        addAll: async () => [chiyoda],
        remove: async () => [chiyoda],
      },
      libraryRepository: {
        getLibraries: async () => [],
        checkBookAvailability: async () => [
          {
            isbn: '9784003101018',
            libraryStatuses: {
              Tokyo_Chiyoda: {
                systemId: 'Tokyo_Chiyoda',
                status: AvailabilityStatus.available,
                libKeyStatuses: { 千代田: '貸出可' },
              },
            },
          },
        ],
      },
    });
    await deps.pendingScanRepository.add({
      isbn: '9784003101018',
      scannedAt: new Date(2026, 7, 1, 10, 0),
    });

    renderRouteWithProviders('/', {
      deps,
      authUser: { id: 'u1', name: 'Alice' },
    });

    await waitFor(async () => {
      expect(await deps.pendingScanRepository.getAll()).toHaveLength(0);
    });
    const history = await deps.searchHistoryRepository.getAll();
    expect(history.map((e) => e.isbn)).toEqual(['9784003101018']);
  });
});
