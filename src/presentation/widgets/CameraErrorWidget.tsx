import KeyboardIcon from '@mui/icons-material/Keyboard';
import RefreshIcon from '@mui/icons-material/Refresh';
import VideocamOffOutlinedIcon from '@mui/icons-material/VideocamOffOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export interface CameraErrorWidgetProps {
  onRetry: () => void;
  onManualInput: () => void;
}

export function CameraErrorWidget({
  onRetry,
  onManualInput,
}: CameraErrorWidgetProps): JSX.Element {
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
        <VideocamOffOutlinedIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
        <Box sx={{ height: 24 }} />
        <Typography variant="subtitle1" align="center">
          カメラの起動に失敗しました
        </Typography>
        <Box sx={{ height: 8 }} />
        <Typography variant="body2" align="center">
          しばらくしてからもう一度お試しください。
        </Typography>
        <Box sx={{ height: 32 }} />
        <Button
          fullWidth
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
        >
          再試行
        </Button>
        <Box sx={{ height: 12 }} />
        <Button
          fullWidth
          variant="outlined"
          startIcon={<KeyboardIcon />}
          onClick={onManualInput}
        >
          ISBNを手動入力する
        </Button>
      </Box>
    </Box>
  );
}
