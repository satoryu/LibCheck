import { describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/testUtils';
import { CameraErrorWidget } from '@/presentation/widgets/CameraErrorWidget';

describe('CameraErrorWidget', () => {
  test('「再試行」ボタンをタップするとonRetryが呼ばれる', async () => {
    const onRetry = vi.fn();

    const { user } = renderWithProviders(
      <CameraErrorWidget onRetry={onRetry} onManualInput={() => {}} />,
    );

    await user.click(screen.getByText('再試行'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('「ISBNを手動入力する」ボタンをタップするとonManualInputが呼ばれる', async () => {
    const onManualInput = vi.fn();

    const { user } = renderWithProviders(
      <CameraErrorWidget onRetry={() => {}} onManualInput={onManualInput} />,
    );

    await user.click(screen.getByText('ISBNを手動入力する'));

    expect(onManualInput).toHaveBeenCalledTimes(1);
  });
});
