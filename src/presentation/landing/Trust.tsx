import { Box, Link, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { SectionLabel } from '@/presentation/landing/HowItWorks';
import {
  LANDING_COLORS as C,
  LANDING_SERIF,
} from '@/presentation/landing/landingTokens';

const POINTS: readonly string[] = [
  'ログインは Google アカウントで。パスワードを本アプリが受け取ることはありません。',
  '保存するのは登録図書館と検索履歴だけ。あなたのデータはあなただけが見られます。',
  '検索履歴や図書館は、アプリ内でいつでも削除できます。',
];

/**
 * 「安心」セクション。何を保存するか・プライバシーを簡潔に伝え、
 * プライバシーポリシーへ誘導する。
 */
export function Trust(): JSX.Element {
  return (
    <Box
      component="section"
      aria-labelledby="lp-trust-heading"
      sx={{ width: '100%', maxWidth: 460 }}
    >
      <SectionLabel id="lp-trust-heading">安心して使うために</SectionLabel>

      <Box
        sx={{
          mt: 2,
          bgcolor: C.card,
          border: `1px solid ${C.brass}55`,
          borderRadius: 1,
          px: 2.5,
          py: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockOutlinedIcon sx={{ color: C.teal, fontSize: 22 }} />
          <Typography
            component="h3"
            sx={{
              fontFamily: LANDING_SERIF,
              fontWeight: 600,
              fontSize: '1rem',
              color: C.ink,
            }}
          >
            データの扱い
          </Typography>
        </Box>

        <Box
          component="ul"
          sx={{ m: 0, mt: 1.5, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}
        >
          {POINTS.map((p) => (
            <Box
              component="li"
              key={p}
              sx={{ color: C.inkSoft, fontSize: '0.86rem', lineHeight: 1.8 }}
            >
              {p}
            </Box>
          ))}
        </Box>

        <Typography sx={{ mt: 2, fontSize: '0.84rem' }}>
          詳しくは
          <Link
            href="/privacy-policy.html"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: C.teal }}
          >
            プライバシーポリシー
          </Link>
          をご覧ください。
        </Typography>
      </Box>
    </Box>
  );
}
