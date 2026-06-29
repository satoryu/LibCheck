import { Box } from '@mui/material';

import { HeroCard } from '@/presentation/landing/HeroCard';
import { HowItWorks } from '@/presentation/landing/HowItWorks';
import { Features } from '@/presentation/landing/Features';
import { Trust } from '@/presentation/landing/Trust';
import { LandingFooter } from '@/presentation/landing/LandingFooter';
import { LANDING_COLORS as C } from '@/presentation/landing/landingTokens';

/**
 * 未ログイン時のランディングページ。
 *
 * 本アプリを紹介し、Google ログインへ誘導する。署名的要素は「貸出カード」
 * （HeroCard）。背景は羊皮紙＋ごく薄い罫線（ruled paper）で世界観を支える。
 *
 * 構成: ヒーロー → 使い方 → できること → 安心 → フッター。
 * 本文は中央寄せの単一カラム、フッターのみ全幅の緑青帯で締める。
 */
export function LandingPage(): JSX.Element {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: C.parchment,
        // ごく薄い罫線（罫紙の質感）。主張しすぎない程度に。
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent 31px,
          ${C.brass}14 31px,
          ${C.brass}14 32px
        )`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2,
          pt: 6,
          pb: 7,
          gap: 6,
        }}
      >
        <HeroCard />
        <HowItWorks />
        <Features />
        <Trust />
      </Box>
      <LandingFooter />
    </Box>
  );
}
