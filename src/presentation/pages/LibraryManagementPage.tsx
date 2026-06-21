import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import type { Library } from '@/domain/models/library';
import { libraryKey } from '@/domain/models/library';
import {
  useRegisteredLibraries,
  useRegisteredLibraryMutations,
} from '@/presentation/hooks/useRegisteredLibraries';
import { ErrorStateWidget } from '@/presentation/widgets/ErrorStateWidget';

/**
 * 登録図書館の管理ページ。
 *
 * `lib/presentation/pages/library_management_page.dart` の移植。
 */
export function LibraryManagementPage() {
  const navigate = useNavigate();
  const registeredLibraries = useRegisteredLibraries();
  const { add, remove } = useRegisteredLibraryMutations();
  const { enqueueSnackbar } = useSnackbar();
  const [pendingDelete, setPendingDelete] = useState<Library | null>(null);

  const handleConfirmDelete = async () => {
    const library = pendingDelete;
    setPendingDelete(null);
    if (!library) return;
    await remove(library);
    enqueueSnackbar('図書館の登録を解除しました', {
      variant: 'default',
      autoHideDuration: 5000,
      action: () => (
        <Button
          color="inherit"
          size="small"
          onClick={() => {
            void add(library);
          }}
        >
          元に戻す
        </Button>
      ),
    });
  };

  const renderBody = () => {
    if (registeredLibraries.isLoading) {
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

    if (registeredLibraries.isError) {
      return (
        <ErrorStateWidget
          error={registeredLibraries.error}
          onRetry={() => {
            void registeredLibraries.refetch();
          }}
        />
      );
    }

    const libraries = registeredLibraries.data ?? [];
    if (libraries.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 1,
            textAlign: 'center',
            px: 2,
          }}
        >
          <LocalLibraryIcon sx={{ fontSize: 64, color: 'grey.500' }} />
          <Typography sx={{ mt: 1 }}>図書館が登録されていません</Typography>
          <Typography sx={{ whiteSpace: 'pre-line' }}>
            {'よく利用する図書館を登録すると、\n蔵書を簡単に検索できます。'}
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/library/add')}
          >
            図書館を登録する
          </Button>
        </Box>
      );
    }

    return (
      <List>
        {libraries.map((library) => (
          <ListItem
            key={libraryKey(library)}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="削除"
                onClick={() => setPendingDelete(library)}
              >
                <CloseIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={library.formalName}
              secondary={`${library.pref}${library.city}`}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const hasLibraries = (registeredLibraries.data ?? []).length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>{renderBody()}</Box>

      {/* 登録がある時の追加導線（空状態は本文の CTA を使う）。 */}
      {hasLibraries && (
        <Fab
          color="primary"
          aria-label="図書館を追加"
          onClick={() => navigate('/library/add')}
          sx={{ position: 'fixed', right: 16, bottom: 72 }}
        >
          <AddIcon />
        </Fab>
      )}

      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
      >
        <DialogTitle>図書館の登録を解除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`「${pendingDelete?.formalName ?? ''}」の登録を解除します。`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>キャンセル</Button>
          <Button
            onClick={() => {
              void handleConfirmDelete();
            }}
          >
            解除する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
