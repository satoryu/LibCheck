import 'package:libcheck/domain/models/search_history_entry.dart';

abstract class SearchHistoryRepository {
  Future<List<SearchHistoryEntry>> getAll();
  Future<void> save(SearchHistoryEntry entry);
  Future<void> remove(String isbn);
  Future<void> removeAll();
}
