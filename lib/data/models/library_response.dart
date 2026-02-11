class LibraryResponse {
  const LibraryResponse({
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
    this.urlPc,
    this.post,
    this.tel,
    this.geocode,
  });

  final String systemId;
  final String systemName;
  final String libKey;
  final String libId;
  final String shortName;
  final String formalName;
  final String? urlPc;
  final String address;
  final String pref;
  final String city;
  final String? post;
  final String? tel;
  final String? geocode;
  final String category;

  factory LibraryResponse.fromJson(Map<String, dynamic> json) {
    return LibraryResponse(
      systemId: json['systemid'] as String? ?? '',
      systemName: json['systemname'] as String? ?? '',
      libKey: json['libkey'] as String? ?? '',
      libId: json['libid'] as String? ?? '',
      shortName: json['short'] as String? ?? '',
      formalName: json['formal'] as String? ?? '',
      urlPc: json['url_pc'] as String?,
      address: json['address'] as String? ?? '',
      pref: json['pref'] as String? ?? '',
      city: json['city'] as String? ?? '',
      post: json['post'] as String?,
      tel: json['tel'] as String?,
      geocode: json['geocode'] as String?,
      category: json['category'] as String? ?? '',
    );
  }
}
