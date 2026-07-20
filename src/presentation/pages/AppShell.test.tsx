import { describe, it, expect, afterEach } from 'vitest';
import { act, screen } from '@testing-library/react';

import { renderRouteWithProviders } from '@/test/testUtils';

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
