import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:libcheck/app.dart';
import 'package:libcheck/data/providers/local_storage_providers.dart';

void main() {
  group('LibCheckApp', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    testWidgets('displays HomePage as home', (tester) async {
      final prefs = await SharedPreferences.getInstance();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sharedPreferencesProvider.overrideWithValue(prefs),
          ],
          child: const LibCheckApp(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('LibCheck'), findsOneWidget);
    });
  });
}
