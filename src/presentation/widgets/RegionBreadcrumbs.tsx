import { Link as RouterLink } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import type { BreadcrumbItem } from '@/presentation/regionPage/regionPageContent';

export interface RegionBreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * 地域ページのパンくず（#182）。最後の項目は現在のページとしてリンクにしない。
 *
 * 配信 HTML に差し込む同等のパンくず（functions/_shared/regionPageHtml.js）と、
 * 構造化データの BreadcrumbList も同じ `regionBreadcrumbs()` から作る。
 */
export function RegionBreadcrumbs({ items }: RegionBreadcrumbsProps): JSX.Element {
  return (
    <Breadcrumbs aria-label="パンくずリスト" sx={{ fontSize: '0.85rem' }}>
      {items.map((item, i) =>
        i === items.length - 1 ? (
          <Typography
            key={item.path}
            aria-current="page"
            color="text.primary"
            sx={{ fontSize: 'inherit' }}
          >
            {item.name}
          </Typography>
        ) : (
          <Link key={item.path} component={RouterLink} to={item.path} underline="hover" color="inherit">
            {item.name}
          </Link>
        ),
      )}
    </Breadcrumbs>
  );
}
