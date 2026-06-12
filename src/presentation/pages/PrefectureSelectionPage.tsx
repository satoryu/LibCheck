import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { SubPageAppBar } from '@/presentation/widgets/SubPageAppBar';

/**
 * 都道府県選択画面。
 *
 * `lib/presentation/pages/prefecture_selection_page.dart` の移植。
 */
export function PrefectureSelectionPage(): React.ReactElement {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRegions = buildFilteredRegions(searchQuery);

  return (
    <Box>
      <SubPageAppBar title="都道府県を選択" />
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
          <RegionSection key={region.name} region={region} onSelect={(pref) => navigate(`/library/add/${pref}`)} />
        ))}
      </List>
    </Box>
  );
}

interface RegionSectionProps {
  region: RegionGroup;
  onSelect: (pref: string) => void;
}

function RegionSection({ region, onSelect }: RegionSectionProps): React.ReactElement {
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
        <ListItemButton key={pref} onClick={() => onSelect(pref)}>
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
