import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'package:libcheck/domain/utils/isbn_validator.dart';
import 'package:libcheck/presentation/widgets/camera_error_widget.dart';
import 'package:libcheck/presentation/widgets/camera_permission_error_widget.dart';
import 'package:libcheck/presentation/widgets/scan_overlay_widget.dart';

class BarcodeScannerPage extends StatefulWidget {
  const BarcodeScannerPage({super.key});

  @override
  State<BarcodeScannerPage> createState() => _BarcodeScannerPageState();
}

class _BarcodeScannerPageState extends State<BarcodeScannerPage> {
  late final MobileScannerController _controller;
  bool _isFlashOn = false;
  bool _isProcessing = false;
  MobileScannerErrorCode? _errorCode;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController();
    _startCamera();
  }

  Future<void> _startCamera() async {
    try {
      await _controller.start();
    } on MobileScannerException catch (e) {
      if (mounted) {
        setState(() {
          _errorCode = e.errorCode;
        });
      }
    }
  }

  void _retryCamera() {
    setState(() {
      _errorCode = null;
    });
    _startCamera();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onBarcodeDetected(BarcodeCapture capture) {
    if (_isProcessing) return;

    for (final barcode in capture.barcodes) {
      final value = barcode.rawValue;
      if (value == null) continue;

      final normalized = IsbnValidator.normalizeIsbn(value);
      if (IsbnValidator.isValidIsbn13(normalized)) {
        _isProcessing = true;
        HapticFeedback.mediumImpact();
        _controller.stop();
        _navigateToResult(normalized);
        return;
      }
    }
  }

  void _navigateToResult(String isbn) {
    context.push('/result/$isbn').then((_) {
      if (mounted) {
        _isProcessing = false;
        _startCamera();
      }
    });
  }

  Future<void> _toggleFlash() async {
    await _controller.toggleTorch();
    setState(() {
      _isFlashOn = !_isFlashOn;
    });
  }

  Widget _buildErrorBody() {
    if (_errorCode == MobileScannerErrorCode.permissionDenied) {
      return CameraPermissionErrorWidget(
        onOpenSettings: () {
          const MethodChannel('flutter.baseflow.com/permissions/methods')
              .invokeMethod<void>('openAppSettings');
        },
        onManualInput: () {
          context.go('/isbn-input');
        },
      );
    }
    return CameraErrorWidget(
      onRetry: _retryCamera,
      onManualInput: () {
        context.go('/isbn-input');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('バーコードスキャン'),
        actions: [
          if (_errorCode == null)
            IconButton(
              icon: Icon(_isFlashOn ? Icons.flash_on : Icons.flash_off),
              onPressed: _toggleFlash,
            ),
        ],
      ),
      body: _errorCode != null
          ? _buildErrorBody()
          : Column(
              children: [
                Expanded(
                  child: Stack(
                    children: [
                      MobileScanner(
                        controller: _controller,
                        onDetect: _onBarcodeDetected,
                        errorBuilder: (context, error, child) {
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            if (mounted && _errorCode == null) {
                              setState(() {
                                _errorCode = error.errorCode;
                              });
                            }
                          });
                          return const SizedBox.shrink();
                        },
                      ),
                      const ScanOverlayWidget(),
                    ],
                  ),
                ),
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          context.go('/isbn-input');
                        },
                        icon: const Icon(Icons.keyboard),
                        label: const Text('ISBNを手動入力する'),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
