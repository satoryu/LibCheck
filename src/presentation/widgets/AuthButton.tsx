import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LogoutIcon from '@mui/icons-material/Logout';
import { GoogleLogin } from '@react-oauth/google';

import { useAuth } from '@/presentation/auth/AuthProvider';
import { decodeJwtPayload } from '@/presentation/auth/decodeJwtPayload';
import {
  authMockEnabled,
  googleClientId,
  MOCK_ID_TOKEN,
  MOCK_USER,
} from '@/data/datasources/authConfig';

/**
 * ログイン/ログアウト UI。
 * - ログイン中: 名前 + サインアウト
 * - 開発モック有効: 「Dev ログイン（モック）」ボタン
 * - 通常（クライアント ID あり）: Google ログインボタン（GIS）
 * - クライアント ID 未設定かつ非モック（テスト等）: 何も表示しない
 */
export function AuthButton(): JSX.Element | null {
  const { user, signIn, signOut } = useAuth();

  if (user) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" sx={{ color: 'inherit' }}>
          {user.name ?? user.email ?? 'ログイン中'}
        </Typography>
        <Tooltip title="サインアウト">
          <IconButton
            color="inherit"
            size="small"
            aria-label="サインアウト"
            onClick={signOut}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  if (authMockEnabled()) {
    return (
      <Button
        color="inherit"
        variant="outlined"
        size="small"
        onClick={() => signIn(MOCK_USER, MOCK_ID_TOKEN)}
      >
        Dev ログイン（モック）
      </Button>
    );
  }

  // クライアント ID が無ければ Google ログインは表示しない（テスト/未設定環境）。
  if (googleClientId().length === 0) {
    return null;
  }

  return (
    <GoogleLogin
      onSuccess={(res) => {
        const credential = res.credential;
        if (credential === undefined) return;
        const payload = decodeJwtPayload(credential);
        if (payload?.sub === undefined) return;
        signIn(
          {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
          },
          credential,
        );
      }}
      onError={() => {
        /* ユーザーがキャンセル等。ここでは無処理。 */
      }}
    />
  );
}
