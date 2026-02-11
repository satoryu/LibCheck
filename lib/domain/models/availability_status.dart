enum AvailabilityStatus {
  available,
  inLibraryOnly,
  checkedOut,
  reserved,
  preparing,
  closed,
  notFound,
  error,
  unknown;

  int get priority => switch (this) {
        available => 8,
        inLibraryOnly => 7,
        checkedOut => 6,
        reserved => 5,
        preparing => 4,
        closed => 3,
        notFound => 2,
        error => 1,
        unknown => 0,
      };

  static AvailabilityStatus fromApiString(String value) => switch (value) {
        '貸出可' || '蔵書あり' => available,
        '館内のみ' => inLibraryOnly,
        '貸出中' => checkedOut,
        '予約中' => reserved,
        '準備中' => preparing,
        '休館中' => closed,
        '蔵書なし' || '' => notFound,
        _ => unknown,
      };

  static AvailabilityStatus aggregate(List<AvailabilityStatus> statuses) {
    if (statuses.isEmpty) return notFound;
    return statuses.reduce(
        (best, current) => current.priority > best.priority ? current : best);
  }
}
