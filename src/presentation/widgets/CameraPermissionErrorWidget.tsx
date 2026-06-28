import KeyboardIcon from '@mui/icons-material/Keyboard';
import RefreshIcon from '@mui/icons-material/Refresh';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export interface CameraPermissionErrorWidgetProps {
  onRetry: () => void;
  onManualInput: () => void;
}

/**
 * カメラ許可が得られていないときの警告表示。
 *
 * Web ではアプリから OS/ブラウザの設定画面を開けないため、ブラウザ側での
 * 許可手順を案内し、「再試行」で getUserMedia を再実行して許可ダイアログの
 * 再表示（未決定の場合）を促す。
 */
export function CameraPermissionErrorWidget({
  onRetry,
  onManualInput,
}: CameraPermissionErrorWidgetProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Box
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CameraAltOutlinedIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
        <Typography variant="subtitle1" align="center" sx={{ mt: 3 }}>
          カメラへのアクセスが許可されていません
        </Typography>
        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
          バーコードをスキャンするには、ブラウザの設定でカメラへのアクセスを許可してください。
          アドレスバーのカメラアイコン、またはサイトの設定から変更できます。
        </Typography>
        <Button
          fullWidth
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ mt: 4 }}
        >
          再試行
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<KeyboardIcon />}
          onClick={onManualInput}
          sx={{ mt: 1.5 }}
        >
          ISBNを手動入力する
        </Button>
      </Box>
    </Box>
  );
}
