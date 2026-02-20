import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/data/exceptions/calil_api_exception.dart';
import 'package:libcheck/presentation/utils/error_message_resolver.dart';

void main() {
  group('ErrorMessageResolver', () {
    test('returns network message for CalilNetworkException', () {
      const error = CalilNetworkException('Connection refused');
      expect(
        ErrorMessageResolver.resolve(error),
        'インターネット接続を確認してください',
      );
    });

    test('returns timeout message for CalilTimeoutException', () {
      const error = CalilTimeoutException('Polling timeout');
      expect(
        ErrorMessageResolver.resolve(error),
        '応答に時間がかかっています。再度お試しください',
      );
    });

    test('returns http message for CalilHttpException', () {
      const error = CalilHttpException('Server error', statusCode: 500);
      expect(
        ErrorMessageResolver.resolve(error),
        'サーバーとの通信に失敗しました',
      );
    });

    test('returns parse message for CalilParseException', () {
      const error = CalilParseException('Invalid JSON');
      expect(
        ErrorMessageResolver.resolve(error),
        'データの読み取りに失敗しました',
      );
    });

    test('returns generic message for unknown exceptions', () {
      final error = Exception('something went wrong');
      expect(
        ErrorMessageResolver.resolve(error),
        'エラーが発生しました',
      );
    });

  });
}
