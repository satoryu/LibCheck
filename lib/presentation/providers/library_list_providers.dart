import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';

class LibraryListParam {
  const LibraryListParam({required this.pref, required this.city});

  final String pref;
  final String city;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LibraryListParam &&
          runtimeType == other.runtimeType &&
          pref == other.pref &&
          city == other.city;

  @override
  int get hashCode => Object.hash(pref, city);
}

final libraryListProvider =
    FutureProvider.family<List<Library>, LibraryListParam>((ref, param) async {
  final repository = ref.watch(libraryRepositoryProvider);
  return repository.getLibraries(pref: param.pref, city: param.city);
});

class SelectedLibrariesNotifier extends Notifier<Set<Library>> {
  @override
  Set<Library> build() => {};

  void toggle(Library library) {
    if (state.contains(library)) {
      state = {...state}..remove(library);
    } else {
      state = {...state, library};
    }
  }

  void clear() {
    state = {};
  }
}

final selectedLibrariesProvider =
    NotifierProvider<SelectedLibrariesNotifier, Set<Library>>(
  SelectedLibrariesNotifier.new,
);
