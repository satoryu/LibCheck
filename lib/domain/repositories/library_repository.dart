import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library.dart';

abstract class LibraryRepository {
  Future<List<Library>> getLibraries({
    required String pref,
    String? city,
  });

  Future<List<BookAvailability>> checkBookAvailability({
    required List<String> isbn,
    required List<String> systemIds,
  });
}
