import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import KeyboardIcon from '@mui/icons-material/Keyboard';

import { interpretScannedBarcode } from '@/presentation/utils/scanInterpreter';
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
  // ISBN以外のバーコード（価格コード等）を読んだ際の通知をスロットルするための時刻。
  const lastNonIsbnNoticeRef = useRef(0);

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
      // eslint-disable-next-line no-console
      console.debug('[scan] decoded:', rawValue);
      const interpretation = interpretScannedBarcode(rawValue);
      if (interpretation.kind === 'isbn') {
        isProcessingRef.current = true;
        navigator.vibrate?.(50);
        stopCamera();
        navigate(`/result/${interpretation.isbn}?source=scan`);
        return;
      }
      // ISBN以外（日本の書籍下段の価格・分類コード `192…` 等）を読み取った場合。
      // 読み取りは継続したまま、上段のISBNバーコードを映すよう促す。
      // 同じコードを毎フレーム読むため、通知は一定間隔に絞る。
      const now = Date.now();
      if (now - lastNonIsbnNoticeRef.current > 3000) {
        lastNonIsbnNoticeRef.current = now;
        enqueueSnackbar('ISBNのバーコード（978で始まる上段）を映してください', {
          variant: 'info',
        });
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
        // 書籍のISBNバーコードはEAN-13。対象フォーマットをEAN-13に絞ることで
        // フレーム毎のデコード負荷を下げて認識を速め、TRY_HARDERで斜めや
        // 低解像度のカメラ映像でも読み取りやすくする。
        const hints = new Map<DecodeHintType, unknown>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints);
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
