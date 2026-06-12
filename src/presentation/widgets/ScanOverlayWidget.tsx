import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * バーコードスキャン用のオーバーレイ。
 *
 * 半透明のオーバーレイ、中央のガイド枠（角を強調）、ヘルプテキストを表示する。
 * `lib/presentation/widgets/scan_overlay_widget.dart` の CustomPaint を
 * CSS で近似したもの。
 */
export function ScanOverlayWidget(): JSX.Element {
  const cornerColor = '#FFFFFF';
  const cornerLength = 24;
  const cornerThickness = 3;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* 半透明オーバーレイ + 中央のくり抜き（box-shadow でくり抜きを表現） */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '75%',
          aspectRatio: '2.5 / 1',
          transform: 'translate(-50%, calc(-50% - 40px))',
          borderRadius: '12px',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* ガイド枠の角 */}
        {/* 左上 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: cornerLength,
            height: cornerLength,
            borderTop: `${cornerThickness}px solid ${cornerColor}`,
            borderLeft: `${cornerThickness}px solid ${cornerColor}`,
            borderTopLeftRadius: '12px',
          }}
        />
        {/* 右上 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: cornerLength,
            height: cornerLength,
            borderTop: `${cornerThickness}px solid ${cornerColor}`,
            borderRight: `${cornerThickness}px solid ${cornerColor}`,
            borderTopRightRadius: '12px',
          }}
        />
        {/* 左下 */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: cornerLength,
            height: cornerLength,
            borderBottom: `${cornerThickness}px solid ${cornerColor}`,
            borderLeft: `${cornerThickness}px solid ${cornerColor}`,
            borderBottomLeftRadius: '12px',
          }}
        />
        {/* 右下 */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: cornerLength,
            height: cornerLength,
            borderBottom: `${cornerThickness}px solid ${cornerColor}`,
            borderRight: `${cornerThickness}px solid ${cornerColor}`,
            borderBottomRightRadius: '12px',
          }}
        />
      </Box>

      {/* ヘルプテキスト */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'rgba(0, 0, 0, 0.54)',
            borderRadius: '8px',
          }}
        >
          <Typography sx={{ color: '#FFFFFF', fontSize: 14 }}>
            バーコードをガイド枠に合わせてください
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
