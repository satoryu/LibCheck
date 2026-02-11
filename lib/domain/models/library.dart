class Library {
  const Library({
    required this.systemId,
    required this.systemName,
    required this.libKey,
    required this.libId,
    required this.shortName,
    required this.formalName,
    required this.address,
    required this.pref,
    required this.city,
    required this.category,
    this.url,
    this.tel,
    this.geocode,
  });

  final String systemId;
  final String systemName;
  final String libKey;
  final String libId;
  final String shortName;
  final String formalName;
  final String address;
  final String pref;
  final String city;
  final String category;
  final String? url;
  final String? tel;
  final String? geocode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Library &&
          runtimeType == other.runtimeType &&
          systemId == other.systemId &&
          libKey == other.libKey &&
          libId == other.libId;

  @override
  int get hashCode => Object.hash(systemId, libKey, libId);
}
