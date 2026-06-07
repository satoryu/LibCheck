import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import KeyboardIcon from '@mui/icons-material/Keyboard';

import { isbnValidator } from '@/domain/utils/isbnValidator';
import { CameraErrorWidget } from '@/presentation/widgets/CameraErrorWidget';
import { CameraPermissionErrorWidget } from '@/presentation/widgets/CameraPermissionErrorWidget';
import { ScanOverlayWidget } from '@/presentation/widgets/ScanOverlayWidget';

type CameraErrorType = 'permission' | 'error';

/**
 * バーコードスキャン画面。
 *
 * `lib/presentation/pages/barcode_scanner_page.dart` の移植。
 * `mobile_scanner` の代わりに `@zxing/browser` を使用する。
 * カメラ起動に失敗した場合はエラー種別に応じたウィジェットを表示する。
 */
export function BarcodeScannerPage(): JSX.Element {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const isProcessingRef = useRef(false);

  const [errorType, setErrorType] = useState<CameraErrorType | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const goManualInput = (): void => {
    navigate('/isbn-input', { replace: true });
  };

  const stopCamera = (): void => {
    if (controlsRef.current !== null) {
      try {
        controlsRef.current.stop();
      } catch {
        // ignore stop errors
      }
      controlsRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    isProcessingRef.current = false;

    const handleDecoded = (rawValue: string): void => {
      if (isProcessingRef.current) return;
      const normalized = isbnValidator.normalizeIsbn(rawValue);
      if (isbnValidator.isValidIsbn13(normalized)) {
        isProcessingRef.current = true;
        navigator.vibrate?.(50);
        stopCamera();
        navigate(`/result/${normalized}?source=scan`);
      }
    };

    const startCamera = async (): Promise<void> => {
      const mediaDevices = navigator.mediaDevices;
      // jsdom などで mediaDevices が存在しない場合はエラー表示にフォールバックする。
      if (
        mediaDevices === undefined ||
        typeof mediaDevices.getUserMedia !== 'function'
      ) {
        if (!cancelled) setErrorType('error');
        return;
      }
      try {
        const video = videoRef.current;
        if (video === null) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result) => {
            if (result) {
              handleDecoded(result.getText());
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (e) {
        if (cancelled) return;
        const name = (e as { name?: string }).name;
        if (name === 'NotAllowedError') {
          setErrorType('permission');
        } else {
          setErrorType('error');
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retryCamera = (): void => {
    setErrorType(null);
    setIsFlashOn(false);
    setAttempt((a) => a + 1);
  };

  const toggleFlash = async (): Promise<void> => {
    const next = !isFlashOn;
    try {
      await controlsRef.current?.switchTorch?.(next);
      setIsFlashOn(next);
    } catch {
      // best-effort: torch may be unsupported
    }
  };

  if (errorType === 'permission') {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div">
              バーコードスキャン
            </Typography>
          </Toolbar>
        </AppBar>
        <CameraPermissionErrorWidget
          onOpenSettings={() => {
            // Web ではアプリ設定を直接開けないため no-op。
          }}
          onManualInput={goManualInput}
        />
      </Box>
    );
  }

  if (errorType === 'error') {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div">
              バーコードスキャン
            </Typography>
          </Toolbar>
        </AppBar>
        <CameraErrorWidget
          onRetry={retryCamera}
          onManualInput={goManualInput}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            バーコードスキャン
          </Typography>
          <IconButton
            color="inherit"
            aria-label="flash"
            onClick={() => {
              void toggleFlash();
            }}
          >
            {isFlashOn ? <FlashOnIcon /> : <FlashOffIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ position: 'relative', flex: 1, backgroundColor: '#000' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <ScanOverlayWidget />
      </Box>
      <Box sx={{ p: 2 }}>
        <Button
          variant="outlined"
          startIcon={<KeyboardIcon />}
          onClick={goManualInput}
          sx={{ width: '100%' }}
        >
          ISBNを手動入力する
        </Button>
      </Box>
    </Box>
  );
}
