import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import { libraryKey } from '@/domain/models/library';
import { useLibraryList } from '@/presentation/hooks/useLibraryList';
import { useRegisteredLibraryMutations } from '@/presentation/hooks/useRegisteredLibraries';
import { useSelectedLibraries } from '@/presentation/hooks/useSelectedLibraries';
import { ErrorStateWidget } from '@/presentation/widgets/ErrorStateWidget';
import { SubPageAppBar } from '@/presentation/widgets/SubPageAppBar';

/**
 * 図書館一覧画面。
 *
 * `lib/presentation/pages/library_list_page.dart` の移植。
 * チェックボックスで図書館を選択し、登録ボタンで一括登録する。
 */
export function LibraryListPage(): JSX.Element {
  const params = useParams<{ pref: string; city: string }>();
  const pref = params.pref ?? '';
  const city = params.city ?? '';
  const navigate = useNavigate();

  const librariesQuery = useLibraryList({ pref, city });
  const { selected, isSelected, toggle, clear } = useSelectedLibraries();
  const { addAll } = useRegisteredLibraryMutations();

  // 選択状態はこの市区町村の一覧での一時的なもの。pref/city が変わったとき
  // （初回マウント含む）に必ずクリアし、別の街の選択が持ち越されて誤登録
  // されるのを防ぐ。同一ルートでパラメータだけ変わる遷移ではアンマウント
  // されないため、アンマウントではなく pref/city 依存でクリアする。
  useEffect(() => {
    clear();
  }, [pref, city, clear]);

  const handleRegister = async (): Promise<void> => {
    if (selected.length === 0) return;
    await addAll([...selected]);
    clear();
    enqueueSnackbar('図書館を登録しました');
    // 登録完了後は登録図書館の管理画面へ遷移し、登録結果を確認できるようにする。
    navigate('/library');
  };

  const renderBody = (): JSX.Element => {
    if (librariesQuery.isLoading) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            minHeight: 'calc(100vh - 120px)',
          }}
        >
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>図書館を検索中...</Typography>
        </Box>
      );
    }

    if (librariesQuery.isError) {
      return (
        <ErrorStateWidget
          error={librariesQuery.error}
          onRetry={() => {
            void librariesQuery.refetch();
          }}
        />
      );
    }

    const libraries = librariesQuery.data ?? [];

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List>
            {libraries.map((library) => {
              const checked = isSelected(library);
              return (
                <ListItemButton
                  key={libraryKey(library)}
                  onClick={() => toggle(library)}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={checked}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={library.formalName}
                    secondary={library.address}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            disabled={selected.length === 0}
            onClick={() => {
              void handleRegister();
            }}
            sx={{ width: '100%' }}
          >
            {selected.length === 0
              ? '選択した図書館を登録する'
              : `選択した図書館を登録する（${selected.length}件選択中）`}
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SubPageAppBar title={`${city}の図書館`} />
      {renderBody()}
    </Box>
  );
}
