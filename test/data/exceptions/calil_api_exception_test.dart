import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/data/exceptions/calil_api_exception.dart';

void main() {
  group('CalilApiException hierarchy', () {
    test('CalilNetworkException is a CalilApiException', () {
      const e = CalilNetworkException('No internet');
      expect(e, isA<CalilApiException>());
      expect(e.message, 'No internet');
    });

    test('CalilHttpException includes statusCode', () {
      const e = CalilHttpException('Server error', statusCode: 500);
      expect(e, isA<CalilApiException>());
      expect(e.statusCode, 500);
      expect(e.message, 'Server error');
    });

    test('CalilParseException is a CalilApiException', () {
      const e = CalilParseException('Invalid JSON');
      expect(e, isA<CalilApiException>());
      expect(e.message, 'Invalid JSON');
    });

    test('CalilTimeoutException is a CalilApiException', () {
      const e = CalilTimeoutException('Polling timeout');
      expect(e, isA<CalilApiException>());
      expect(e.message, 'Polling timeout');
    });

    test('toString includes class name and message', () {
      const e = CalilNetworkException('Connection failed');
      expect(e.toString(), 'CalilNetworkException: Connection failed');
    });
  });
}
