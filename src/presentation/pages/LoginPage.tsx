import { Box, Link, Typography, useTheme } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import { GoogleSignInControl } from '@/presentation/auth/GoogleSignInControl';

/**
 * 未ログイン時に表示するログイン画面（必須ログイン）。
 * GIS の One Tap / 自動選択で起動時のサイレント復帰を試みる。
 */
export function LoginPage(): JSX.Element {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <MenuBookIcon sx={{ fontSize: 64, color: theme.palette.primary.main }} />
      <Typography variant="h5">LibCheck</Typography>
      <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
        {'ログインすると、登録した図書館と検索履歴を\nどの端末でも使えます。'}
      </Typography>
      <GoogleSignInControl oneTap />
      <Typography variant="caption" color="text.secondary">
        続行すると
        <Link
          href="/privacy-policy.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          プライバシーポリシー
        </Link>
        に同意したものとみなされます。
      </Typography>
    </Box>
  );
}
