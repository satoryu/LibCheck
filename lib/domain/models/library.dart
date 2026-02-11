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

  factory Library.fromJson(Map<String, dynamic> json) {
    return Library(
      systemId: json['systemId'] as String,
      systemName: json['systemName'] as String,
      libKey: json['libKey'] as String,
      libId: json['libId'] as String,
      shortName: json['shortName'] as String,
      formalName: json['formalName'] as String,
      address: json['address'] as String,
      pref: json['pref'] as String,
      city: json['city'] as String,
      category: json['category'] as String,
      url: json['url'] as String?,
      tel: json['tel'] as String?,
      geocode: json['geocode'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'systemId': systemId,
      'systemName': systemName,
      'libKey': libKey,
      'libId': libId,
      'shortName': shortName,
      'formalName': formalName,
      'address': address,
      'pref': pref,
      'city': city,
      'category': category,
      'url': url,
      'tel': tel,
      'geocode': geocode,
    };
  }

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
