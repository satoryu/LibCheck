import { describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/testUtils';
import { CameraPermissionErrorWidget } from '@/presentation/widgets/CameraPermissionErrorWidget';

describe('CameraPermissionErrorWidget', () => {
  test('「設定を開く」ボタンをタップするとコールバックが呼ばれる', async () => {
    const onOpenSettings = vi.fn();

    const { user } = renderWithProviders(
      <CameraPermissionErrorWidget
        onOpenSettings={onOpenSettings}
        onManualInput={() => {}}
      />,
    );

    await user.click(screen.getByText('設定を開く'));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  test('「ISBNを手動入力する」ボタンをタップするとコールバックが呼ばれる', async () => {
    const onManualInput = vi.fn();

    const { user } = renderWithProviders(
      <CameraPermissionErrorWidget
        onOpenSettings={() => {}}
        onManualInput={onManualInput}
      />,
    );

    await user.click(screen.getByText('ISBNを手動入力する'));

    expect(onManualInput).toHaveBeenCalledTimes(1);
  });
});
