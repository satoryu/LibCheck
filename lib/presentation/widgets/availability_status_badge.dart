import 'package:flutter/material.dart';

import 'package:libcheck/domain/models/availability_status.dart';

class AvailabilityStatusBadge extends StatelessWidget {
  const AvailabilityStatusBadge({super.key, required this.status});

  final AvailabilityStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, color, icon) = _statusInfo(status);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  static (String, Color, IconData) _statusInfo(AvailabilityStatus status) {
    return switch (status) {
      AvailabilityStatus.available => (
          '貸出可能',
          const Color(0xFF2E7D32),
          Icons.check_circle,
        ),
      AvailabilityStatus.inLibraryOnly => (
          '館内のみ',
          const Color(0xFF2E7D32),
          Icons.check_circle,
        ),
      AvailabilityStatus.checkedOut => (
          '貸出中',
          const Color(0xFFEF6C00),
          Icons.schedule,
        ),
      AvailabilityStatus.reserved => (
          '予約中',
          const Color(0xFFEF6C00),
          Icons.schedule,
        ),
      AvailabilityStatus.preparing => (
          '準備中',
          const Color(0xFFEF6C00),
          Icons.schedule,
        ),
      AvailabilityStatus.closed => (
          '休館中',
          const Color(0xFF9E9E9E),
          Icons.block,
        ),
      AvailabilityStatus.notFound => (
          '蔵書なし',
          const Color(0xFF9E9E9E),
          Icons.remove_circle_outline,
        ),
      AvailabilityStatus.error => (
          'エラー',
          const Color(0xFFD32F2F),
          Icons.error_outline,
        ),
      AvailabilityStatus.unknown => (
          '不明',
          const Color(0xFF9E9E9E),
          Icons.help_outline,
        ),
    };
  }
}
