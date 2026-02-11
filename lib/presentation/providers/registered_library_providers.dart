import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:libcheck/data/providers/local_storage_providers.dart';
import 'package:libcheck/data/repositories/registered_library_repository_impl.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/repositories/registered_library_repository.dart';

final registeredLibraryRepositoryProvider =
    Provider<RegisteredLibraryRepository>((ref) {
  final localStorage = ref.watch(localStorageRepositoryProvider);
  return RegisteredLibraryRepositoryImpl(localStorage);
});

class RegisteredLibrariesNotifier extends AsyncNotifier<List<Library>> {
  @override
  FutureOr<List<Library>> build() async {
    final repository = ref.watch(registeredLibraryRepositoryProvider);
    return repository.getAll();
  }

  Future<void> add(Library library) async {
    final repository = ref.read(registeredLibraryRepositoryProvider);
    final updated = await repository.add(library);
    state = AsyncValue.data(updated);
  }

  Future<void> addAll(List<Library> libraries) async {
    final repository = ref.read(registeredLibraryRepositoryProvider);
    final updated = await repository.addAll(libraries);
    state = AsyncValue.data(updated);
  }

  Future<void> remove(Library library) async {
    final repository = ref.read(registeredLibraryRepositoryProvider);
    final updated = await repository.remove(library);
    state = AsyncValue.data(updated);
  }
}

final registeredLibrariesProvider =
    AsyncNotifierProvider<RegisteredLibrariesNotifier, List<Library>>(
  RegisteredLibrariesNotifier.new,
);
