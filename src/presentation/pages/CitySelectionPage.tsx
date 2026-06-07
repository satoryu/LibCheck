import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AppBar,
  Box,
  CircularProgress,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import { useCityList } from '@/presentation/hooks/useCityList';
import { ErrorStateWidget } from '@/presentation/widgets/ErrorStateWidget';

/**
 * 市区町村選択ページ。
 *
 * `lib/presentation/pages/city_selection_page.dart` の移植。
 */
export function CitySelectionPage() {
  const navigate = useNavigate();
  const { pref = '' } = useParams<{ pref: string }>();
  const citiesAsync = useCityList(pref);
  const [searchQuery, setSearchQuery] = useState('');

  const renderBody = () => {
    if (citiesAsync.isLoading) {
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

    if (citiesAsync.isError) {
      return (
        <ErrorStateWidget
          error={citiesAsync.error}
          onRetry={() => {
            void citiesAsync.refetch();
          }}
        />
      );
    }

    const cities = citiesAsync.data ?? [];
    const filteredCities =
      searchQuery === ''
        ? cities
        : cities.filter((city) => city.includes(searchQuery));

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
              <ListItemButton
                key={city}
                onClick={() =>
                  navigate(`/library/add/${pref}/${city}`)
                }
              >
                <ListItemText primary={city} />
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
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">{`${pref}の市区町村`}</Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>{renderBody()}</Box>
    </Box>
  );
}
