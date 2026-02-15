import 'package:flutter/material.dart';

class CameraErrorWidget extends StatelessWidget {
  const CameraErrorWidget({
    super.key,
    required this.onRetry,
    required this.onManualInput,
  });

  final VoidCallback onRetry;
  final VoidCallback onManualInput;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.videocam_off_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 24),
            Text(
              'カメラの起動に失敗しました',
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'しばらくしてからもう一度お試しください。',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('再試行'),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onManualInput,
                icon: const Icon(Icons.keyboard),
                label: const Text('ISBNを手動入力する'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
