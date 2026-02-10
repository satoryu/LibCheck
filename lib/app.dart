import 'package:flutter/material.dart';

import 'package:libcheck/presentation/pages/home_page.dart';

class LibCheckApp extends StatelessWidget {
  const LibCheckApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LibCheck',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const HomePage(),
    );
  }
}
