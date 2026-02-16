class CheckResponse {
  const CheckResponse({
    required this.session,
    required this.continueFlag,
    required this.books,
  });

  final String session;
  final int continueFlag;
  final Map<String, Map<String, BookSystemStatus>> books;

  factory CheckResponse.fromJson(Map<String, dynamic> json) {
    final session = json['session'] as String? ?? '';
    final continueFlag = json['continue'] as int? ?? 0;
    final booksJson = json['books'] as Map<String, dynamic>? ?? {};

    final books = <String, Map<String, BookSystemStatus>>{};
    for (final isbnEntry in booksJson.entries) {
      final isbn = isbnEntry.key;
      final systemsJson = isbnEntry.value as Map<String, dynamic>? ?? {};
      final systems = <String, BookSystemStatus>{};
      for (final systemEntry in systemsJson.entries) {
        final systemId = systemEntry.key;
        final statusJson = systemEntry.value as Map<String, dynamic>? ?? {};
        systems[systemId] = BookSystemStatus.fromJson(statusJson);
      }
      books[isbn] = systems;
    }

    return CheckResponse(
      session: session,
      continueFlag: continueFlag,
      books: books,
    );
  }
}

class BookSystemStatus {
  const BookSystemStatus({
    required this.status,
    this.reserveUrl,
    required this.libKeys,
  });

  final String status;
  final String? reserveUrl;
  final Map<String, String> libKeys;

  factory BookSystemStatus.fromJson(Map<String, dynamic> json) {
    final status = json['status'] as String? ?? '';
    final rawReserveUrl = json['reserveurl'] as String?;
    final reserveUrl = (rawReserveUrl != null && rawReserveUrl.isNotEmpty) ? rawReserveUrl : null;
    final libKeysJson = json['libkey'] as Map<String, dynamic>? ?? {};
    final libKeys = libKeysJson
        .map((key, value) => MapEntry(key, value as String? ?? ''));

    return BookSystemStatus(
      status: status,
      reserveUrl: reserveUrl,
      libKeys: libKeys,
    );
  }
}
