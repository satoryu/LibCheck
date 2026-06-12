import { useEffect, useRef } from 'react';
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import BookIcon from '@mui/icons-material/Book';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import SearchIcon from '@mui/icons-material/Search';

import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import { libraryKey } from '@/domain/models/library';
import { statusForLibKey } from '@/domain/models/libraryStatus';
import { APP_COLORS } from '@/presentation/theme/appColors';
import { resolveErrorMessage } from '@/presentation/utils/errorMessageResolver';
import { useBookAvailability } from '@/presentation/hooks/useBookAvailability';
import { useRegisteredLibraries } from '@/presentation/hooks/useRegisteredLibraries';
import { useSearchHistoryMutations } from '@/presentation/hooks/useSearchHistory';
import { LibraryAvailabilityCard } from '@/presentation/widgets/LibraryAvailabilityCard';
import { SubPageAppBar } from '@/presentation/widgets/SubPageAppBar';

/**
 * 蔵書検索結果画面。
 *
 * `lib/presentation/pages/book_search_result_page.dart` の移植。
 * 登録図書館を読み込み、ISBN の蔵書状況を表示する。
 * 結果が読み込まれたら検索履歴を1度だけ保存する。
 */
export function BookSearchResultPage(): JSX.Element {
  const params = useParams<{ isbn: string }>();
  const isbn = params.isbn ?? '';
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') ?? undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const registeredQuery = useRegisteredLibraries();
  const availabilityQuery = useBookAvailability(isbn);
  const { save } = useSearchHistoryMutations();
  const registeredLibraries = registeredQuery.data;

  const findResultForIsbn = (
    results: BookAvailability[],
  ): BookAvailability | undefined => results.find((r) => r.isbn === isbn);

  // 検索履歴の保存をISBNごとに1度だけ行うためのガード。
  const savedIsbnRef = useRef<string | null>(null);
  useEffect(() => {
    if (!availabilityQuery.isSuccess) return;
    const results = availabilityQuery.data;
    if (results.length === 0) return;
    const result = findResultForIsbn(results);
    if (result === undefined) return;
    if (savedIsbnRef.current === isbn) return;
    // 登録図書館が未解決のうちは保存しない（次回 effect で保存される）。
    if (registeredLibraries === undefined) return;
    savedIsbnRef.current = isbn;

    // 結果画面は登録分館ごとに statusForLibKey の状態を表示する。履歴も画面と
    // 一致させるため、システム全体の集約ではなく登録分館単位の状態を保存する。
    // キーは分館単位で一意な libraryKey、値は enum名（"available" 等）。
    // API日本語文字列ではなく enum名を使うことで API 仕様変更の影響を受けない。
    const statuses: Record<string, string> = {};
    for (const library of registeredLibraries) {
      const systemStatus = result.libraryStatuses[library.systemId];
      if (systemStatus === undefined) continue;
      statuses[libraryKey(library)] = statusForLibKey(
        systemStatus,
        library.libKey,
      );
    }
    void save({
      isbn,
      searchedAt: new Date(),
      libraryStatuses: statuses,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    availabilityQuery.isSuccess,
    availabilityQuery.data,
    registeredLibraries,
    isbn,
  ]);

  const handleRetry = (): void => {
    void queryClient.invalidateQueries({
      queryKey: ['bookAvailability', isbn],
    });
  };

  const isScan = source === 'scan';

  const isbnSection = (
    <Card>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <BookIcon sx={{ fontSize: 24 }} />
        <Box sx={{ width: 12 }} />
        <Typography variant="body1">{`ISBN: ${isbn}`}</Typography>
      </Box>
    </Card>
  );

  const scanAnotherButton = (
    <Box sx={{ width: '100%' }}>
      <Button
        variant="outlined"
        startIcon={isScan ? <CameraAltIcon /> : <SearchIcon />}
        // 履歴に依存する navigate(-1) は直アクセス時に行き止まりになるため、
        // ラベルと一致する明示的な遷移先に移動する。
        onClick={() => navigate(isScan ? '/scan' : '/isbn-input')}
        sx={{ width: '100%' }}
      >
        {isScan ? '別の本をスキャンする' : '別の本を検索する'}
      </Button>
    </Box>
  );

  const addLibraryButton = (
    <Box sx={{ width: '100%' }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => navigate('/library/add')}
        sx={{ width: '100%' }}
      >
        図書館を登録する
      </Button>
    </Box>
  );

  const errorState = (error: unknown): JSX.Element => (
    <Box sx={{ p: 2 }}>
      {isbnSection}
      <Box sx={{ height: 24 }} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 48, color: APP_COLORS.error }} />
        <Box sx={{ height: 16 }} />
        <Typography>{resolveErrorMessage(error)}</Typography>
        <Box sx={{ height: 16 }} />
        <Button variant="contained" onClick={handleRetry}>
          再試行
        </Button>
      </Box>
      <Box sx={{ height: 24 }} />
      {scanAnotherButton}
    </Box>
  );

  const loadingState = (
    <Box sx={{ p: 2 }}>
      {isbnSection}
      <Box sx={{ height: 24 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
      <Box sx={{ height: 16 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography>蔵書を検索中...</Typography>
      </Box>
    </Box>
  );

  const noLibraryState = (
    <Box sx={{ p: 2 }}>
      {isbnSection}
      <Box sx={{ height: 24 }} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <LocalLibraryIcon sx={{ fontSize: 48, color: APP_COLORS.inactive }} />
        <Box sx={{ height: 16 }} />
        <Typography>図書館が登録されていません</Typography>
        <Box sx={{ height: 8 }} />
        <Typography>図書館を登録すると蔵書を検索できます</Typography>
      </Box>
      <Box sx={{ height: 24 }} />
      {addLibraryButton}
    </Box>
  );

  const resultState = (
    libraries: Library[],
    results: BookAvailability[],
  ): JSX.Element => {
    const result = findResultForIsbn(results);
    return (
      <Box sx={{ p: 2 }}>
        {isbnSection}
        <Box sx={{ height: 24 }} />
        <Typography variant="subtitle1">蔵書状況</Typography>
        <Box sx={{ height: 8 }} />
        {results.length > 0 ? (
          libraries.map((library) => {
            const status = result?.libraryStatuses[library.systemId];
            if (status === undefined) return null;
            return (
              <LibraryAvailabilityCard
                key={libraryKey(library)}
                library={library}
                status={status}
              />
            );
          })
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Typography>検索結果がありません</Typography>
          </Box>
        )}
        <Box sx={{ height: 24 }} />
        {scanAnotherButton}
      </Box>
    );
  };

  const renderBody = (): JSX.Element => {
    if (registeredQuery.isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (registeredQuery.isError) {
      return errorState(registeredQuery.error);
    }

    const libraries = registeredQuery.data ?? [];
    if (libraries.length === 0) {
      return noLibraryState;
    }

    if (availabilityQuery.isLoading) {
      return loadingState;
    }
    if (availabilityQuery.isError) {
      return errorState(availabilityQuery.error);
    }
    return resultState(libraries, availabilityQuery.data ?? []);
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <SubPageAppBar title="検索結果" />
      {renderBody()}
    </Box>
  );
}
