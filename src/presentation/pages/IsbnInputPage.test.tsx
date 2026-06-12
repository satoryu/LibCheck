import { describe, it, expect, afterEach } from 'vitest';
import { screen } from '@testing-library/react';

import { makeFakeDeps, renderRouteWithProviders } from '@/test/testUtils';
import type { Library } from '@/domain/models/library';

/**
 * Port of `test/presentation/pages/isbn_input_page_test.dart`.
 *
 * Rendered through the real router so the 検索する button can navigate to
 * `/result/:isbn` (the `BookSearchResultPage` renders both the "検索結果" AppBar
 * title and an `ISBN: <isbn>` line, mirroring the Flutter stub route).
 */
// ホーム画面を表示するために登録しておく図書館
// （登録0件だとホームは /library へリダイレクトされる）。
const sampleLibrary: Library = {
  systemId: 'system1',
  systemName: 'テスト図書館システム',
  libKey: 'key1',
  libId: 'id1',
  shortName: 'テスト図書館',
  formalName: 'テスト図書館',
  address: '東京都港区',
  pref: '東京都',
  city: '港区',
  category: 'MEDIUM',
};

describe('IsbnInputPage', () => {
  afterEach(() => {
    // テストで模擬した履歴インデックスをリセットする。
    window.history.replaceState(null, '');
  });

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

  it('ホームから遷移後、戻るボタンでホームへ戻る', async () => {
    const deps = makeFakeDeps();
    await deps.registeredLibraryRepository.add(sampleLibrary);
    const { user } = renderRouteWithProviders('/', { deps });

    await user.click(await screen.findByText('ISBNを入力'));
    expect(await screen.findByText('ISBN入力')).toBeInTheDocument();

    // createMemoryRouter は window.history を更新しないため、
    // 遷移済みの履歴インデックスを模擬する。
    window.history.replaceState({ idx: 1 }, '');
    await user.click(screen.getByRole('button', { name: '戻る' }));

    expect(await screen.findByText('LibCheck')).toBeInTheDocument();
  });

  it('履歴が無いとき戻るボタンでホームへ遷移する', async () => {
    const deps = makeFakeDeps();
    await deps.registeredLibraryRepository.add(sampleLibrary);
    const { user } = renderRouteWithProviders('/isbn-input', { deps });

    await user.click(await screen.findByRole('button', { name: '戻る' }));

    expect(await screen.findByText('LibCheck')).toBeInTheDocument();
  });

  it('数値キーボードに固定せずX・ハイフンを入力できる', () => {
    // inputMode を numeric に固定すると、モバイルで ISBN-10 のチェック
    // ディジット X やハイフンが入力できなくなる回帰を防ぐ。
    renderRouteWithProviders('/isbn-input');

    const input = screen.getByRole('textbox');
    expect(input.getAttribute('inputmode')).not.toBe('numeric');
  });

  it('末尾Xを含むISBN-10入力後の遷移でXが保持される', async () => {
    const { user } = renderRouteWithProviders('/isbn-input');

    const input = await screen.findByRole('textbox');
    // 小文字 x で入力しても大文字 X に正規化されて遷移する。
    await user.type(input, '080442957x');

    await user.click(await screen.findByRole('button', { name: '検索する' }));

    expect(await screen.findByText('ISBN: 080442957X')).toBeInTheDocument();
  });

  it('ハイフン付きISBN入力後の遷移でハイフンが除去される', async () => {
    const { user } = renderRouteWithProviders('/isbn-input');

    const input = await screen.findByRole('textbox');
    await user.type(input, '978-4-87311-758-4');

    await user.click(await screen.findByRole('button', { name: '検索する' }));

    expect(await screen.findByText('ISBN: 9784873117584')).toBeInTheDocument();
  });
});
