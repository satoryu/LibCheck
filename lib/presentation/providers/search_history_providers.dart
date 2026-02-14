import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:libcheck/data/providers/local_storage_providers.dart';
import 'package:libcheck/data/repositories/search_history_repository_impl.dart';
import 'package:libcheck/domain/models/search_history_entry.dart';
import 'package:libcheck/domain/repositories/search_history_repository.dart';

final searchHistoryRepositoryProvider =
    Provider<SearchHistoryRepository>((ref) {
  final localStorage = ref.watch(localStorageRepositoryProvider);
  return SearchHistoryRepositoryImpl(localStorage);
});

class SearchHistoryNotifier extends AsyncNotifier<List<SearchHistoryEntry>> {
  @override
  FutureOr<List<SearchHistoryEntry>> build() async {
    final repository = ref.watch(searchHistoryRepositoryProvider);
    return repository.getAll();
  }

  Future<void> save(SearchHistoryEntry entry) async {
    final repository = ref.read(searchHistoryRepositoryProvider);
    await repository.save(entry);
    state = AsyncValue.data(await repository.getAll());
  }

  Future<void> remove(String isbn) async {
    final repository = ref.read(searchHistoryRepositoryProvider);
    await repository.remove(isbn);
    state = AsyncValue.data(await repository.getAll());
  }

  Future<void> removeAll() async {
    final repository = ref.read(searchHistoryRepositoryProvider);
    await repository.removeAll();
    state = const AsyncValue.data([]);
  }
}

final searchHistoryProvider =
    AsyncNotifierProvider<SearchHistoryNotifier, List<SearchHistoryEntry>>(
  SearchHistoryNotifier.new,
);
