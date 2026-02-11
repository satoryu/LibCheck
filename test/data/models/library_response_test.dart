import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/data/models/library_response.dart';

void main() {
  group('LibraryResponse', () {
    test('parses from JSON correctly', () {
      final json = {
        'systemid': 'Tokyo_Minato',
        'systemname': '港区図書館',
        'libkey': 'みなと',
        'libid': '123456',
        'short': 'みなと図書館',
        'formal': '港区立みなと図書館',
        'url_pc': 'https://example.com',
        'address': '東京都港区芝公園3-2-25',
        'pref': '東京都',
        'city': '港区',
        'post': '105-0011',
        'tel': '03-1234-5678',
        'geocode': '139.7454,35.6586',
        'category': 'MEDIUM',
      };

      final response = LibraryResponse.fromJson(json);

      expect(response.systemId, 'Tokyo_Minato');
      expect(response.systemName, '港区図書館');
      expect(response.libKey, 'みなと');
      expect(response.libId, '123456');
      expect(response.shortName, 'みなと図書館');
      expect(response.formalName, '港区立みなと図書館');
      expect(response.urlPc, 'https://example.com');
      expect(response.address, '東京都港区芝公園3-2-25');
      expect(response.pref, '東京都');
      expect(response.city, '港区');
      expect(response.post, '105-0011');
      expect(response.tel, '03-1234-5678');
      expect(response.geocode, '139.7454,35.6586');
      expect(response.category, 'MEDIUM');
    });

    test('handles missing optional fields', () {
      final json = {
        'systemid': 'Tokyo_Minato',
        'systemname': '港区図書館',
        'libkey': 'みなと',
        'libid': '123456',
        'short': 'みなと図書館',
        'formal': '港区立みなと図書館',
        'address': '東京都港区芝公園3-2-25',
        'pref': '東京都',
        'city': '港区',
        'category': 'MEDIUM',
      };

      final response = LibraryResponse.fromJson(json);

      expect(response.urlPc, isNull);
      expect(response.post, isNull);
      expect(response.tel, isNull);
      expect(response.geocode, isNull);
    });
  });
}
