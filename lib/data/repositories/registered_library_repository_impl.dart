import 'dart:convert';

import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/repositories/local_storage_repository.dart';
import 'package:libcheck/domain/repositories/registered_library_repository.dart';

class RegisteredLibraryRepositoryImpl implements RegisteredLibraryRepository {
  static const _storageKey = 'registered_libraries';

  final LocalStorageRepository _localStorage;

  RegisteredLibraryRepositoryImpl(this._localStorage);

  @override
  Future<List<Library>> getAll() async {
    final jsonString = await _localStorage.getString(_storageKey);
    if (jsonString == null) return [];

    try {
      final jsonList = jsonDecode(jsonString) as List<dynamic>;
      return jsonList
          .map((e) => Library.fromJson(e as Map<String, dynamic>))
          .toList();
    } on FormatException {
      return [];
    } on TypeError {
      return [];
    }
  }

  @override
  Future<void> saveAll(List<Library> libraries) async {
    final jsonList = libraries.map((e) => e.toJson()).toList();
    await _localStorage.setString(_storageKey, jsonEncode(jsonList));
  }

  @override
  Future<List<Library>> add(Library library) async {
    final current = await getAll();
    if (current.contains(library)) return current;
    current.add(library);
    await saveAll(current);
    return current;
  }

  @override
  Future<List<Library>> addAll(List<Library> libraries) async {
    final current = await getAll();
    for (final library in libraries) {
      if (!current.contains(library)) {
        current.add(library);
      }
    }
    await saveAll(current);
    return current;
  }

  @override
  Future<List<Library>> remove(Library library) async {
    final current = await getAll();
    current.removeWhere((e) => e == library);
    await saveAll(current);
    return current;
  }
}
