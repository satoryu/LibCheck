/// 検索履歴の1エントリ。
///
/// [libraryStatuses] は `{systemId: enumName}` の形式で保存される。
/// Value は [AvailabilityStatus] の Dart enum 名（"available", "checkedOut" 等）。
/// 復元時は `AvailabilityStatus.values.byName(value)` で型安全に変換する。
class SearchHistoryEntry {
  const SearchHistoryEntry({
    required this.isbn,
    required this.searchedAt,
    required this.libraryStatuses,
  });

  final String isbn;
  final DateTime searchedAt;

  /// 図書館システムIDごとの蔵書状態。
  /// Value は [AvailabilityStatus] の enum 名文字列。
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
