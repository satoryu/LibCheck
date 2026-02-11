import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:libcheck/presentation/providers/library_list_providers.dart';

class LibraryListPage extends ConsumerWidget {
  const LibraryListPage({
    super.key,
    required this.prefecture,
    required this.city,
  });

  final String prefecture;
  final String city;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final param = LibraryListParam(pref: prefecture, city: city);
    final librariesAsync = ref.watch(libraryListProvider(param));
    final selected = ref.watch(selectedLibrariesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('$cityの図書館'),
      ),
      body: librariesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 16),
              const Text('エラーが発生しました'),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ref.invalidate(libraryListProvider(param)),
                child: const Text('再試行する'),
              ),
            ],
          ),
        ),
        data: (libraries) {
          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  itemCount: libraries.length,
                  itemBuilder: (context, index) {
                    final library = libraries[index];
                    final isSelected = selected.contains(library);
                    return CheckboxListTile(
                      title: Text(library.formalName),
                      subtitle: Text(library.address),
                      value: isSelected,
                      onChanged: (_) {
                        ref
                            .read(selectedLibrariesProvider.notifier)
                            .toggle(library);
                      },
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: selected.isEmpty ? null : () {},
                    child: Text(
                      selected.isEmpty
                          ? '選択した図書館を登録する'
                          : '選択した図書館を登録する（${selected.length}件選択中）',
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
