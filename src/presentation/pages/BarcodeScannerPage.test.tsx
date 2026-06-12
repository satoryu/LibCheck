import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';

import { renderRouteWithProviders } from '@/test/testUtils';

// カメラ起動を伴うテスト用に @zxing/browser をモックする。
// decodeFromVideoDevice が返す controls を差し替えてトーチ対応/非対応を再現し、
// startError を設定するとカメラ起動失敗（許可拒否等）を再現する。
const zxingMock = vi.hoisted(() => ({
  controls: {
    stop: () => {},
    switchTorch: undefined as undefined | ((on: boolean) => Promise<void>),
  },
  startError: undefined as unknown,
}));

vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    async decodeFromVideoDevice(): Promise<typeof zxingMock.controls> {
      if (zxingMock.startError !== undefined) {
        throw zxingMock.startError;
      }
      return zxingMock.controls;
    }
  },
}));

/**
 * In jsdom there is no real camera. We make `navigator.mediaDevices`
 * deterministically absent so the page falls back to its error UI, which still
 * renders the AppBar title and the "ISBNを手動入力する" affordance. This mirrors
 * the Flutter widget test, which only asserts the title and the manual-input
 * navigation (the live camera preview is not exercised under test).
 */
describe('BarcodeScannerPage', () => {
  let originalMediaDevices: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalMediaDevices = Object.getOwnPropertyDescriptor(
      navigator,
      'mediaDevices',
    );
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    if (originalMediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).mediaDevices;
    }
  });

  test('AppBarに「バーコードスキャン」タイトルが表示される', async () => {
    renderRouteWithProviders('/scan');

    expect(await screen.findByText('バーコードスキャン')).toBeInTheDocument();
  });

  test('「ISBNを手動入力する」ボタンタップで/isbn-inputへ遷移する', async () => {
    const { user } = renderRouteWithProviders('/scan');

    await user.click(await screen.findByText('ISBNを手動入力する'));

    expect(await screen.findByText('ISBN入力')).toBeInTheDocument();
  });
});

describe('BarcodeScannerPage カメラ許可', () => {
  let originalMediaDevices: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalMediaDevices = Object.getOwnPropertyDescriptor(
      navigator,
      'mediaDevices',
    );
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve({}) },
    });
    zxingMock.controls.switchTorch = undefined;
    zxingMock.startError = undefined;
  });

  afterEach(() => {
    zxingMock.startError = undefined;
    if (originalMediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).mediaDevices;
    }
  });

  test('許可されていない場合は警告を表示し許可を促す', async () => {
    // カメラ許可が拒否されると getUserMedia は NotAllowedError を投げる。
    zxingMock.startError = Object.assign(new Error('Permission denied'), {
      name: 'NotAllowedError',
    });

    renderRouteWithProviders('/scan');

    expect(
      await screen.findByText('カメラへのアクセスが許可されていません'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ブラウザの設定でカメラへのアクセスを許可/),
    ).toBeInTheDocument();
    // 許可を促す導線として再試行ボタンを表示する（押すと許可ダイアログが再表示される）。
    expect(screen.getByRole('button', { name: /再試行/ })).toBeInTheDocument();
  });

  test('再試行で許可されるとカメラ画面に復帰する', async () => {
    zxingMock.startError = Object.assign(new Error('Permission denied'), {
      name: 'NotAllowedError',
    });

    const { user } = renderRouteWithProviders('/scan');

    const retryButton = await screen.findByRole('button', { name: /再試行/ });

    // ユーザーがブラウザ設定で許可した後に再試行する。
    zxingMock.startError = undefined;
    await user.click(retryButton);

    await waitFor(() => {
      expect(
        screen.queryByText('カメラへのアクセスが許可されていません'),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText('flash')).toBeInTheDocument();
  });
});

describe('BarcodeScannerPage フラッシュ', () => {
  let originalMediaDevices: PropertyDescriptor | undefined;

  beforeEach(() => {
    // カメラ起動が成功するよう getUserMedia を持つ mediaDevices を用意する。
    originalMediaDevices = Object.getOwnPropertyDescriptor(
      navigator,
      'mediaDevices',
    );
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve({}) },
    });
    zxingMock.controls.switchTorch = undefined;
    zxingMock.startError = undefined;
  });

  afterEach(() => {
    if (originalMediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).mediaDevices;
    }
  });

  test('トーチ非対応端末ではフラッシュアイコンを点灯させない', async () => {
    // switchTorch が無い端末で押しても、実際には切り替わらないのに
    // アイコンだけ点灯してしまう不具合の回帰テスト。
    zxingMock.controls.switchTorch = undefined;

    const { user } = renderRouteWithProviders('/scan');

    const flashButton = await screen.findByLabelText('flash');
    // カメラ起動（controls 設定）の microtask を流す。
    await act(async () => {
      await Promise.resolve();
    });

    await user.click(flashButton);

    expect(screen.getByTestId('FlashOffIcon')).toBeInTheDocument();
    expect(screen.queryByTestId('FlashOnIcon')).not.toBeInTheDocument();
  });

  test('トーチ対応端末ではフラッシュアイコンが点灯する', async () => {
    const switchTorch = vi.fn().mockResolvedValue(undefined);
    zxingMock.controls.switchTorch = switchTorch;

    const { user } = renderRouteWithProviders('/scan');

    const flashButton = await screen.findByLabelText('flash');
    await act(async () => {
      await Promise.resolve();
    });

    await user.click(flashButton);

    await waitFor(() => {
      expect(screen.getByTestId('FlashOnIcon')).toBeInTheDocument();
    });
    expect(switchTorch).toHaveBeenCalledWith(true);
  });
});
