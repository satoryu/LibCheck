import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { renderRouteWithProviders } from '@/test/testUtils';

/**
 * Port of `test/presentation/pages/isbn_input_page_test.dart`.
 *
 * Rendered through the real router so the 検索する button can navigate to
 * `/result/:isbn` (the `BookSearchResultPage` renders both the "検索結果" AppBar
 * title and an `ISBN: <isbn>` line, mirroring the Flutter stub route).
 */
describe('IsbnInputPage', () => {
  it('AppBarに「ISBN入力」と表示される', async () => {
    renderRouteWithProviders('/isbn-input');

    expect(await screen.findByText('ISBN入力')).toBeInTheDocument();
  });

  it('初期状態で検索ボタンが無効', async () => {
    renderRouteWithProviders('/isbn-input');

    const button = await screen.findByRole('button', { name: '検索する' });
    expect(button).toBeDisabled();
  });

  it('有効なISBN-13入力時に「有効なISBNです」と表示される', async () => {
    const { user } = renderRouteWithProviders('/isbn-input');

    const input = await screen.findByRole('textbox');
    await user.type(input, '9784873117584');

    expect(await screen.findByText('有効なISBNです')).toBeInTheDocument();
  });

  it('有効なISBN-13入力時に検索ボタンが有効になる', async () => {
    const { user } = renderRouteWithProviders('/isbn-input');

    const input = await screen.findByRole('textbox');
    await user.type(input, '9784873117584');

    expect(
      await screen.findByRole('button', { name: '検索する' }),
    ).toBeEnabled();
  });

  it('無効なISBN入力時にエラーメッセージが表示される', async () => {
    const { user } = renderRouteWithProviders('/isbn-input');

    const input = await screen.findByRole('textbox');
    await user.type(input, '9784873117585');

    expect(
      await screen.findByText('ISBN-13 のチェックディジットが正しくありません'),
    ).toBeInTheDocument();
  });

  it('有効なISBN入力後に検索ボタンで/result/:isbnへ遷移する', async () => {
    const { user } = renderRouteWithProviders('/isbn-input');

    const input = await screen.findByRole('textbox');
    await user.type(input, '9784873117584');

    await user.click(await screen.findByRole('button', { name: '検索する' }));

    expect(await screen.findByText('検索結果')).toBeInTheDocument();
    expect(await screen.findByText('ISBN: 9784873117584')).toBeInTheDocument();
  });

  it('バーコードスキャンボタンで/scanへ遷移する', async () => {
    const { user } = renderRouteWithProviders('/isbn-input');

    await user.click(await screen.findByText('バーコードスキャンへ'));

    expect(await screen.findByText('バーコードスキャン')).toBeInTheDocument();
  });

  it('ハイフン付きISBN入力後の遷移でハイフンが除去される', async () => {
    const { user } = renderRouteWithProviders('/isbn-input');

    const input = await screen.findByRole('textbox');
    await user.type(input, '978-4-87311-758-4');

    await user.click(await screen.findByRole('button', { name: '検索する' }));

    expect(await screen.findByText('ISBN: 9784873117584')).toBeInTheDocument();
  });
});
