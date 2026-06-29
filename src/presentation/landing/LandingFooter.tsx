import { Box, Link, Typography } from '@mui/material';

import {
  LANDING_COLORS as C,
  LANDING_SERIF,
  LANDING_MONO,
} from '@/presentation/landing/landingTokens';

/**
 * ランディングの締め。短いコピーで背中を押し、各種リンクを示す。
 * CTA（Google ログイン）はヒーローに集約しているため、ここでは再掲しない
 * （One Tap の二重初期化を避ける）。深い緑青の帯で全体を締める。
 */
export function LandingFooter(): JSX.Element {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        bgcolor: C.verdigris,
        color: C.parchment,
        mt: 2,
        px: 2,
        py: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1.5,
      }}
    >
      <Typography
        sx={{
          fontFamily: LANDING_SERIF,
          fontSize: '1.15rem',
          fontWeight: 600,
        }}
      >
        さあ、いつもの図書館で。
      </Typography>
      <Typography sx={{ color: `${C.parchment}cc`, fontSize: '0.85rem' }}>
        画面上部の「Google でログイン」からはじめられます。
      </Typography>

      <Box
        sx={{
          mt: 1,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: { xs: 2, sm: 3 },
        }}
      >
        <Link
          href="/terms.html"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: C.parchment, fontSize: '0.82rem' }}
        >
          利用規約
        </Link>
        <Link
          href="/privacy-policy.html"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: C.parchment, fontSize: '0.82rem' }}
        >
          プライバシーポリシー
        </Link>
        <Link
          href="https://github.com/satoryu/LibCheck"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: C.parchment, fontSize: '0.82rem' }}
        >
          GitHub
        </Link>
      </Box>

      <Box
        aria-hidden
        sx={{
          mt: 1,
          fontFamily: LANDING_MONO,
          fontSize: 11,
          letterSpacing: '0.18em',
          color: `${C.brass}`,
          textTransform: 'uppercase',
        }}
      >
        010 · LibCheck
      </Box>
    </Box>
  );
}
