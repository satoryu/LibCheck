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

    test('region names are correct', () {
      final regionNames =
          JapanesePrefectures.regions.map((r) => r.name).toList();
      expect(regionNames, [
        '北海道・東北',
        '関東',
        '中部',
        '近畿',
        '中国',
        '四国',
        '九州・沖縄',
      ]);
    });

    test('北海道・東北 region contains correct prefectures', () {
      final region =
          JapanesePrefectures.regions.firstWhere((r) => r.name == '北海道・東北');
      expect(region.prefectures, [
        '北海道',
        '青森県',
        '岩手県',
        '宮城県',
        '秋田県',
        '山形県',
        '福島県',
      ]);
    });

    test('関東 region contains correct prefectures', () {
      final region =
          JapanesePrefectures.regions.firstWhere((r) => r.name == '関東');
      expect(region.prefectures, [
        '茨城県',
        '栃木県',
        '群馬県',
        '埼玉県',
        '千葉県',
        '東京都',
        '神奈川県',
      ]);
    });

    test('allPrefectures starts with 北海道 and ends with 沖縄県', () {
      final all = JapanesePrefectures.allPrefectures;
      expect(all.first, '北海道');
      expect(all.last, '沖縄県');
    });
  });

  group('RegionGroup', () {
    test('can be instantiated with name and prefectures', () {
      const region = RegionGroup(
        name: 'テスト地方',
        prefectures: ['テスト県'],
      );
      expect(region.name, 'テスト地方');
      expect(region.prefectures, ['テスト県']);
    });
  });
}
