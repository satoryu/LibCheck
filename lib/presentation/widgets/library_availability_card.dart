import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/models/library_status.dart';
import 'package:libcheck/presentation/widgets/availability_status_badge.dart';

class LibraryAvailabilityCard extends StatelessWidget {
  const LibraryAvailabilityCard({
    super.key,
    required this.library,
    required this.status,
  });

  final Library library;
  final LibraryStatus status;

  @override
  Widget build(BuildContext context) {
    final reserveUri = _safeReserveUri;
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.local_library, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    library.formalName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${library.pref}${library.city}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 12),
            AvailabilityStatusBadge(status: status.statusForLibKey(library.libKey)),
            if (reserveUri != null && status.statusForLibKey(library.libKey).isReservable) ...[
              const SizedBox(height: 8),
              TextButton(
                onPressed: () {
                  launchUrl(reserveUri, mode: LaunchMode.externalApplication);
                },
                child: const Text('予約する'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  /// Parses [status.reserveUrl] and returns a [Uri] only if the scheme is
  /// http or https. Returns null for empty, null, or unsafe URLs.
  Uri? get _safeReserveUri {
    final raw = status.reserveUrl;
    if (raw == null || raw.isEmpty) return null;
    final uri = Uri.tryParse(raw);
    if (uri == null) return null;
    if (uri.scheme != 'http' && uri.scheme != 'https') return null;
    return uri;
  }
}
