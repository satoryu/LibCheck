import 'package:flutter_test/flutter_test.dart';
import 'package:libcheck/domain/utils/isbn_validator.dart';

void main() {
  group('IsbnValidator', () {
    group('isValidIsbn13', () {
      test('有効なISBN-13を受け入れる（978プレフィックス）', () {
        expect(IsbnValidator.isValidIsbn13('9784873117584'), isTrue);
      });

      test('有効なISBN-13を受け入れる（979プレフィックス）', () {
        expect(IsbnValidator.isValidIsbn13('9791032305690'), isTrue);
      });

      test('ハイフン付きISBN-13を受け入れる', () {
        expect(IsbnValidator.isValidIsbn13('978-4-87311-758-4'), isTrue);
      });

      test('チェックディジットが不正なISBN-13を拒否する', () {
        expect(IsbnValidator.isValidIsbn13('9784873117585'), isFalse);
      });

      test('978/979以外のプレフィックスを拒否する', () {
        expect(IsbnValidator.isValidIsbn13('9774873117584'), isFalse);
      });

      test('桁数が足りないISBN-13を拒否する', () {
        expect(IsbnValidator.isValidIsbn13('978487311758'), isFalse);
      });

      test('桁数が多すぎるISBN-13を拒否する', () {
        expect(IsbnValidator.isValidIsbn13('97848731175844'), isFalse);
      });

      test('空文字列を拒否する', () {
        expect(IsbnValidator.isValidIsbn13(''), isFalse);
      });

      test('数字以外の文字を含むISBN-13を拒否する（ハイフン以外）', () {
        expect(IsbnValidator.isValidIsbn13('978487311758a'), isFalse);
      });

      test('チェックディジットが0のISBN-13を検証する', () {
        // 9+21+8+0+6+0+0+0+0+0+0+6 = 50, check = (10-0)%10 = 0
        expect(IsbnValidator.isValidIsbn13('9780200000000'), isTrue);
      });
    });

    group('isValidIsbn10', () {
      test('有効なISBN-10を受け入れる', () {
        expect(IsbnValidator.isValidIsbn10('4873117585'), isTrue);
      });

      test('ハイフン付きISBN-10を受け入れる', () {
        expect(IsbnValidator.isValidIsbn10('4-87311-758-5'), isTrue);
      });

      test('チェックディジットがXのISBN-10を受け入れる', () {
        expect(IsbnValidator.isValidIsbn10('0306406152'), isTrue);
      });

      test('チェックディジットが不正なISBN-10を拒否する', () {
        expect(IsbnValidator.isValidIsbn10('4873117586'), isFalse);
      });

      test('桁数が足りないISBN-10を拒否する', () {
        expect(IsbnValidator.isValidIsbn10('487311758'), isFalse);
      });

      test('桁数が多すぎるISBN-10を拒否する', () {
        expect(IsbnValidator.isValidIsbn10('48731175855'), isFalse);
      });

      test('空文字列を拒否する', () {
        expect(IsbnValidator.isValidIsbn10(''), isFalse);
      });

      test('末尾以外にXが含まれるISBN-10を拒否する', () {
        expect(IsbnValidator.isValidIsbn10('X873117585'), isFalse);
      });
    });

    group('isValidIsbn', () {
      test('有効なISBN-13を受け入れる', () {
        expect(IsbnValidator.isValidIsbn('9784873117584'), isTrue);
      });

      test('有効なISBN-10を受け入れる', () {
        expect(IsbnValidator.isValidIsbn('4873117585'), isTrue);
      });

      test('ハイフン付きISBNを受け入れる', () {
        expect(IsbnValidator.isValidIsbn('978-4-87311-758-4'), isTrue);
      });

      test('無効なISBNを拒否する', () {
        expect(IsbnValidator.isValidIsbn('1234567890123'), isFalse);
      });

      test('空文字列を拒否する', () {
        expect(IsbnValidator.isValidIsbn(''), isFalse);
      });
    });

    group('normalizeIsbn', () {
      test('ハイフンを除去する', () {
        expect(
          IsbnValidator.normalizeIsbn('978-4-87311-758-4'),
          equals('9784873117584'),
        );
      });

      test('ハイフンが無い場合はそのまま返す', () {
        expect(
          IsbnValidator.normalizeIsbn('9784873117584'),
          equals('9784873117584'),
        );
      });

      test('空文字列はそのまま返す', () {
        expect(IsbnValidator.normalizeIsbn(''), equals(''));
      });
    });

    group('getValidationMessage', () {
      test('空文字列の場合はnullを返す', () {
        expect(IsbnValidator.getValidationMessage(''), isNull);
      });

      test('入力途中（10桁未満）の場合はnullを返す', () {
        expect(IsbnValidator.getValidationMessage('978410'), isNull);
      });

      test('9桁の入力途中もnullを返す', () {
        expect(IsbnValidator.getValidationMessage('978410101'), isNull);
      });

      test('有効なISBN-10の場合はnullを返す', () {
        expect(IsbnValidator.getValidationMessage('4873117585'), isNull);
      });

      test('有効なISBN-13の場合はnullを返す', () {
        expect(IsbnValidator.getValidationMessage('9784873117584'), isNull);
      });

      test('ハイフン付き有効なISBN-13の場合はnullを返す', () {
        expect(
          IsbnValidator.getValidationMessage('978-4-87311-758-4'),
          isNull,
        );
      });

      test('ISBN-10のチェックディジットが不正な場合はエラーメッセージを返す', () {
        expect(
          IsbnValidator.getValidationMessage('4873117586'),
          equals('ISBN-10 のチェックディジットが正しくありません'),
        );
      });

      test('ISBN-13のチェックディジットが不正な場合はエラーメッセージを返す', () {
        expect(
          IsbnValidator.getValidationMessage('9784873117585'),
          equals('ISBN-13 のチェックディジットが正しくありません'),
        );
      });

      test('ISBN-13のプレフィックスが不正な場合はエラーメッセージを返す', () {
        expect(
          IsbnValidator.getValidationMessage('1234567890123'),
          equals('ISBN-13 は 978 または 979 で始まる必要があります'),
        );
      });

      test('11桁の場合は桁数エラーメッセージを返す', () {
        expect(
          IsbnValidator.getValidationMessage('12345678901'),
          equals('ISBNは10桁または13桁で入力してください'),
        );
      });

      test('12桁の場合は桁数エラーメッセージを返す', () {
        expect(
          IsbnValidator.getValidationMessage('123456789012'),
          equals('ISBNは10桁または13桁で入力してください'),
        );
      });

      test('14桁以上の場合は桁数エラーメッセージを返す', () {
        expect(
          IsbnValidator.getValidationMessage('12345678901234'),
          equals('ISBNは10桁または13桁で入力してください'),
        );
      });
    });
  });
}
