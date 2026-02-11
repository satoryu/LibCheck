import 'package:libcheck/domain/models/library_status.dart';

class BookAvailability {
  const BookAvailability({
    required this.isbn,
    required this.libraryStatuses,
  });

  final String isbn;
  final Map<String, LibraryStatus> libraryStatuses;
}
