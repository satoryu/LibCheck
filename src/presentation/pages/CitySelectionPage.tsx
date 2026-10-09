import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import { usePrefectureLibraries } from '@/presentation/hooks/usePrefectureLibraries';
import {
  APP_SUMMARY,
  buildPrefecturePageContent,
  regionBreadcrumbs,
} from '@/presentation/regionPage/regionPageContent';
import { ErrorStateWidget } from '@/presentation/widgets/ErrorStateWidget';
import { PublicPageIntro } from '@/presentation/widgets/PublicPageIntro';
import { RegionPageHeader } from '@/presentation/widgets/RegionPageHeader';
import { SubPageAppBar } from '@/presentation/widgets/SubPageAppBar';

/**
 * 市区町村選択ページ。
 *
 * `lib/presentation/pages/city_selection_page.dart` の移植。
 *
 * #182: 都道府県ページとして h1・パンくずを持ち、市区町村は館数付きの
 * `<a href>` にする（クローラが市区町村ページへたどれるように）。
 */
export function CitySelectionPage() {
  const { pref = '' } = useParams<{ pref: string }>();
  const prefectureQuery = usePrefectureLibraries(pref);
  const content =
    prefectureQuery.data === undefined
      ? null
      : buildPrefecturePageContent(pref, prefectureQuery.data);
  const [searchQuery, setSearchQuery] = useState('');

  const renderBody = () => {
    if (prefectureQuery.isLoading) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography>読み込み中...</Typography>
        </Box>
      );
    }

    if (prefectureQuery.isError) {
      return (
        <ErrorStateWidget
          error={prefectureQuery.error}
          onRetry={() => {
            void prefectureQuery.refetch();
          }}
        />
      );
    }

    const cities = content?.kind === 'prefecture' ? content.cities : [];
    const filteredCities =
      searchQuery === ''
        ? cities
        : cities.filter((city) => city.name.includes(searchQuery));

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="市区町村を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
        </Box>
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List>
            {filteredCities.map((city) => (
              <ListItemButton key={city.path} component={RouterLink} to={city.path}>
                <ListItemText primary={city.name} secondary={`${city.libraryCount}館`} />
                <ChevronRightIcon />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SubPageAppBar title={`${pref}の市区町村`} />
      {/* 文言は配信 HTML の meta description と同じ（regionPageContent.ts）。 */}
      <PublicPageIntro
        description={content?.kind === 'prefecture' ? content.description : APP_SUMMARY}
      />
      <RegionPageHeader
        breadcrumbs={regionBreadcrumbs(pref)}
        heading={content?.h1 ?? `${pref}の図書館`}
      />
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>{renderBody()}</Box>
    </Box>
  );
}
