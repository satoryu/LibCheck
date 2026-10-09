import { Link as RouterLink } from 'react-router-dom';
import { Box, Link, Typography } from '@mui/material';

import { SectionLabel } from '@/presentation/landing/HowItWorks';
import { LANDING_COLORS as C } from '@/presentation/landing/landingTokens';
import {
  buildPrefectureIndexContent,
  regionPath,
} from '@/presentation/regionPage/regionPageContent';

const INDEX_CONTENT = buildPrefectureIndexContent();

/**
 * 「対応している図書館を地域から探す」セクション（#182）。
 *
 * トップから都道府県ページ → 市区町村ページへリンクでたどれるようにする
 * （地域ページの発見経路が sitemap.xml だけだったため）。配信 HTML に
 * 差し込む同等のリンク（functions/_shared/regionPageHtml.js の
 * renderTopRootHtml）と同じ regionPageContent.ts から作る。
 */
export function RegionLinks(): JSX.Element {
  return (
    <Box
      component="section"
      aria-labelledby="lp-region-heading"
      sx={{ width: '100%', maxWidth: 460 }}
    >
      <SectionLabel id="lp-region-heading">対応している図書館を地域から探す</SectionLabel>

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
        <Typography sx={{ color: C.inkSoft, fontSize: '0.86rem', lineHeight: 1.8 }}>
          全国の公共図書館・大学図書館などに対応しています。
          <Link component={RouterLink} to={regionPath()} sx={{ color: C.teal }}>
            都道府県から探す
          </Link>
        </Typography>

        {INDEX_CONTENT.regions.map((region) => (
          <Box key={region.name} sx={{ mt: 1.5 }}>
            <Typography
              component="h3"
              sx={{ fontSize: '0.8rem', fontWeight: 600, color: C.inkSoft }}
            >
              {region.name}
            </Typography>
            <Box
              component="ul"
              sx={{ listStyle: 'none', p: 0, m: 0, mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 1.25 }}
            >
              {region.prefectures.map((pref) => (
                <li key={pref.path}>
                  <Link
                    component={RouterLink}
                    to={pref.path}
                    sx={{ color: C.teal, fontSize: '0.86rem' }}
                  >
                    {pref.name}
                  </Link>
                </li>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
