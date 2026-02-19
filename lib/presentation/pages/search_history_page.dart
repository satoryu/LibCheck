import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/domain/models/search_history_entry.dart';
import 'package:libcheck/presentation/providers/search_history_providers.dart';
import 'package:libcheck/presentation/theme/app_colors.dart';
import 'package:libcheck/presentation/widgets/error_state_widget.dart';
import 'package:libcheck/presentation/widgets/search_history_card.dart';

class SearchHistoryPage extends ConsumerWidget {
  const SearchHistoryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(searchHistoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('検索履歴'),
        actions: [
          if (historyAsync case AsyncData(value: final entries)
              when entries.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep),
              onPressed: () => _showDeleteAllDialog(context, ref),
            ),
        ],
      ),
      body: historyAsync.when(
        loading: () => const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('読み込み中...'),
            ],
          ),
        ),
        error: (error, _) => ErrorStateWidget(
          error: error,
          onRetry: () => ref.invalidate(searchHistoryProvider),
        ),
        data: (entries) {
          if (entries.isEmpty) {
            return _buildEmptyState();
          }
          return _buildHistoryList(context, ref, entries);
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history, size: 48, color: AppColors.inactive),
          SizedBox(height: 16),
          Text('検索履歴はありません'),
          SizedBox(height: 8),
          Text('書籍を検索すると履歴が保存されます'),
        ],
      ),
    );
  }

  Widget _buildHistoryList(
    BuildContext context,
    WidgetRef ref,
    List<SearchHistoryEntry> entries,
  ) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: entries.length,
      itemBuilder: (context, index) {
        final entry = entries[index];
        return Dismissible(
          key: Key(entry.isbn),
          direction: DismissDirection.endToStart,
          background: Container(
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.only(right: 16),
            color: AppColors.error,
            child: const Icon(Icons.delete, color: Colors.white),
          ),
          onDismissed: (_) {
            ref.read(searchHistoryProvider.notifier).remove(entry.isbn);
          },
          child: SearchHistoryCard(
            entry: entry,
            onTap: () => context.push('/result/${entry.isbn}'),
          ),
        );
      },
    );
  }

  void _showDeleteAllDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('全履歴を削除'),
        content: const Text('すべての検索履歴を削除しますか？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('キャンセル'),
          ),
          TextButton(
            onPressed: () {
              ref.read(searchHistoryProvider.notifier).removeAll();
              Navigator.of(context).pop();
            },
            child: const Text('削除'),
          ),
        ],
      ),
    );
  }
}
