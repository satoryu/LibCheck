import { isbnValidator } from '@/domain/utils/isbnValidator';

/**
 * バーコードのデコード結果の解釈。
 *
 * - `isbn`: ISBN-13（978/979 で始まりチェックディジットが一致）として読み取れた。
 * - `nonIsbn`: バーコードは読めたが ISBN ではない（例: 日本の書籍下段の価格・分類
 *   コード `192…`）。検索には使えないため無視するが、利用者には別バーコードを
 *   読み取った旨をフィードバックするために区別する。
 */
export type ScanInterpretation =
  | { kind: 'isbn'; isbn: string }
  | { kind: 'nonIsbn' };

/**
 * デコードされた生のバーコード文字列を解釈する。
 *
 * 日本の書籍は上段（ISBN `978…`）と下段（価格コード `192…`）の2段バーコードが
 * 多く、カメラが下段を先に読むと検索に使えない。ここで ISBN かどうかを判定し、
 * 呼び出し側が「遷移」と「フィードバックして読み取り継続」を切り替えられるようにする。
 */
export function interpretScannedBarcode(rawValue: string): ScanInterpretation {
  const normalized = isbnValidator.normalizeIsbn(rawValue);
  if (isbnValidator.isValidIsbn13(normalized)) {
    return { kind: 'isbn', isbn: normalized };
  }
  return { kind: 'nonIsbn' };
}
