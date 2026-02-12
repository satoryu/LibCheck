import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';
import 'package:libcheck/presentation/providers/registered_library_providers.dart';

final bookAvailabilityProvider =
    FutureProvider.family<List<BookAvailability>, String>(
  (ref, isbn) async {
    final libraries = await ref.watch(registeredLibrariesProvider.future);
    final systemIds = libraries.map((l) => l.systemId).toSet().toList();

    if (systemIds.isEmpty) return [];

    final repository = ref.watch(libraryRepositoryProvider);
    return repository.checkBookAvailability(
      isbn: [isbn],
      systemIds: systemIds,
    );
  },
);
