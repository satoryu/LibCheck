import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/testUtils';
import { ScanOverlayWidget } from '@/presentation/widgets/ScanOverlayWidget';

describe('ScanOverlayWidget', () => {
  test('ヘルプテキストが表示される', () => {
    renderWithProviders(<ScanOverlayWidget />);

    expect(
      screen.getByText('バーコードをガイド枠に合わせてください'),
    ).toBeInTheDocument();
  });
});
