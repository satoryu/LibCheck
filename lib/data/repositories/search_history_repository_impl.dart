import 'dart:convert';

import 'package:libcheck/domain/models/search_history_entry.dart';
import 'package:libcheck/domain/repositories/local_storage_repository.dart';
import 'package:libcheck/domain/repositories/search_history_repository.dart';

class SearchHistoryRepositoryImpl implements SearchHistoryRepository {
  static const _storageKey = 'search_history';
  static const _maxEntries = 100;

  final LocalStorageRepository _localStorage;

  SearchHistoryRepositoryImpl(this._localStorage);

  @override
  Future<List<SearchHistoryEntry>> getAll() async {
    final jsonString = await _localStorage.getString(_storageKey);
    if (jsonString == null) return [];

    try {
      final jsonList = jsonDecode(jsonString) as List<dynamic>;
      final entries = jsonList
          .map((e) => SearchHistoryEntry.fromJson(e as Map<String, dynamic>))
          .toList();
      entries.sort((a, b) => b.searchedAt.compareTo(a.searchedAt));
      return entries;
    } on FormatException {
      return [];
    } on TypeError {
      return [];
    }
  }

  @override
  Future<void> save(SearchHistoryEntry entry) async {
    final entries = await _getAllRaw();

    entries.removeWhere((e) => e.isbn == entry.isbn);
    entries.add(entry);

    entries.sort((a, b) => b.searchedAt.compareTo(a.searchedAt));

    final trimmed =
        entries.length > _maxEntries ? entries.sublist(0, _maxEntries) : entries;

    await _saveAll(trimmed);
  }

  @override
  Future<void> remove(String isbn) async {
    final entries = await _getAllRaw();
    entries.removeWhere((e) => e.isbn == isbn);
    await _saveAll(entries);
  }

  @override
  Future<void> removeAll() async {
    await _localStorage.remove(_storageKey);
  }

  Future<List<SearchHistoryEntry>> _getAllRaw() async {
    final jsonString = await _localStorage.getString(_storageKey);
    if (jsonString == null) return [];

    try {
      final jsonList = jsonDecode(jsonString) as List<dynamic>;
      return jsonList
          .map((e) => SearchHistoryEntry.fromJson(e as Map<String, dynamic>))
          .toList();
    } on FormatException {
      return [];
    } on TypeError {
      return [];
    }
  }

  Future<void> _saveAll(List<SearchHistoryEntry> entries) async {
    final jsonList = entries.map((e) => e.toJson()).toList();
    await _localStorage.setString(_storageKey, jsonEncode(jsonList));
  }
}
