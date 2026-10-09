import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useAuth } from '@/presentation/auth/AuthProvider';
import { GoogleSignInControl } from '@/presentation/auth/GoogleSignInControl';
import { KC_COLORS as C, KC_SERIF } from '@/presentation/theme/tokens';

export interface PublicPageIntroProps {
  /** このページ固有の一言説明。地域ページでは配信 HTML の meta description と同じ文言（regionPageContent.ts）を渡す。 */
  description: string;
}

/**
 * 未認証で公開している地域ページ（#158: `/library/add` 以下）の先頭に置く案内バナー。
 *
 * これらのページは `AppShell` の外側にある独立ルートで、ロゴやログインボタンを
 * 持たない。検索エンジン経由で初めて到達したユーザーにも「LibCheck が何をする
 * アプリか」「ログインすると何ができるか」が伝わるよう、アプリ名・一言説明・
 * その場でログインできる操作をまとめて表示する（#167）。
 *
 * ログイン中は表示しない。`AuthProvider` はセッション復元完了まで一瞬 `user`
 * が `null` を返すため、ログイン済みユーザーが直接この URL に来た場合はごく
 * 短時間バナーが表示されてから消えることがあるが、機能に影響はないため許容する。
 */
export function PublicPageIntro({
  description,
}: PublicPageIntroProps): JSX.Element | null {
  const { user } = useAuth();

  if (user !== null) return null;

  return (
    <Box
      component="section"
      aria-label="LibCheckについて"
      sx={{
        bgcolor: C.card,
        borderTop: `3px solid ${C.teal}`,
        borderBottom: `1px solid ${C.brass}66`,
        px: 2,
        py: 1.5,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 1.5,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component="p"
          sx={{
            fontFamily: KC_SERIF,
            fontWeight: 700,
            fontSize: '0.95rem',
            color: C.teal,
            lineHeight: 1.2,
          }}
        >
          LibCheck
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: C.inkSoft, mt: 0.25 }}
        >
          {description}
        </Typography>
      </Box>
      <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
        <GoogleSignInControl />
      </Box>
    </Box>
  );
}
