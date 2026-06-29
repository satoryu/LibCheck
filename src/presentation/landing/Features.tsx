import { Box, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DevicesIcon from '@mui/icons-material/Devices';

import { SectionLabel } from '@/presentation/landing/HowItWorks';
import {
  LANDING_COLORS as C,
  LANDING_SERIF,
} from '@/presentation/landing/landingTokens';

interface Feature {
  Icon: SvgIconComponent;
  title: string;
  body: string;
}

const FEATURES: readonly Feature[] = [
  {
    Icon: CollectionsBookmarkIcon,
    title: '複数館を横断',
    body: '登録したすべての図書館を一度に検索。借りられる館がすぐ見つかります。',
  },
  {
    Icon: CameraAltIcon,
    title: 'バーコードスキャン',
    body: '本の ISBN バーコードをかざすだけ。手入力にも対応します。',
  },
  {
    Icon: EventAvailableIcon,
    title: '予約ページへ',
    body: '貸出可・予約可の館は、各図書館の予約ページへそのまま移動できます。',
  },
  {
    Icon: DevicesIcon,
    title: '端末間で同期',
    body: '登録した図書館と検索履歴は、ログインすればどの端末でも同じ内容に。',
  },
];

/**
 * 特長セクション。4 つを 2 列グリッド（モバイルは 1 列）のコンパクトカードで。
 */
export function Features(): JSX.Element {
  return (
    <Box
      component="section"
      aria-labelledby="lp-features-heading"
      sx={{ width: '100%', maxWidth: 460 }}
    >
      <SectionLabel id="lp-features-heading">できること</SectionLabel>

      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.5,
        }}
      >
        {FEATURES.map(({ Icon, title, body }) => (
          <Box
            key={title}
            sx={{
              bgcolor: C.card,
              border: `1px solid ${C.brass}55`,
              borderRadius: 1,
              px: 2.5,
              py: 2,
            }}
          >
            <Icon sx={{ color: C.teal, fontSize: 24 }} />
            <Typography
              component="h3"
              sx={{
                mt: 1,
                fontFamily: LANDING_SERIF,
                fontWeight: 600,
                fontSize: '1rem',
                color: C.ink,
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                color: C.inkSoft,
                fontSize: '0.84rem',
                lineHeight: 1.8,
              }}
            >
              {body}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
