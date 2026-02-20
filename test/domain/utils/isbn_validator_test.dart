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
    });

    group('isValidIsbn10', () {
      test('有効なISBN-10を受け入れる', () {
        expect(IsbnValidator.isValidIsbn10('4873117585'), isTrue);
      });

      test('チェックディジットがXのISBN-10を受け入れる', () {
        expect(IsbnValidator.isValidIsbn10('0306406152'), isTrue);
      });

      test('チェックディジットが不正なISBN-10を拒否する', () {
        expect(IsbnValidator.isValidIsbn10('4873117586'), isFalse);
      });
    });

    group('normalizeIsbn', () {
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
    });
  });
}
