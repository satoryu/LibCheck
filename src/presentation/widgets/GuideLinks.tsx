import { useId } from 'react';
import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

import { GUIDE_PAGES, guideHref } from '@/presentation/guide/guidePages';

const HEADING = '使い方ガイド';

export interface GuideLinksProps {
  /** 見出しの描画を差し替える（ランディングは LP 共通の SectionLabel を使う）。 */
  renderHeading?: (id: string, text: string) => ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * 使い方ガイド（#184、静的ページ public/guide/*.html）へのリンク一覧。
 *
 * 静的ページなので React Router ではなく通常の `<a href>` で遷移する。リンク先は
 * `.html` 付き（guideHref 参照）。配信 HTML の同等のリンク
 * （functions/_shared/regionPageHtml.js）と同じ GUIDE_PAGES から作る。
 */
export function GuideLinks({ renderHeading, sx }: GuideLinksProps): JSX.Element {
  const headingId = useId();
  return (
    <Box component="section" aria-labelledby={headingId} sx={sx}>
      {renderHeading ? (
        renderHeading(headingId, HEADING)
      ) : (
        <Typography id={headingId} component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
          {HEADING}
        </Typography>
      )}
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mt: 1 }}>
        {GUIDE_PAGES.map((guide) => (
          <Box component="li" key={guide.slug} sx={{ py: 0.75 }}>
            <Link href={guideHref(guide.slug)} variant="body2" sx={{ fontWeight: 600 }}>
              {guide.title}
            </Link>
            <Typography variant="caption" color="text.secondary" component="p">
              {guide.summary}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
