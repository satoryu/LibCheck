import Button from '@mui/material/Button';
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
 * Google サインイン操作部。モック有効時は「Dev ログイン」、クライアント ID
 * があれば GIS のログイン、無ければ何も表示しない。`oneTap` で起動時の自動
 * 復帰（One Tap / auto_select）を有効化する（ログイン画面で使用）。
 */
export function GoogleSignInControl({
  oneTap = false,
}: {
  oneTap?: boolean;
}): JSX.Element | null {
  const { signIn } = useAuth();

  if (authMockEnabled()) {
    return (
      <Button
        variant="outlined"
        onClick={() => signIn(MOCK_USER, MOCK_ID_TOKEN)}
      >
        Dev ログイン（モック）
      </Button>
    );
  }

  if (googleClientId().length === 0) {
    return null;
  }

  return (
    <GoogleLogin
      useOneTap={oneTap}
      auto_select={oneTap}
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
        /* ユーザーがキャンセル等。無処理。 */
      }}
    />
  );
}
