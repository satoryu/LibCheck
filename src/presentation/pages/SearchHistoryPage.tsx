import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import HistoryIcon from '@mui/icons-material/History';
import { APP_COLORS } from '@/presentation/theme/appColors';
import {
  useSearchHistory,
  useSearchHistoryMutations,
} from '@/presentation/hooks/useSearchHistory';
import { ErrorStateWidget } from '@/presentation/widgets/ErrorStateWidget';
import { SearchHistoryCard } from '@/presentation/widgets/SearchHistoryCard';

/**
 * 検索履歴ページ。
 *
 * `lib/presentation/pages/search_history_page.dart` の移植。
 */
export function SearchHistoryPage() {
  const navigate = useNavigate();
  const historyAsync = useSearchHistory();
  const { remove, removeAll } = useSearchHistoryMutations();
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const entries = historyAsync.data ?? [];
  const hasEntries = historyAsync.isSuccess && entries.length > 0;

  const handleConfirmDeleteAll = async () => {
    await removeAll();
    setDeleteAllOpen(false);
  };

  const renderBody = () => {
    if (historyAsync.isLoading) {
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

    if (historyAsync.isError) {
      return (
        <ErrorStateWidget
          error={historyAsync.error}
          onRetry={() => {
            void historyAsync.refetch();
          }}
        />
      );
    }

    if (entries.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 1,
          }}
        >
          <HistoryIcon sx={{ fontSize: 48, color: APP_COLORS.inactive }} />
          <Typography sx={{ mt: 1 }}>検索履歴はありません</Typography>
          <Typography>書籍を検索すると履歴が保存されます</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2 }}>
        {entries.map((entry) => (
          <Box
            key={entry.isbn}
            sx={{ display: 'flex', alignItems: 'stretch', gap: 1, mb: 1 }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <SearchHistoryCard
                entry={entry}
                onTap={() => navigate(`/result/${entry.isbn}`)}
              />
            </Box>
            <IconButton
              aria-label="削除"
              sx={{ color: APP_COLORS.error }}
              onClick={() => {
                void remove(entry.isbn);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            検索履歴
          </Typography>
          {hasEntries && (
            <IconButton
              color="inherit"
              aria-label="全履歴を削除"
              onClick={() => setDeleteAllOpen(true)}
            >
              <DeleteSweepIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>{renderBody()}</Box>

      <Dialog open={deleteAllOpen} onClose={() => setDeleteAllOpen(false)}>
        <DialogTitle>全履歴を削除</DialogTitle>
        <DialogContent>
          <DialogContentText>すべての検索履歴を削除しますか？</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllOpen(false)}>キャンセル</Button>
          <Button
            onClick={() => {
              void handleConfirmDeleteAll();
            }}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
