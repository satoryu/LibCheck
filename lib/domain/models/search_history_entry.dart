class SearchHistoryEntry {
  const SearchHistoryEntry({
    required this.isbn,
    required this.searchedAt,
    required this.libraryStatuses,
  });

  final String isbn;
  final DateTime searchedAt;
  final Map<String, String> libraryStatuses;

  factory SearchHistoryEntry.fromJson(Map<String, dynamic> json) {
    return SearchHistoryEntry(
      isbn: json['isbn'] as String,
      searchedAt: DateTime.parse(json['searchedAt'] as String),
      libraryStatuses:
          Map<String, String>.from(json['libraryStatuses'] as Map),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isbn': isbn,
      'searchedAt': searchedAt.toIso8601String(),
      'libraryStatuses': libraryStatuses,
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SearchHistoryEntry &&
          runtimeType == other.runtimeType &&
          isbn == other.isbn;

  @override
  int get hashCode => isbn.hashCode;
}
