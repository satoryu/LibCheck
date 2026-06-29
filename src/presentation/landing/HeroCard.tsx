import { Box, Link, Typography } from '@mui/material';

import { GoogleSignInControl } from '@/presentation/auth/GoogleSignInControl';
import {
  LANDING_COLORS as C,
  LANDING_SERIF,
  LANDING_MONO,
} from '@/presentation/landing/landingTokens';

/**
 * ランディングの署名的要素＝図書館の「貸出カード」を模したヒーロー。
 *
 * 請求記号風のモノラベル・明朝の大見出し・Google ログイン CTA・ミシン目・
 * 「貸出可能」スタンプで、本アプリの世界観（蔵書を確認する瞬間）を一目で伝える。
 */
export function HeroCard(): JSX.Element {
  return (
    <Box
      component="section"
      aria-labelledby="lp-hero-heading"
      sx={{
        width: '100%',
        maxWidth: 460,
        bgcolor: C.card,
        border: `1px solid ${C.brass}66`,
        borderTop: `3px solid ${C.teal}`,
        borderRadius: 1,
        boxShadow: '0 18px 40px -24px rgba(14,59,54,0.55)',
        px: { xs: 3, sm: 4 },
        py: { xs: 3.5, sm: 4 },
        textAlign: 'left',
      }}
    >
      {/* 請求記号風ラベル＋細い罫 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontFamily: LANDING_MONO,
          fontSize: 12,
          letterSpacing: '0.14em',
          color: C.brass,
          textTransform: 'uppercase',
        }}
      >
        <Box component="span">010 · LIBCHECK</Box>
        <Box
          aria-hidden
          sx={{
            flex: 1,
            borderBottom: `1px dashed ${C.brass}88`,
            transform: 'translateY(-2px)',
          }}
        />
      </Box>

      {/* 大見出し（明朝） */}
      <Typography
        id="lp-hero-heading"
        component="h1"
        sx={{
          mt: 2,
          fontFamily: LANDING_SERIF,
          fontWeight: 600,
          color: C.ink,
          lineHeight: 1.45,
          fontSize: { xs: '1.6rem', sm: '1.9rem' },
          letterSpacing: '0.01em',
        }}
      >
        その本、いつもの
        <br />
        図書館にありますか。
      </Typography>

      {/* 本文 */}
      <Typography
        sx={{
          mt: 2,
          color: C.inkSoft,
          fontSize: '0.95rem',
          lineHeight: 1.9,
        }}
      >
        ISBN をスキャンまたは入力するだけ。登録した複数の図書館の蔵書と貸出状況を、一度に確認できます。
      </Typography>

      {/* CTA */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <GoogleSignInControl oneTap />
      </Box>
      <Typography
        sx={{
          mt: 1.5,
          textAlign: 'center',
          color: C.inkSoft,
          fontSize: '0.8rem',
        }}
      >
        無料・登録した図書館と検索履歴はどの端末でも同期
      </Typography>

      {/* ミシン目 */}
      <Box
        aria-hidden
        sx={{
          mt: 3,
          borderTop: `1px dashed ${C.brass}88`,
        }}
      />

      {/* 返却カード風フッター行＋スタンプ */}
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box
          aria-hidden
          sx={{
            fontFamily: LANDING_MONO,
            fontSize: 11,
            letterSpacing: '0.18em',
            color: C.brass,
            textTransform: 'uppercase',
          }}
        >
          Date Due
        </Box>
        <Box
          aria-hidden
          sx={{
            fontFamily: LANDING_SERIF,
            fontWeight: 700,
            fontSize: '1rem',
            color: C.stampRed,
            border: `2px solid ${C.stampRed}`,
            borderRadius: 1,
            px: 1.5,
            py: 0.25,
            letterSpacing: '0.12em',
            transform: 'rotate(-7deg)',
            opacity: 0.92,
          }}
        >
          貸出可能
        </Box>
      </Box>

      {/* 同意（同意取得点） */}
      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 3, color: C.inkSoft, lineHeight: 1.7 }}
      >
        続行すると
        <Link
          href="/terms.html"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: C.teal }}
        >
          利用規約
        </Link>
        と
        <Link
          href="/privacy-policy.html"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: C.teal }}
        >
          プライバシーポリシー
        </Link>
        に同意したものとみなされます。
      </Typography>
    </Box>
  );
}
