import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/models/search_history_entry.dart';
import 'package:libcheck/presentation/providers/book_availability_providers.dart';
import 'package:libcheck/presentation/providers/registered_library_providers.dart';
import 'package:libcheck/presentation/providers/search_history_providers.dart';
import 'package:libcheck/presentation/utils/error_message_resolver.dart';
import 'package:libcheck/presentation/widgets/library_availability_card.dart';

class BookSearchResultPage extends ConsumerWidget {
  const BookSearchResultPage({super.key, required this.isbn});

  final String isbn;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final registeredLibraries = ref.watch(registeredLibrariesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('検索結果'),
      ),
      body: registeredLibraries.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => _buildErrorState(context, ref, error),
        data: (libraries) {
          if (libraries.isEmpty) {
            return _buildNoLibraryState(context);
          }
          return _buildSearchResults(context, ref, libraries);
        },
      ),
    );
  }

  Widget _buildSearchResults(
    BuildContext context,
    WidgetRef ref,
    List<Library> libraries,
  ) {
    final availability = ref.watch(bookAvailabilityProvider(isbn));

    ref.listen(bookAvailabilityProvider(isbn), (previous, next) {
      if (next is AsyncData<List<BookAvailability>> && next.value.isNotEmpty) {
        _saveSearchHistory(ref, next.value);
      }
    });

    return availability.when(
      loading: () => _buildLoadingState(context),
      error: (error, _) => _buildErrorState(context, ref, error),
      data: (results) => _buildResultState(context, libraries, results),
    );
  }

  void _saveSearchHistory(WidgetRef ref, List<BookAvailability> results) {
    final result = results[0];
    final statuses = <String, String>{};
    for (final entry in result.libraryStatuses.entries) {
      statuses[entry.key] = entry.value.status.name;
    }
    final historyEntry = SearchHistoryEntry(
      isbn: isbn,
      searchedAt: DateTime.now(),
      libraryStatuses: statuses,
    );
    ref.read(searchHistoryProvider.notifier).save(historyEntry);
  }

  Widget _buildLoadingState(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildIsbnSection(context),
          const SizedBox(height: 24),
          const Center(child: CircularProgressIndicator()),
          const SizedBox(height: 16),
          const Center(child: Text('蔵書を検索中...')),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, WidgetRef ref, Object error) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildIsbnSection(context),
          const SizedBox(height: 24),
          Center(
            child: Column(
              children: [
                const Icon(Icons.error_outline, size: 48, color: Color(0xFFD32F2F)),
                const SizedBox(height: 16),
                Text(ErrorMessageResolver.resolve(error)),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () {
                    ref.invalidate(bookAvailabilityProvider(isbn));
                  },
                  child: const Text('再試行'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildScanAnotherButton(context),
        ],
      ),
    );
  }

  Widget _buildResultState(
    BuildContext context,
    List<Library> libraries,
    List<BookAvailability> results,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildIsbnSection(context),
          const SizedBox(height: 24),
          Text(
            '蔵書状況',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          if (results.isNotEmpty)
            ...libraries.map((library) {
              final status =
                  results[0].libraryStatuses[library.systemId];
              if (status == null) return const SizedBox.shrink();
              return LibraryAvailabilityCard(
                library: library,
                status: status,
              );
            })
          else
            const Center(child: Text('検索結果がありません')),
          const SizedBox(height: 24),
          _buildScanAnotherButton(context),
        ],
      ),
    );
  }

  Widget _buildNoLibraryState(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildIsbnSection(context),
          const SizedBox(height: 24),
          Center(
            child: Column(
              children: [
                const Icon(Icons.local_library, size: 48, color: Color(0xFF9E9E9E)),
                const SizedBox(height: 16),
                const Text('図書館が登録されていません'),
                const SizedBox(height: 8),
                const Text('図書館を登録すると蔵書を検索できます'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildScanAnotherButton(context),
        ],
      ),
    );
  }

  Widget _buildIsbnSection(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.book, size: 24),
            const SizedBox(width: 12),
            Text(
              'ISBN: $isbn',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScanAnotherButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () {
          Navigator.of(context).pop();
        },
        icon: const Icon(Icons.camera_alt),
        label: const Text('別の本をスキャンする'),
      ),
    );
  }
}
