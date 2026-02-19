import 'package:flutter/material.dart';

import 'package:libcheck/domain/models/availability_status.dart';
import 'package:libcheck/presentation/theme/app_colors.dart';

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
          AppColors.success,
          Icons.check_circle,
        ),
      AvailabilityStatus.inLibraryOnly => (
          '館内のみ',
          AppColors.success,
          Icons.check_circle,
        ),
      AvailabilityStatus.checkedOut => (
          '貸出中',
          AppColors.warning,
          Icons.schedule,
        ),
      AvailabilityStatus.reserved => (
          '予約中',
          AppColors.warning,
          Icons.schedule,
        ),
      AvailabilityStatus.preparing => (
          '準備中',
          AppColors.warning,
          Icons.schedule,
        ),
      AvailabilityStatus.closed => (
          '休館中',
          AppColors.inactive,
          Icons.block,
        ),
      AvailabilityStatus.notFound => (
          '蔵書なし',
          AppColors.inactive,
          Icons.remove_circle_outline,
        ),
      AvailabilityStatus.error => (
          'エラー',
          AppColors.error,
          Icons.error_outline,
        ),
      AvailabilityStatus.unknown => (
          '不明',
          AppColors.inactive,
          Icons.help_outline,
        ),
    };
  }
}
