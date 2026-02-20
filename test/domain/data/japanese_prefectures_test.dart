import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/data/japanese_prefectures.dart';

void main() {
  group('JapanesePrefectures', () {
    test('has 7 region groups', () {
      expect(JapanesePrefectures.regions.length, 7);
    });

    test('contains exactly 47 prefectures in total', () {
      expect(JapanesePrefectures.allPrefectures.length, 47);
    });

    test('has no duplicate prefectures', () {
      final all = JapanesePrefectures.allPrefectures;
      expect(all.toSet().length, all.length);
    });
  });
}
