import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  TextField,
  Button,
  useTheme,
} from '@mui/material';
import { isbnValidator } from '@/domain/utils/isbnValidator';

/**
 * ISBN手動入力画面。
 *
 * `lib/presentation/pages/isbn_input_page.dart` の移植。
 */
export function IsbnInputPage(): React.ReactElement {
  const navigate = useNavigate();
  const theme = useTheme();
  const [value, setValue] = useState('');

  const errorText = isbnValidator.getValidationMessage(value);
  const normalized = isbnValidator.normalizeIsbn(value);
  const isValid = normalized.length > 0 && isbnValidator.isValidIsbn(value);
  const showValid = isValid && errorText === null && normalized.length >= 10;

  const onSubmit = () => {
    const isbn = isbnValidator.normalizeIsbn(value);
    navigate(`/result/${isbn}?source=isbn`);
  };

  const navigateToScan = () => {
    navigate('/scan');
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            ISBN入力
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">ISBNを入力してください</Typography>
        <Box sx={{ height: 16 }} />
        <TextField
          fullWidth
          value={value}
          onChange={(event) => setValue(event.target.value)}
          type="number"
          label="ISBN (13桁 または 10桁)"
          error={errorText !== null}
          helperText={errorText ?? undefined}
        />
        <Box sx={{ height: 8 }} />
        {showValid && (
          <Typography sx={{ color: theme.palette.primary.main }}>
            有効なISBNです
          </Typography>
        )}
        <Box sx={{ height: 8 }} />
        <Typography variant="caption" component="p">
          書籍の裏表紙に記載されている13桁の数字を入力してください。
        </Typography>
        <Box sx={{ height: 24 }} />
        <Button
          variant="contained"
          fullWidth
          disabled={!isValid}
          onClick={onSubmit}
        >
          検索する
        </Button>
        <Box sx={{ height: 12 }} />
        <Button variant="outlined" fullWidth onClick={navigateToScan}>
          バーコードスキャンへ
        </Button>
      </Box>
    </Box>
  );
}
