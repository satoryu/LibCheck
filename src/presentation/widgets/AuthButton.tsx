import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LogoutIcon from '@mui/icons-material/Logout';

import { useAuth } from '@/presentation/auth/AuthProvider';
import { GoogleSignInControl } from '@/presentation/auth/GoogleSignInControl';

/**
 * 上部バーのアカウント表示。
 * - ログイン中: 名前 + サインアウト（ログアウトアイコン）
 * - 未ログイン: Google サインイン操作（`GoogleSignInControl`）
 */
export function AuthButton(): JSX.Element | null {
  const { user, signOut } = useAuth();

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

  return <GoogleSignInControl />;
}
