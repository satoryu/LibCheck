import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';

import { renderRouteWithProviders } from '@/test/testUtils';
import { collectUnhandledRejections } from '@/test/unhandledRejections';
import { trackIsbnScanSuccess } from '@/analytics/events';

// GA4 計測（#169）はイベント名ではなく「意味のある呼び出し」で検証する。
vi.mock('@/analytics/events', () => ({
  trackIsbnScanSuccess: vi.fn(),
  trackBookSearchResultView: vi.fn(),
  trackLibraryReservationLinkClick: vi.fn(),
  trackAmazonAffiliateLinkClick: vi.fn(),
}));

// カメラ起動を伴うテスト用に @zxing/browser をモックする。
// decodeFromVideoDevice が返す controls を差し替えてトーチ対応/非対応を再現し、
// startError を設定するとカメラ起動失敗（許可拒否等）を再現する。
const zxingMock = vi.hoisted(() => ({
  controls: {
    stop: () => {},
    switchTorch: undefined as undefined | ((on: boolean) => Promise<void>),
  },
  startError: undefined as unknown,
  // decodeFromVideoDevice のコールバックを保持し、テストからバーコードの
  // デコード成功を再現できるようにする。
  decodeCallback: undefined as
    | undefined
    | ((result: { getText(): string } | undefined) => void),
}));

vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    async decodeFromVideoDevice(
      _device: unknown,
      _video: unknown,
      callback: (result: { getText(): string } | undefined) => void,
    ): Promise<typeof zxingMock.controls> {
      if (zxingMock.startError !== undefined) {
        throw zxingMock.startError;
      }
      zxingMock.decodeCallback = callback;
      return zxingMock.controls;
    }
  },
}));

/** zxing のコールバック登録を待ち、バーコードのデコード成功を再現する。 */
async function decode(barcode: string): Promise<void> {
  await waitFor(() => {
    expect(zxingMock.decodeCallback).toBeDefined();
  });
  await act(async () => {
    zxingMock.decodeCallback?.({ getText: () => barcode });
  });
}

function setNavigatorOnline(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    value,
    configurable: true,
  });
  // 実ブラウザでは offline イベントで React Query の onlineManager も
  // オフラインになり、networkMode 既定（'online'）のクエリ/ミューテーションは
  // 一時停止する。jsdom ではイベント発火のタイミング（Provider マウント前後）
  // に依存しないよう、onlineManager を直接切り替えて再現する。これを
  // しないと「オフライン中に保留キューへ保存できない」バグを見逃す。
  onlineManager.setOnline(value);
}

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

describe('BarcodeScannerPage オフライン保留（#144）', () => {
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
    zxingMock.decodeCallback = undefined;
  });

  afterEach(() => {
    setNavigatorOnline(true);
    zxingMock.decodeCallback = undefined;
    if (originalMediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).mediaDevices;
    }
  });

  test('オフライン時はISBNを保留キューに入れ、スキャン画面に留まる', async () => {
    setNavigatorOnline(false);
    const { deps } = renderRouteWithProviders('/scan');

    await decode('9784003101018');

    expect(
      await screen.findByText('オフラインのため保留しました（1件）'),
    ).toBeInTheDocument();
    // 結果画面へは遷移せず、続けてスキャンできる。
    expect(screen.getByText('バーコードスキャン')).toBeInTheDocument();

    const queued = await deps.pendingScanRepository.getAll();
    expect(queued.map((s) => s.isbn)).toEqual(['9784003101018']);
  });

  test('オフライン時に同じISBNを2度読んでもキューは1件のまま', async () => {
    setNavigatorOnline(false);
    const { deps } = renderRouteWithProviders('/scan');

    await decode('9784003101018');
    await decode('9784003101018');

    const queued = await deps.pendingScanRepository.getAll();
    expect(queued).toHaveLength(1);
  });

  test('オンライン時は従来どおり結果画面へ遷移する', async () => {
    setNavigatorOnline(true);
    renderRouteWithProviders('/scan');

    await decode('9784003101018');

    expect(await screen.findByText('検索結果')).toBeInTheDocument();
  });
});

describe('BarcodeScannerPage GA4 計測（#169）', () => {
  let originalMediaDevices: PropertyDescriptor | undefined;
  const trackScanSuccess = vi.mocked(trackIsbnScanSuccess);

  beforeEach(() => {
    trackScanSuccess.mockClear();
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
    zxingMock.decodeCallback = undefined;
  });

  afterEach(() => {
    setNavigatorOnline(true);
    zxingMock.decodeCallback = undefined;
    if (originalMediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).mediaDevices;
    }
  });

  test('ISBNを読み取れたら計測する', async () => {
    renderRouteWithProviders('/scan');

    await decode('9784003101018');

    expect(trackScanSuccess).toHaveBeenCalledTimes(1);
  });

  test('同じバーコードを続けて読んでも1回しか計測しない', async () => {
    // zxing は同じコードを毎フレーム読むため、二重計測になりやすい。
    renderRouteWithProviders('/scan');

    await decode('9784003101018');
    await decode('9784003101018');

    expect(trackScanSuccess).toHaveBeenCalledTimes(1);
  });

  test('ISBN以外のバーコード（価格コード）では計測しない', async () => {
    renderRouteWithProviders('/scan');

    await decode('1920093000903');

    expect(trackScanSuccess).not.toHaveBeenCalled();
  });

  test('オフライン保留では計測しない（送信できず重複もし得るため）', async () => {
    setNavigatorOnline(false);
    renderRouteWithProviders('/scan');

    await decode('9784003101018');

    expect(
      await screen.findByText('オフラインのため保留しました（1件）'),
    ).toBeInTheDocument();
    expect(trackScanSuccess).not.toHaveBeenCalled();
  });
});

describe('BarcodeScannerPage トーチ対応端末での停止（#175）', () => {
  let originalMediaDevices: PropertyDescriptor | undefined;
  const originalStop = zxingMock.controls.stop;
  const unhandled = collectUnhandledRejections();

  beforeEach(() => {
    originalMediaDevices = Object.getOwnPropertyDescriptor(
      navigator,
      'mediaDevices',
    );
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve({}) },
    });
    zxingMock.controls.switchTorch = vi.fn().mockResolvedValue(undefined);
    zxingMock.startError = undefined;
    zxingMock.decodeCallback = undefined;
  });

  afterEach(() => {
    zxingMock.controls.stop = originalStop;
    zxingMock.controls.switchTorch = undefined;
    zxingMock.decodeCallback = undefined;
    if (originalMediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).mediaDevices;
    }
  });

  test('停止時の torch OFF が reject しても未処理 rejection にせず結果画面へ遷移する', async () => {
    // トーチ対応端末では zxing の stop が async（トラック停止 → torch OFF）になり、
    // 停止済みトラックへの torch OFF が reject する（Sentry LIBCHECK-3）。
    // reject を返すモックは vi.fn ではなく素の関数で書く（collectUnhandledRejections 参照）。
    let stopCalls = 0;
    zxingMock.controls.stop = () => {
      stopCalls += 1;
      return Promise.reject(
        new DOMException('setPhotoOptions failed', 'UnknownError'),
      );
    };
    renderRouteWithProviders('/scan');

    await decode('9784003101018');

    expect(await screen.findByText('検索結果')).toBeInTheDocument();
    // 遷移先の結果画面の状態更新と重なるため act で包む。
    await act(() => unhandled.flush());
    expect(stopCalls).toBe(1);
    expect(unhandled.reasons).toEqual([]);
  });
});
