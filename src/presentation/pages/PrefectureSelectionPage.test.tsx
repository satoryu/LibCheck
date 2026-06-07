import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/testUtils';
import { PrefectureSelectionPage } from '@/presentation/pages/PrefectureSelectionPage';

/**
 * Port of `test/presentation/pages/prefecture_selection_page_test.dart`.
 */
describe('PrefectureSelectionPage', () => {
  it('renders AppBar with title', () => {
    renderWithProviders(<PrefectureSelectionPage />);

    expect(screen.getByText('都道府県を選択')).toBeInTheDocument();
  });

  it('displays prefectures under their region groups', () => {
    renderWithProviders(<PrefectureSelectionPage />);

    expect(screen.getByText('北海道')).toBeInTheDocument();
    expect(screen.getByText('青森県')).toBeInTheDocument();
    expect(screen.getByText('東京都')).toBeInTheDocument();
  });

  it('filters prefectures by search text', async () => {
    const { user } = renderWithProviders(<PrefectureSelectionPage />);

    await user.type(screen.getByRole('textbox'), '東京');

    expect(screen.getByText('東京都')).toBeInTheDocument();
    expect(screen.queryByText('北海道')).not.toBeInTheDocument();
    expect(screen.queryByText('大阪府')).not.toBeInTheDocument();
  });

  it('hides region headers with no matching prefectures', async () => {
    const { user } = renderWithProviders(<PrefectureSelectionPage />);

    await user.type(screen.getByRole('textbox'), '東京');

    expect(screen.getByText('関東')).toBeInTheDocument();
    expect(screen.queryByText('北海道・東北')).not.toBeInTheDocument();
  });
});
