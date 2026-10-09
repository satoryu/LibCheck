import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { BreadcrumbItem } from '@/presentation/regionPage/regionPageContent';
import { RegionBreadcrumbs } from '@/presentation/widgets/RegionBreadcrumbs';

export interface RegionPageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  heading: string;
}

/**
 * 地域ページ（`/library/add` 以下）の本文先頭に置くパンくずと h1（#182）。
 *
 * `SubPageAppBar` のタイトルは操作用の短い表示のまま残し、ページの見出し（h1）は
 * 本文側にこの1つだけ置く。文言は配信 HTML（functions/_shared/regionPageHtml.js）と
 * 同じ regionPageContent.ts から取る。
 */
export function RegionPageHeader({ breadcrumbs, heading }: RegionPageHeaderProps): JSX.Element {
  return (
    <Box sx={{ px: 2, pt: 1.5 }}>
      <RegionBreadcrumbs items={breadcrumbs} />
      <Typography component="h1" variant="h6" sx={{ mt: 0.5, fontWeight: 700 }}>
        {heading}
      </Typography>
    </Box>
  );
}
