import 'package:libcheck/domain/models/availability_status.dart';

class LibraryStatus {
  const LibraryStatus({
    required this.systemId,
    required this.status,
    this.reserveUrl,
    required this.libKeyStatuses,
  });

  final String systemId;
  final AvailabilityStatus status;
  final String? reserveUrl;
  final Map<String, String> libKeyStatuses;
}
