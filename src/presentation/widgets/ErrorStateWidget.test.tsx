import { describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';

import {
  CalilNetworkException,
  CalilTimeoutException,
} from '@/data/exceptions/calilApiException';
import { renderWithProviders } from '@/test/testUtils';
import { ErrorStateWidget } from '@/presentation/widgets/ErrorStateWidget';

describe('ErrorStateWidget', () => {
  test('displays user-friendly message for network error', () => {
    renderWithProviders(
      <ErrorStateWidget
        error={new CalilNetworkException('Connection refused')}
        onRetry={() => {}}
      />,
    );

    expect(
      screen.getByText('インターネット接続を確認してください'),
    ).toBeInTheDocument();
  });

  test('displays user-friendly message for timeout error', () => {
    renderWithProviders(
      <ErrorStateWidget
        error={new CalilTimeoutException('Polling timeout')}
        onRetry={() => {}}
      />,
    );

    expect(
      screen.getByText('応答に時間がかかっています。再度お試しください'),
    ).toBeInTheDocument();
  });

  test('calls onRetry when retry button is tapped', async () => {
    const onRetry = vi.fn();

    const { user } = renderWithProviders(
      <ErrorStateWidget error={new Error('test')} onRetry={onRetry} />,
    );

    await user.click(screen.getByText('再試行'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
