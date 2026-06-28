import { useNavigate, Navigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Link,
  useTheme,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { useRegisteredLibraries } from '@/presentation/hooks/useRegisteredLibraries';

/**
 * ホーム画面。
 *
 * `lib/presentation/pages/home_page.dart` の移植。
 * 登録図書館が0件のときは `/library` へリダイレクトする
 * （`lib/presentation/app_router.dart` のリダイレクトルールを移植）。
 */
export function HomePage(): React.ReactElement {
  const navigate = useNavigate();
  const theme = useTheme();
  const registeredLibraries = useRegisteredLibraries();

  if (registeredLibraries.isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (registeredLibraries.isSuccess && registeredLibraries.data.length === 0) {
    return <Navigate to="/library" replace />;
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 120px)',
        }}
      >
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 480,
          }}
        >
          <MenuBookIcon
            sx={{ fontSize: 64, color: theme.palette.primary.main }}
          />
          <Typography variant="h6" sx={{ mt: 2 }}>
            図書館の蔵書をかんたん検索
          </Typography>
          <Button
            variant="contained"
            startIcon={<QrCodeScannerIcon />}
            onClick={() => navigate('/scan')}
            sx={{ width: '100%', minHeight: 56, mt: 4 }}
          >
            バーコードでスキャン
          </Button>
          <Button
            variant="outlined"
            startIcon={<KeyboardIcon />}
            onClick={() => navigate('/isbn-input')}
            sx={{ width: '100%', minHeight: 56, mt: 2 }}
          >
            ISBNを入力
          </Button>
          <Link
            href="/privacy-policy.html"
            target="_blank"
            rel="noopener noreferrer"
            variant="caption"
            color="text.secondary"
            sx={{ mt: 3 }}
          >
            プライバシーポリシー
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
