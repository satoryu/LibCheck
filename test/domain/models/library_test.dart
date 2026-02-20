import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/library.dart';

void main() {
  group('Library', () {
    test('two libraries with same systemId, libKey, libId are equal', () {
      const lib1 = Library(
        systemId: 'Tokyo_Minato',
        systemName: '港区図書館',
        libKey: 'みなと',
        libId: '123',
        shortName: 'みなと図書館',
        formalName: '港区立みなと図書館',
        address: '東京都港区芝公園3-2-25',
        pref: '東京都',
        city: '港区',
        category: 'MEDIUM',
      );

      const lib2 = Library(
        systemId: 'Tokyo_Minato',
        systemName: '港区図書館（別名）',
        libKey: 'みなと',
        libId: '123',
        shortName: '別の名前',
        formalName: '別の正式名称',
        address: '別の住所',
        pref: '東京都',
        city: '港区',
        category: 'LARGE',
      );

      expect(lib1, equals(lib2));
      expect(lib1.hashCode, equals(lib2.hashCode));
    });

    group('JSON serialization', () {
      const library = Library(
        systemId: 'Tokyo_Minato',
        systemName: '港区図書館',
        libKey: 'みなと',
        libId: '123',
        shortName: 'みなと図書館',
        formalName: '港区立みなと図書館',
        address: '東京都港区芝公園3-2-25',
        pref: '東京都',
        city: '港区',
        category: 'MEDIUM',
        url: 'https://example.com',
        tel: '03-1234-5678',
        geocode: '139.7454,35.6585',
      );

      test('fromJson creates correct instance', () {
        final json = {
          'systemId': 'Tokyo_Minato',
          'systemName': '港区図書館',
          'libKey': 'みなと',
          'libId': '123',
          'shortName': 'みなと図書館',
          'formalName': '港区立みなと図書館',
          'address': '東京都港区芝公園3-2-25',
          'pref': '東京都',
          'city': '港区',
          'category': 'MEDIUM',
          'url': 'https://example.com',
          'tel': '03-1234-5678',
          'geocode': '139.7454,35.6585',
        };

        final result = Library.fromJson(json);
        expect(result.systemId, 'Tokyo_Minato');
        expect(result.systemName, '港区図書館');
        expect(result.libKey, 'みなと');
        expect(result.libId, '123');
        expect(result.shortName, 'みなと図書館');
        expect(result.formalName, '港区立みなと図書館');
        expect(result.address, '東京都港区芝公園3-2-25');
        expect(result.pref, '東京都');
        expect(result.city, '港区');
        expect(result.category, 'MEDIUM');
        expect(result.url, 'https://example.com');
        expect(result.tel, '03-1234-5678');
        expect(result.geocode, '139.7454,35.6585');
      });

      test('roundtrip toJson/fromJson preserves data', () {
        final json = library.toJson();
        final restored = Library.fromJson(json);
        expect(restored, equals(library));
        expect(restored.formalName, library.formalName);
        expect(restored.address, library.address);
        expect(restored.url, library.url);
        expect(restored.tel, library.tel);
        expect(restored.geocode, library.geocode);
      });
    });
  });
}
