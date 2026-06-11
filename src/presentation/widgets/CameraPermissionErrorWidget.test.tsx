import { describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/testUtils';
import { CameraPermissionErrorWidget } from '@/presentation/widgets/CameraPermissionErrorWidget';

describe('CameraPermissionErrorWidget', () => {
  test('警告メッセージとブラウザでの許可手順を表示する', () => {
    renderWithProviders(
      <CameraPermissionErrorWidget onRetry={() => {}} onManualInput={() => {}} />,
    );

    expect(
      screen.getByText('カメラへのアクセスが許可されていません'),
    ).toBeInTheDocument();
    // Web ではアプリから設定を開けないため、ブラウザ側での許可手順を案内する。
    expect(
      screen.getByText(/ブラウザの設定でカメラへのアクセスを許可/),
    ).toBeInTheDocument();
  });

  test('「再試行」ボタンをタップするとコールバックが呼ばれる', async () => {
    const onRetry = vi.fn();

    const { user } = renderWithProviders(
      <CameraPermissionErrorWidget
        onRetry={onRetry}
        onManualInput={() => {}}
      />,
    );

    await user.click(screen.getByText('再試行'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('「ISBNを手動入力する」ボタンをタップするとコールバックが呼ばれる', async () => {
    const onManualInput = vi.fn();

    const { user } = renderWithProviders(
      <CameraPermissionErrorWidget
        onRetry={() => {}}
        onManualInput={onManualInput}
      />,
    );

    await user.click(screen.getByText('ISBNを手動入力する'));

    expect(onManualInput).toHaveBeenCalledTimes(1);
  });
});
