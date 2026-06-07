import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';

import { renderRouteWithProviders } from '@/test/testUtils';

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
