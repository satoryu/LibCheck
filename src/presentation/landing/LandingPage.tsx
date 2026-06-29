import { Box } from '@mui/material';

import { HeroCard } from '@/presentation/landing/HeroCard';
import { LANDING_COLORS as C } from '@/presentation/landing/landingTokens';

/**
 * 未ログイン時のランディングページ。
 *
 * 本アプリを紹介し、Google ログインへ誘導する。署名的要素は「貸出カード」
 * （HeroCard）。背景は羊皮紙＋ごく薄い罫線（ruled paper）で世界観を支える。
 *
 * 現状はヒーローのみ。使い方・特長・安心の各セクションは順次追加する。
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
        justifyContent: 'center',
        px: 2,
        py: 6,
      }}
    >
      <HeroCard />
    </Box>
  );
}
