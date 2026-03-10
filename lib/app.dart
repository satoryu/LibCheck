import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:libcheck/presentation/router/app_router.dart';

class LibCheckApp extends ConsumerWidget {
  const LibCheckApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    const isScreenshotMode = bool.fromEnvironment('SCREENSHOT_MODE');

    return MaterialApp.router(
      title: 'LibCheck',
      debugShowCheckedModeBanner: !isScreenshotMode,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF00796B),
        ),
        useMaterial3: true,
        fontFamily: 'BIZUDGothic',
      ),
      routerConfig: router,
    );
  }
}
