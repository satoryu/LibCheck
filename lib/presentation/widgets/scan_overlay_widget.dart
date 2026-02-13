import 'package:flutter/material.dart';

class ScanOverlayWidget extends StatelessWidget {
  const ScanOverlayWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // 半透明オーバーレイ + スキャンガイド枠
        CustomPaint(
          size: Size.infinite,
          painter: _ScanOverlayPainter(),
        ),
        // ヘルプテキスト
        Positioned(
          bottom: 80,
          left: 0,
          right: 0,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'バーコードをガイド枠に合わせてください',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ScanOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final overlayPaint = Paint()..color = Colors.black.withValues(alpha: 0.5);

    // スキャンガイド枠のサイズと位置
    final scanWidth = size.width * 0.75;
    final scanHeight = scanWidth * 0.4;
    final left = (size.width - scanWidth) / 2;
    final top = (size.height - scanHeight) / 2 - 40;

    final scanRect = Rect.fromLTWH(left, top, scanWidth, scanHeight);

    // 半透明オーバーレイ（スキャン枠の外側）
    canvas.drawPath(
      Path.combine(
        PathOperation.difference,
        Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height)),
        Path()
          ..addRRect(
              RRect.fromRectAndRadius(scanRect, const Radius.circular(12))),
      ),
      overlayPaint,
    );

    // ガイド枠の角
    final cornerPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final cornerLength = 24.0;
    final radius = 12.0;

    // 左上
    canvas.drawPath(
      Path()
        ..moveTo(left, top + cornerLength)
        ..lineTo(left, top + radius)
        ..arcToPoint(Offset(left + radius, top),
            radius: Radius.circular(radius))
        ..lineTo(left + cornerLength, top),
      cornerPaint,
    );

    // 右上
    canvas.drawPath(
      Path()
        ..moveTo(left + scanWidth - cornerLength, top)
        ..lineTo(left + scanWidth - radius, top)
        ..arcToPoint(Offset(left + scanWidth, top + radius),
            radius: Radius.circular(radius))
        ..lineTo(left + scanWidth, top + cornerLength),
      cornerPaint,
    );

    // 左下
    canvas.drawPath(
      Path()
        ..moveTo(left, top + scanHeight - cornerLength)
        ..lineTo(left, top + scanHeight - radius)
        ..arcToPoint(Offset(left + radius, top + scanHeight),
            radius: Radius.circular(radius))
        ..lineTo(left + cornerLength, top + scanHeight),
      cornerPaint,
    );

    // 右下
    canvas.drawPath(
      Path()
        ..moveTo(left + scanWidth - cornerLength, top + scanHeight)
        ..lineTo(left + scanWidth - radius, top + scanHeight)
        ..arcToPoint(Offset(left + scanWidth, top + scanHeight - radius),
            radius: Radius.circular(radius))
        ..lineTo(left + scanWidth, top + scanHeight - cornerLength),
      cornerPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
