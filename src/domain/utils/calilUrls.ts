import type { Library } from '@/domain/models/library';
import { isbnValidator } from '@/domain/utils/isbnValidator';

/**
 * カーリルのページ URL を導出する純粋関数群。
 *
 * カーリル図書館APIの仕様書「カーリルへのリンク」節は、APIで取得した図書館名や
 * 貸出状況を表示する際にカーリルへリンクすることを義務づけている（#156）。
 * ここで生成する URL はすべて既に画面が保持している値から導出できるため、
 * 追加の API 呼び出しは発生しない（＝カーリルの利用制限を消費しない）。
 *
 * 仕様: https://calil.jp/doc/api_ref.html
 */

const CALIL_ORIGIN = 'https://calil.jp';

/**
 * 書籍ページ（`/book/{ISBN10}`）の URL を返す。ISBN-10 が導出できなければ null。
 *
 * 979 で始まる ISBN は ISBN-10 を持たないため null になる。Amazon 側
 * （`amazonProductUrl`）は検索URLにフォールバックするが、カーリルの検索URLは
 * 仕様書に記載が無いため、推測した URL へのリンクは行わない。呼び出し側は
 * null のときリンクを表示しない。
 */
export function calilBookUrl(isbn: string): string | null {
  const isbn10 = isbnValidator.isbn13to10(isbn);
  if (isbn10 === null) return null;
  return `${CALIL_ORIGIN}/book/${isbn10}`;
}

/**
 * 図書館ページの URL を返す。
 *
 * 仕様書が示す第一形式 `/library/{libid}/{正式名称}` を用いる。libId または
 * 正式名称が欠けている場合（`libraryResponseFromJson` は欠損値を空文字に
 * フォールバックする）は、同じく仕様書が示す第二形式
 * `/library/search?s={システムID}&k={Libkey}` を用いる。
 */
export function calilLibraryUrl(library: Library): string {
  const { libId, formalName, systemId, libKey } = library;

  if (libId.length > 0 && formalName.length > 0) {
    return `${CALIL_ORIGIN}/library/${encodeURIComponent(
      libId,
    )}/${encodeURIComponent(formalName)}`;
  }

  return `${CALIL_ORIGIN}/library/search?s=${encodeURIComponent(
    systemId,
  )}&k=${encodeURIComponent(libKey)}`;
}
