import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/presentation/providers/app_providers.dart';

void main() {
  group('appTitleProvider', () {
    test('returns "LibCheck"', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final title = container.read(appTitleProvider);
      expect(title, 'LibCheck');
    });
  });
}
