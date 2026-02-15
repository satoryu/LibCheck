import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:libcheck/app.dart';
import 'package:libcheck/data/providers/local_storage_providers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  late SharedPreferences prefs;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    prefs = await SharedPreferences.getInstance();
  });

  Widget createApp() {
    return ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const LibCheckApp(),
    );
  }

  group('アプリ起動テスト', () {
    testWidgets('アプリが起動しホームページが表示される', (tester) async {
      await tester.pumpWidget(createApp());
      await tester.pumpAndSettle();

      expect(find.text('LibCheck'), findsOneWidget);
      expect(find.text('図書館の蔵書をかんたん検索'), findsOneWidget);
      expect(find.text('バーコードでスキャン'), findsOneWidget);
      expect(find.text('ISBNを入力'), findsOneWidget);
    });

    testWidgets('BottomNavigationBarが表示される', (tester) async {
      await tester.pumpWidget(createApp());
      await tester.pumpAndSettle();

      expect(find.text('ホーム'), findsOneWidget);
      expect(find.text('図書館'), findsOneWidget);
      expect(find.text('履歴'), findsOneWidget);
    });
  });

  group('タブナビゲーションテスト', () {
    testWidgets('図書館タブに切り替えられる', (tester) async {
      await tester.pumpWidget(createApp());
      await tester.pumpAndSettle();

      await tester.tap(find.text('図書館'));
      await tester.pumpAndSettle();

      expect(find.text('登録図書館'), findsOneWidget);
    });

    testWidgets('履歴タブに切り替えられる', (tester) async {
      await tester.pumpWidget(createApp());
      await tester.pumpAndSettle();

      await tester.tap(find.text('履歴'));
      await tester.pumpAndSettle();

      expect(find.text('検索履歴'), findsOneWidget);
    });

    testWidgets('タブを順番に切り替えてホームに戻れる', (tester) async {
      await tester.pumpWidget(createApp());
      await tester.pumpAndSettle();

      // 図書館タブ
      await tester.tap(find.text('図書館'));
      await tester.pumpAndSettle();
      expect(find.text('登録図書館'), findsOneWidget);

      // 履歴タブ
      await tester.tap(find.text('履歴'));
      await tester.pumpAndSettle();
      expect(find.text('検索履歴'), findsOneWidget);

      // ホームタブに戻る
      await tester.tap(find.text('ホーム'));
      await tester.pumpAndSettle();
      expect(find.text('図書館の蔵書をかんたん検索'), findsOneWidget);
    });
  });

  group('ISBN手動入力テスト', () {
    testWidgets('ISBN入力画面に遷移できる', (tester) async {
      await tester.pumpWidget(createApp());
      await tester.pumpAndSettle();

      await tester.tap(find.text('ISBNを入力'));
      await tester.pumpAndSettle();

      expect(find.text('ISBN入力'), findsOneWidget);
      expect(find.text('ISBNを入力してください'), findsOneWidget);
    });

    testWidgets('ISBNを入力できる', (tester) async {
      await tester.pumpWidget(createApp());
      await tester.pumpAndSettle();

      await tester.tap(find.text('ISBNを入力'));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextField),
        '9784167158057',
      );
      await tester.pumpAndSettle();

      expect(find.text('有効なISBNです'), findsOneWidget);

      // 検索ボタンが有効になっている
      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      expect(button.onPressed, isNotNull);
    });
  });
}
