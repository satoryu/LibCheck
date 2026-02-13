class IsbnValidator {
  /// ISBN-13 のチェックディジットを検証
  static bool isValidIsbn13(String isbn) {
    final digits = isbn.replaceAll('-', '');
    if (digits.length != 13) return false;
    if (!digits.startsWith('978') && !digits.startsWith('979')) return false;
    var sum = 0;
    for (var i = 0; i < 12; i++) {
      final digit = int.tryParse(digits[i]);
      if (digit == null) return false;
      sum += (i.isEven) ? digit : digit * 3;
    }
    final checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit == int.tryParse(digits[12]);
  }

  /// ISBN-10 のチェックディジットを検証
  static bool isValidIsbn10(String isbn) {
    final digits = isbn.replaceAll('-', '');
    if (digits.length != 10) return false;
    var sum = 0;
    for (var i = 0; i < 9; i++) {
      final digit = int.tryParse(digits[i]);
      if (digit == null) return false;
      sum += digit * (10 - i);
    }
    final lastChar = digits[9];
    final lastValue = lastChar == 'X' ? 10 : int.tryParse(lastChar);
    if (lastValue == null) return false;
    sum += lastValue;
    return sum % 11 == 0;
  }

  /// ISBN-13 または ISBN-10 のいずれかで有効か検証
  static bool isValidIsbn(String isbn) {
    final normalized = isbn.replaceAll('-', '');
    return isValidIsbn13(normalized) || isValidIsbn10(normalized);
  }

  /// ハイフンを除去して正規化
  static String normalizeIsbn(String isbn) => isbn.replaceAll('-', '');

  /// 入力値に対するバリデーションメッセージを返す
  /// null の場合はエラーなし（有効または入力途中）
  static String? getValidationMessage(String value) {
    final normalized = value.replaceAll('-', '');
    if (normalized.isEmpty) return null;
    if (normalized.length < 10) return null;
    if (normalized.length == 10) {
      return isValidIsbn10(normalized)
          ? null
          : 'ISBN-10 のチェックディジットが正しくありません';
    }
    if (normalized.length == 13) {
      if (!normalized.startsWith('978') && !normalized.startsWith('979')) {
        return 'ISBN-13 は 978 または 979 で始まる必要があります';
      }
      return isValidIsbn13(normalized)
          ? null
          : 'ISBN-13 のチェックディジットが正しくありません';
    }
    return 'ISBNは10桁または13桁で入力してください';
  }
}
