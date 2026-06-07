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
  const lastChar = digits[9];
  const lastValue = lastChar === 'X' ? 10 : parseDigit(lastChar);
  if (lastValue === null) return false;
  sum += lastValue;
  return sum % 11 === 0;
}

/** ISBN-13 または ISBN-10 のいずれかで有効か検証 */
function isValidIsbn(isbn: string): boolean {
  const normalized = isbn.replace(/-/g, '');
  return isValidIsbn13(normalized) || isValidIsbn10(normalized);
}

/** ハイフンを除去して正規化 */
function normalizeIsbn(isbn: string): string {
  return isbn.replace(/-/g, '');
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
  getValidationMessage,
};
