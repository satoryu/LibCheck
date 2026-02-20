import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/data/exceptions/calil_api_exception.dart';

void main() {
  group('CalilApiException hierarchy', () {
    test('toString includes class name and message', () {
      const e = CalilNetworkException('Connection failed');
      expect(e.toString(), 'CalilNetworkException: Connection failed');
    });
  });
}
