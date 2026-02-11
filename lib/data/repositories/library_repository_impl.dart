import 'package:libcheck/data/datasources/calil_api_client.dart';
import 'package:libcheck/domain/models/availability_status.dart';
import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/models/library_status.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';

class LibraryRepositoryImpl implements LibraryRepository {
  LibraryRepositoryImpl({required CalilApiClient apiClient})
      : _apiClient = apiClient;

  final CalilApiClient _apiClient;

  @override
  Future<List<Library>> getLibraries({
    required String pref,
    String? city,
  }) async {
    final responses = await _apiClient.searchLibraries(pref: pref, city: city);

    return responses
        .map((r) => Library(
              systemId: r.systemId,
              systemName: r.systemName,
              libKey: r.libKey,
              libId: r.libId,
              shortName: r.shortName,
              formalName: r.formalName,
              address: r.address,
              pref: r.pref,
              city: r.city,
              category: r.category,
              url: r.urlPc,
              tel: r.tel,
              geocode: r.geocode,
            ))
        .toList();
  }

  @override
  Future<List<BookAvailability>> checkBookAvailability({
    required List<String> isbn,
    required List<String> systemIds,
  }) async {
    final response = await _apiClient.checkAvailability(
      isbn: isbn,
      systemIds: systemIds,
    );

    return response.books.entries.map((isbnEntry) {
      final isbnValue = isbnEntry.key;
      final systems = isbnEntry.value;

      final libraryStatuses = <String, LibraryStatus>{};
      for (final systemEntry in systems.entries) {
        final systemId = systemEntry.key;
        final bookSystemStatus = systemEntry.value;

        final libKeyStatuses = bookSystemStatus.libKeys;
        final statuses = libKeyStatuses.values
            .map(AvailabilityStatus.fromApiString)
            .toList();
        final aggregatedStatus = AvailabilityStatus.aggregate(statuses);

        libraryStatuses[systemId] = LibraryStatus(
          systemId: systemId,
          status: aggregatedStatus,
          reserveUrl: bookSystemStatus.reserveUrl,
          libKeyStatuses: libKeyStatuses,
        );
      }

      return BookAvailability(
        isbn: isbnValue,
        libraryStatuses: libraryStatuses,
      );
    }).toList();
  }
}
