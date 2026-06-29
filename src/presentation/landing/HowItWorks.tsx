import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import {
  LANDING_COLORS as C,
  LANDING_SERIF,
  LANDING_MONO,
} from '@/presentation/landing/landingTokens';

interface Step {
  no: string;
  Icon: SvgIconComponent;
  title: string;
  body: string;
}

const STEPS: readonly Step[] = [
  {
    no: '01',
    Icon: LocalLibraryIcon,
    title: '図書館を登録',
    body: '都道府県・市区町村から、普段使う図書館を選んで登録します。複数館をまとめて登録できます。',
  },
  {
    no: '02',
    Icon: QrCodeScannerIcon,
    title: 'ISBN をスキャン / 入力',
    body: '本の裏のバーコードをカメラでかざすか、ISBN を手入力します。',
  },
  {
    no: '03',
    Icon: CheckCircleIcon,
    title: '蔵書状況がわかる',
    body: '登録した図書館それぞれの貸出可・貸出中・蔵書なしが一覧で。予約ページへのリンクも表示します。',
  },
];

/**
 * 使い方の 3 ステップ。順序が意味を持つため番号（01/02/03）を付す。
 * 貸出カードの「記入欄」に倣い、各ステップをカード化して並べる。
 */
export function HowItWorks(): JSX.Element {
  return (
    <Box
      component="section"
      aria-labelledby="lp-how-heading"
      sx={{ width: '100%', maxWidth: 460 }}
    >
      <SectionLabel id="lp-how-heading">使い方</SectionLabel>

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {STEPS.map(({ no, Icon, title, body }) => (
          <Box
            key={no}
            sx={{
              display: 'flex',
              gap: 2,
              bgcolor: C.card,
              border: `1px solid ${C.brass}55`,
              borderLeft: `3px solid ${C.teal}`,
              borderRadius: 1,
              px: 2.5,
              py: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                flexShrink: 0,
              }}
            >
              <Box
                aria-hidden
                sx={{
                  fontFamily: LANDING_MONO,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: C.brass,
                }}
              >
                {no}
              </Box>
              <Icon sx={{ color: C.teal, fontSize: 26 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h3"
                sx={{
                  fontFamily: LANDING_SERIF,
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  color: C.ink,
                }}
              >
                {title}
              </Typography>
              <Typography
                sx={{
                  mt: 0.5,
                  color: C.inkSoft,
                  fontSize: '0.88rem',
                  lineHeight: 1.8,
                }}
              >
                {body}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** セクション見出し（請求記号風の小ラベル＋罫）。LP 内で共用する。 */
export function SectionLabel({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <Box
      id={id}
      component="h2"
      sx={{
        m: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontFamily: LANDING_MONO,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.18em',
        color: C.brass,
        textTransform: 'uppercase',
      }}
    >
      <Box component="span">{children}</Box>
      <Box
        aria-hidden
        sx={{ flex: 1, borderBottom: `1px dashed ${C.brass}77` }}
      />
    </Box>
  );
}
