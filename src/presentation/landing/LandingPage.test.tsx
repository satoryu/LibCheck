import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/testUtils';
import { LandingPage } from '@/presentation/landing/LandingPage';

describe('LandingPage', () => {
  it('使い方ガイド（#184）を「対応している図書館を地域から探す」の前に置く', () => {
    renderWithProviders(<LandingPage />);

    const guide = screen.getByRole('region', { name: '使い方ガイド' });
    const region = screen.getByRole('region', { name: '対応している図書館を地域から探す' });
    expect(guide.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
