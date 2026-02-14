import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/presentation/providers/registered_library_providers.dart';

class LibraryManagementPage extends ConsumerWidget {
  const LibraryManagementPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final registeredLibraries = ref.watch(registeredLibrariesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('登録図書館'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/library/add'),
            tooltip: '追加',
          ),
        ],
      ),
      body: registeredLibraries.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('エラー: $error')),
        data: (libraries) {
          if (libraries.isEmpty) {
            return _buildEmptyState(context);
          }
          return _buildLibraryList(context, ref, libraries);
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.local_library, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text('図書館が登録されていません'),
          const SizedBox(height: 8),
          const Text(
            'よく利用する図書館を登録すると、\n蔵書を簡単に検索できます。',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => context.push('/library/add'),
            child: const Text('図書館を登録する'),
          ),
        ],
      ),
    );
  }

  Widget _buildLibraryList(
    BuildContext context,
    WidgetRef ref,
    List<Library> libraries,
  ) {
    return ListView.builder(
      itemCount: libraries.length,
      itemBuilder: (context, index) {
        final library = libraries[index];
        return ListTile(
          title: Text(library.formalName),
          subtitle: Text('${library.pref}${library.city}'),
          trailing: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () {
              _showDeleteDialog(context, ref, library);
            },
          ),
        );
      },
    );
  }

  void _showDeleteDialog(
    BuildContext context,
    WidgetRef ref,
    Library library,
  ) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('図書館の登録を解除しますか？'),
          content: Text('「${library.formalName}」の登録を解除します。'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('キャンセル'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                ref
                    .read(registeredLibrariesProvider.notifier)
                    .remove(library);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text('図書館の登録を解除しました'),
                    action: SnackBarAction(
                      label: '元に戻す',
                      onPressed: () {
                        ref
                            .read(registeredLibrariesProvider.notifier)
                            .add(library);
                      },
                    ),
                    duration: const Duration(seconds: 5),
                  ),
                );
              },
              child: const Text('解除する'),
            ),
          ],
        );
      },
    );
  }
}
