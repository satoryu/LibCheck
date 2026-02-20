import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/data/models/check_response.dart';

void main() {
  group('CheckResponse', () {
    test('parses complete response with continue=0', () {
      final json = {
        'session': 'abc123',
        'continue': 0,
        'books': {
          '9784774142230': {
            'Tokyo_Minato': {
              'status': 'OK',
              'reserveurl': 'https://example.com/reserve',
              'libkey': {
                'みなと': '貸出可',
                '三田': '貸出中',
              },
            },
          },
        },
      };

      final response = CheckResponse.fromJson(json);

      expect(response.session, 'abc123');
      expect(response.continueFlag, 0);
      expect(response.books, hasLength(1));

      final bookStatus = response.books['9784774142230']!['Tokyo_Minato']!;
      expect(bookStatus.status, 'OK');
      expect(bookStatus.reserveUrl, 'https://example.com/reserve');
      expect(bookStatus.libKeys, {'みなと': '貸出可', '三田': '貸出中'});
    });

  });

  group('BookSystemStatus', () {
    test('parses from JSON with reserveurl', () {
      final json = {
        'status': 'OK',
        'reserveurl': 'https://example.com/reserve',
        'libkey': {'みなと': '貸出可'},
      };

      final status = BookSystemStatus.fromJson(json);

      expect(status.status, 'OK');
      expect(status.reserveUrl, 'https://example.com/reserve');
      expect(status.libKeys, {'みなと': '貸出可'});
    });

    test('parses empty string reserveurl as null', () {
      final json = {
        'status': 'OK',
        'reserveurl': '',
        'libkey': {'みなと': '貸出可'},
      };

      final status = BookSystemStatus.fromJson(json);

      expect(status.reserveUrl, isNull);
    });
  });
}
