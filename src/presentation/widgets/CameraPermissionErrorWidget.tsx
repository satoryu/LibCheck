import KeyboardIcon from '@mui/icons-material/Keyboard';
import SettingsIcon from '@mui/icons-material/Settings';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export interface CameraPermissionErrorWidgetProps {
  onOpenSettings: () => void;
  onManualInput: () => void;
}

export function CameraPermissionErrorWidget({
  onOpenSettings,
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
        <Box sx={{ height: 24 }} />
        <Typography variant="subtitle1" align="center">
          カメラへのアクセスが許可されていません
        </Typography>
        <Box sx={{ height: 8 }} />
        <Typography variant="body2" align="center">
          バーコードをスキャンするには、設定からカメラへのアクセスを許可してください。
        </Typography>
        <Box sx={{ height: 32 }} />
        <Button
          fullWidth
          variant="contained"
          startIcon={<SettingsIcon />}
          onClick={onOpenSettings}
        >
          設定を開く
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
