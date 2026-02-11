import 'package:flutter/material.dart';

class HistoryPlaceholderPage extends StatelessWidget {
  const HistoryPlaceholderPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('検索履歴'),
      ),
      body: const Center(
        child: Text('検索履歴は今後のアップデートで追加されます'),
      ),
    );
  }
}
