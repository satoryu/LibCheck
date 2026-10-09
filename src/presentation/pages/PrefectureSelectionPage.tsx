import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { RegionGroup } from '@/domain/data/japanesePrefectures';
import { JAPANESE_PREFECTURE_REGIONS } from '@/domain/data/japanesePrefectures';
import {
  buildPrefectureIndexContent,
  regionPath,
} from '@/presentation/regionPage/regionPageContent';
import { PublicPageIntro } from '@/presentation/widgets/PublicPageIntro';
import { RegionPageHeader } from '@/presentation/widgets/RegionPageHeader';
import { SubPageAppBar } from '@/presentation/widgets/SubPageAppBar';

/**
 * 都道府県選択画面。
 *
 * `lib/presentation/pages/prefecture_selection_page.dart` の移植。
 *
 * #182: 都道府県一覧ページとして h1・パンくずを持ち、都道府県は `<a href>` にする。
 */
const INDEX_CONTENT = buildPrefectureIndexContent();

export function PrefectureSelectionPage(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRegions = buildFilteredRegions(searchQuery);

  return (
    <Box>
      <SubPageAppBar title="都道府県を選択" />
      {/* 文言は配信 HTML の meta description と同じ（regionPageContent.ts）。 */}
      <PublicPageIntro description={INDEX_CONTENT.description} />
      <RegionPageHeader breadcrumbs={INDEX_CONTENT.breadcrumbs} heading={INDEX_CONTENT.h1} />
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="都道府県を検索..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: { borderRadius: '12px' },
          }}
        />
      </Box>
      <List>
        {filteredRegions.map((region) => (
          <RegionSection key={region.name} region={region} />
        ))}
      </List>
    </Box>
  );
}

interface RegionSectionProps {
  region: RegionGroup;
}

function RegionSection({ region }: RegionSectionProps): React.ReactElement {
  const theme = useTheme();
  return (
    <Box>
      <Box sx={{ px: 2, py: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ color: theme.palette.text.secondary }}
        >
          {region.name}
        </Typography>
      </Box>
      {region.prefectures.map((pref) => (
        <ListItemButton key={pref} component={RouterLink} to={regionPath(pref)}>
          <ListItemText primary={pref} />
          <ListItemIcon sx={{ minWidth: 'auto' }}>
            <ChevronRightIcon />
          </ListItemIcon>
        </ListItemButton>
      ))}
    </Box>
  );
}

function buildFilteredRegions(searchQuery: string): RegionGroup[] {
  if (searchQuery.length === 0) {
    return JAPANESE_PREFECTURE_REGIONS;
  }

  return JAPANESE_PREFECTURE_REGIONS.map((region) => ({
    name: region.name,
    prefectures: region.prefectures.filter((pref) => pref.includes(searchQuery)),
  })).filter((region) => region.prefectures.length > 0);
}
