import { describe, it, expect } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { closeSnackbar, enqueueSnackbar } from 'notistack';

import { App } from '@/App';
import type { Library } from '@/domain/models/library';
import type { RegisteredLibraryRepository } from '@/domain/repositories/registeredLibraryRepository';
import { makeFakeDeps, renderRouteWithProviders } from '@/test/testUtils';

/**
 * Port of `test/app_test.dart`.
 *
 * Flutter test: 「図書館未登録時は登録図書館画面を表示する」
 * Renders the app at '/' with no registered libraries and expects the
 * library-management screen (登録図書館) to be shown via the empty-library
 * redirect.
 */

/** RegisteredLibraryRepository that always reports an empty registration list. */
class EmptyRegisteredLibraryRepository implements RegisteredLibraryRepository {
  async getAll(): Promise<Library[]> {
    return [];
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

describe('LibCheckApp', () => {
  it('図書館未登録時は登録図書館画面を表示する', async () => {
    const deps = makeFakeDeps({
      registeredLibraryRepository: new EmptyRegisteredLibraryRepository(),
    });

    renderRouteWithProviders('/', { deps });

    await waitFor(() => {
      expect(screen.getByText('登録図書館')).toBeInTheDocument();
    });
  });

  it('スナックバーはボトムナビゲーションと重ならないよう上部（top-center）に表示される', async () => {
    // App.tsx の SnackbarProvider 設定そのものを検証したいので、
    // testUtils のプロバイダーではなく実際の <App /> をレンダリングする。
    window.history.replaceState(null, '', '/');
    render(<App />);

    // 必須ログインのため未ログインではランディング（紹介）が表示される。
    // SnackbarProvider はゲートの外側にあるため、この状態でも通知は出せる。
    await waitFor(() => {
      expect(screen.getByText(/図書館にありますか/)).toBeInTheDocument();
    });

    // notistack v3 のモジュールレベル API でスナックバーを表示する。
    act(() => {
      enqueueSnackbar('テスト通知');
    });
    const message = await screen.findByText('テスト通知');

    const container = message.closest('.notistack-SnackbarContainer');
    expect(container).not.toBeNull();

    // notistack はクラス名がハッシュ化されているため、計算済みスタイルで
    // anchorOrigin を検証する（top 配置なら top が、bottom 配置なら bottom が
    // px 値で設定される）。
    const style = window.getComputedStyle(container as HTMLElement);
    expect(style.top).toMatch(/^\d+px$/);
    expect(style.bottom).toBe('');
    // horizontal: 'center' は left: 50% (+ translateX(-50%)) で表現される。
    expect(style.left).toBe('50%');

    act(() => {
      closeSnackbar();
    });
  });
});
