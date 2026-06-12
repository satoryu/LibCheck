import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';

import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import { renderWithProviders } from '@/test/testUtils';
import { AvailabilityStatusBadge } from '@/presentation/widgets/AvailabilityStatusBadge';

describe('AvailabilityStatusBadge', () => {
  test('shows "貸出可能" for available status', () => {
    renderWithProviders(
      <AvailabilityStatusBadge status={AvailabilityStatus.available} />,
    );

    expect(screen.getByText('貸出可能')).toBeInTheDocument();
  });

  test('shows "貸出中" for checkedOut status', () => {
    renderWithProviders(
      <AvailabilityStatusBadge status={AvailabilityStatus.checkedOut} />,
    );

    expect(screen.getByText('貸出中')).toBeInTheDocument();
  });

  test('shows "蔵書なし" for notFound status', () => {
    renderWithProviders(
      <AvailabilityStatusBadge status={AvailabilityStatus.notFound} />,
    );

    expect(screen.getByText('蔵書なし')).toBeInTheDocument();
  });
});
