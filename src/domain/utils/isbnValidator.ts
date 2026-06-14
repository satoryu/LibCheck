/** ISBN-13 のチェックディジットを検証 */
function isValidIsbn13(isbn: string): boolean {
  const digits = isbn.replace(/-/g, '');
  if (digits.length !== 13) return false;
  if (!digits.startsWith('978') && !digits.startsWith('979')) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseDigit(digits[i]);
    if (digit === null) return false;
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseDigit(digits[12]);
}

/** ISBN-10 のチェックディジットを検証 */
function isValidIsbn10(isbn: string): boolean {
  const digits = isbn.replace(/-/g, '');
  if (digits.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = parseDigit(digits[i]);
    if (digit === null) return false;
    sum += digit * (10 - i);
  }
  // ISBN-10 のチェックディジットは 'X'(=10) になり得る。小文字 'x' も許容する。
  const lastChar = digits[9];
  const lastValue =
    lastChar === 'X' || lastChar === 'x' ? 10 : parseDigit(lastChar);
  if (lastValue === null) return false;
  sum += lastValue;
  return sum % 11 === 0;
}

/** ISBN-13 または ISBN-10 のいずれかで有効か検証 */
function isValidIsbn(isbn: string): boolean {
  const normalized = isbn.replace(/-/g, '');
  return isValidIsbn13(normalized) || isValidIsbn10(normalized);
}

/** ハイフンを除去し、ISBN-10 のチェックディジット 'x' を大文字 'X' に正規化 */
function normalizeIsbn(isbn: string): string {
  return isbn.replace(/-/g, '').toUpperCase();
}

/**
 * ISBN-13 を ISBN-10 へ変換する。
 *
 * - 978 始まりの ISBN-13: 中央9桁から mod11 でチェックディジット（10→'X'）を再計算して返す。
 * - 979 始まりの ISBN-13: 対応する ISBN-10 が存在しないため null。
 * - 既に ISBN-10 の入力: 有効なら正規化して返し、無効なら null。
 * - それ以外（桁数不正・非数字を含む等）: null。
 *
 * Amazon の書影URL・`/dp/` リンクは ISBN-10(=書籍のASIN) を必要とするため用いる。
 */
function isbn13to10(isbn: string): string | null {
  const digits = normalizeIsbn(isbn);

  if (digits.length === 10) {
    return isValidIsbn10(digits) ? digits : null;
  }
  if (digits.length !== 13) return null;
  // ISBN-13 は全桁が数字（チェックディジットも含め 'X' は使わない）。
  for (let i = 0; i < 13; i++) {
    if (parseDigit(digits[i]) === null) return null;
  }
  // 979 始まりは ISBN-10 を持たない。
  if (!digits.startsWith('978')) return null;

  const core = digits.slice(3, 12); // 中央9桁（ISBN-10 のチェックディジットを除く部分）
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += (parseDigit(core[i]) as number) * (10 - i);
  }
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? 'X' : String(check));
}

/**
 * 入力値に対するバリデーションメッセージを返す。
 * null の場合はエラーなし（有効または入力途中）。
 */
function getValidationMessage(value: string): string | null {
  const normalized = value.replace(/-/g, '');
  if (normalized.length === 0) return null;
  if (normalized.length < 10) return null;
  if (normalized.length === 10) {
    return isValidIsbn10(normalized)
      ? null
      : 'ISBN-10 のチェックディジットが正しくありません';
  }
  if (normalized.length === 13) {
    if (!normalized.startsWith('978') && !normalized.startsWith('979')) {
      return 'ISBN-13 は 978 または 979 で始まる必要があります';
    }
    return isValidIsbn13(normalized)
      ? null
      : 'ISBN-13 のチェックディジットが正しくありません';
  }
  return 'ISBNは10桁または13桁で入力してください';
}

/**
 * Parse a single character as a base-10 digit. Mirrors Dart `int.tryParse`
 * for a single character: only ASCII 0-9 are accepted, returns null otherwise.
 */
function parseDigit(char: string): number | null {
  if (char.length !== 1 || char < '0' || char > '9') return null;
  return char.charCodeAt(0) - 48;
}

export const isbnValidator = {
  isValidIsbn13,
  isValidIsbn10,
  isValidIsbn,
  normalizeIsbn,
  isbn13to10,
  getValidationMessage,
};
