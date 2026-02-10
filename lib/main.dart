import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:libcheck/app.dart';

void main() {
  runApp(
    const ProviderScope(
      child: LibCheckApp(),
    ),
  );
}
