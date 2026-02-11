import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:libcheck/presentation/providers/library_providers.dart';

final cityListProvider =
    FutureProvider.family<List<String>, String>((ref, pref) async {
  final repository = ref.watch(libraryRepositoryProvider);
  final libraries = await repository.getLibraries(pref: pref);
  final cities = libraries.map((lib) => lib.city).toSet().toList()..sort();
  return cities;
});
