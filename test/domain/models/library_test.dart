import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/library.dart';

void main() {
  group('Library', () {
    test('creates instance with required fields', () {
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
      );

      expect(library.systemId, 'Tokyo_Minato');
      expect(library.systemName, '港区図書館');
      expect(library.url, isNull);
      expect(library.tel, isNull);
      expect(library.geocode, isNull);
    });

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

      test('toJson returns correct map', () {
        final json = library.toJson();
        expect(json['systemId'], 'Tokyo_Minato');
        expect(json['systemName'], '港区図書館');
        expect(json['libKey'], 'みなと');
        expect(json['libId'], '123');
        expect(json['shortName'], 'みなと図書館');
        expect(json['formalName'], '港区立みなと図書館');
        expect(json['address'], '東京都港区芝公園3-2-25');
        expect(json['pref'], '東京都');
        expect(json['city'], '港区');
        expect(json['category'], 'MEDIUM');
        expect(json['url'], 'https://example.com');
        expect(json['tel'], '03-1234-5678');
        expect(json['geocode'], '139.7454,35.6585');
      });

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

      test('fromJson handles null optional fields', () {
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
        };

        final result = Library.fromJson(json);
        expect(result.url, isNull);
        expect(result.tel, isNull);
        expect(result.geocode, isNull);
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

    test('two libraries with different ids are not equal', () {
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
        systemId: 'Tokyo_Shibuya',
        systemName: '渋谷区図書館',
        libKey: 'しぶや',
        libId: '456',
        shortName: '渋谷図書館',
        formalName: '渋谷区立中央図書館',
        address: '東京都渋谷区神宮前1-1-1',
        pref: '東京都',
        city: '渋谷区',
        category: 'LARGE',
      );

      expect(lib1, isNot(equals(lib2)));
    });
  });
}
