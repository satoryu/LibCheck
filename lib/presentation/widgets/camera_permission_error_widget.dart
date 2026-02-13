import 'package:flutter/material.dart';

class CameraPermissionErrorWidget extends StatelessWidget {
  const CameraPermissionErrorWidget({
    super.key,
    required this.onOpenSettings,
    required this.onManualInput,
  });

  final VoidCallback onOpenSettings;
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
              Icons.camera_alt_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 24),
            Text(
              'カメラへのアクセスが許可されていません',
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'バーコードをスキャンするには、設定からカメラへのアクセスを許可してください。',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: onOpenSettings,
                icon: const Icon(Icons.settings),
                label: const Text('設定を開く'),
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
