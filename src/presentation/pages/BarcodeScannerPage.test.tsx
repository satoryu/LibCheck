import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';

import { renderRouteWithProviders } from '@/test/testUtils';

// カメラ起動を伴うフラッシュのテスト用に @zxing/browser をモックする。
// decodeFromVideoDevice が返す controls を差し替えてトーチ対応/非対応を再現する。
const zxingMock = vi.hoisted(() => ({
  controls: {
    stop: () => {},
    switchTorch: undefined as undefined | ((on: boolean) => Promise<void>),
  },
}));

vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    async decodeFromVideoDevice(): Promise<typeof zxingMock.controls> {
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
