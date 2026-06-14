import { describe, expect, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { BookMetadataCard } from '@/presentation/widgets/BookMetadataCard';

describe('BookMetadataCard', () => {
  test('タイトルを表示する', () => {
    render(<BookMetadataCard isbn="9784873117584" title="リーダブルコード" />);

    expect(screen.getByText('リーダブルコード')).toBeInTheDocument();
  });

  test('「Amazonで見る」リンクが /dp/{ISBN-10} を新規タブで開く', () => {
    render(<BookMetadataCard isbn="9784873117584" title="リーダブルコード" />);

    const link = screen.getByRole('link', { name: /Amazonで見る/ });
    expect(link).toHaveAttribute(
      'href',
      'https://www.amazon.co.jp/dp/4873117585',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  test('978始まりは Amazon 書影を初期表示する', () => {
    render(<BookMetadataCard isbn="9784873117584" title="リーダブルコード" />);

    const img = screen.getByTestId('book-cover') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(
      'https://images-na.ssl-images-amazon.com/images/P/4873117585.09.LZZZZZZZ.jpg',
    );
  });

  test('Amazon 書影が読み込めない場合は OpenBD 書影へフォールバックする', () => {
    render(
      <BookMetadataCard
        isbn="9784873117584"
        title="リーダブルコード"
        openBdCoverUrl="https://cover.openbd.jp/9784873117584.jpg"
      />,
    );

    const img = screen.getByTestId('book-cover') as HTMLImageElement;
    fireEvent.error(img);

    expect(img.getAttribute('src')).toBe(
      'https://cover.openbd.jp/9784873117584.jpg',
    );
  });

  test('書影が一つも無ければプレースホルダを表示する', () => {
    // 979始まりは Amazon 書影を導出できず、OpenBD 書影も無い。
    render(<BookMetadataCard isbn="9791032305690" title="洋書" />);

    expect(screen.queryByTestId('book-cover')).not.toBeInTheDocument();
    expect(screen.getByTestId('book-cover-placeholder')).toBeInTheDocument();
  });

  test('読み込み中はタイトルのスケルトンを表示する', () => {
    render(<BookMetadataCard isbn="9784873117584" isLoadingTitle />);

    expect(screen.getByTestId('book-title-skeleton')).toBeInTheDocument();
  });

  test('タイトルが取得できなかった場合は代替文言を表示する', () => {
    render(<BookMetadataCard isbn="9784873117584" />);

    expect(screen.getByText('タイトル情報を取得できませんでした')).toBeInTheDocument();
  });

  test('アソシエイトタグ指定時はリンクに tag= を付与し開示文を表示する', () => {
    render(
      <BookMetadataCard
        isbn="9784873117584"
        title="リーダブルコード"
        associateTag="libcheck-22"
      />,
    );

    const link = screen.getByRole('link', { name: /Amazonで見る/ });
    expect(link).toHaveAttribute(
      'href',
      'https://www.amazon.co.jp/dp/4873117585?tag=libcheck-22',
    );
    expect(screen.getByTestId('affiliate-disclosure')).toBeInTheDocument();
  });

  test('アソシエイトタグ未指定（既定・空）時は通常リンクで開示文を表示しない', () => {
    render(<BookMetadataCard isbn="9784873117584" title="リーダブルコード" />);

    const link = screen.getByRole('link', { name: /Amazonで見る/ });
    expect(link).toHaveAttribute('href', 'https://www.amazon.co.jp/dp/4873117585');
    expect(screen.queryByTestId('affiliate-disclosure')).not.toBeInTheDocument();
  });
});
