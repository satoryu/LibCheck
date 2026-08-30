import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/testUtils';
import { PrefectureSelectionPage } from '@/presentation/pages/PrefectureSelectionPage';

const LOGGED_IN_USER = { id: 'test-user', name: 'Test User' };

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

  it('未ログイン時はLibCheckの案内を表示する（#167）', () => {
    renderWithProviders(<PrefectureSelectionPage />);

    expect(screen.getByLabelText('LibCheckについて')).toBeInTheDocument();
  });

  it('ログイン中は案内を表示しない（#167）', () => {
    renderWithProviders(<PrefectureSelectionPage />, {
      authUser: LOGGED_IN_USER,
    });

    expect(screen.queryByLabelText('LibCheckについて')).not.toBeInTheDocument();
  });
});
