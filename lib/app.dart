import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:libcheck/presentation/router/app_router.dart';

class LibCheckApp extends ConsumerWidget {
  const LibCheckApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'LibCheck',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF00796B),
        ),
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
