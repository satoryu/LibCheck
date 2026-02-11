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
