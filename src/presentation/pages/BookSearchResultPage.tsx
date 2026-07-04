import { useEffect, useRef } from 'react';
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
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
import type { UseQueryResult } from '@tanstack/react-query';

import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import { libraryKey } from '@/domain/models/library';
import { statusForLibKey } from '@/domain/models/libraryStatus';
import { resolveErrorMessage } from '@/presentation/utils/errorMessageResolver';
import { useBookAvailability } from '@/presentation/hooks/useBookAvailability';
import { useBookMetadata } from '@/presentation/hooks/useBookMetadata';
import { useRegisteredLibraries } from '@/presentation/hooks/useRegisteredLibraries';
import { useSearchHistoryMutations } from '@/presentation/hooks/useSearchHistory';
import { sortLibrariesByAvailability } from '@/presentation/utils/sortLibrariesByAvailability';
import { BookMetadataCard } from '@/presentation/widgets/BookMetadataCard';
import { LibraryAvailabilityCard } from '@/presentation/widgets/LibraryAvailabilityCard';
import { SubPageAppBar } from '@/presentation/widgets/SubPageAppBar';

/** 書影・タイトルカードに渡す値のまとまり（各状態ビューで共用）。 */
interface MetadataProps {
  title?: string;
  coverUrl?: string;
  isLoading: boolean;
}

function findResultForIsbn(
  results: BookAvailability[],
  isbn: string,
): BookAvailability | undefined {
  return results.find((r) => r.isbn === isbn);
}

/**
 * 検索結果の読み込み完了時に検索履歴を ISBN ごとに1度だけ保存する。
 *
 * 結果画面は登録分館ごとに statusForLibKey の状態を表示するため、履歴も
 * 画面と一致するよう分館単位（キー: libraryKey、値: enum 名）で保存する。
 * enum 名を使うことで Calil API の日本語文字列変更の影響を受けない。
 */
function useSaveHistoryOnResult(
  isbn: string,
  availabilityQuery: UseQueryResult<BookAvailability[]>,
  registeredLibraries: Library[] | undefined,
): void {
  const { save } = useSearchHistoryMutations();
  const savedIsbnRef = useRef<string | null>(null);

  const { isSuccess, data } = availabilityQuery;
  useEffect(() => {
    if (!isSuccess || data === undefined || data.length === 0) return;
    const result = findResultForIsbn(data, isbn);
    if (result === undefined) return;
    if (savedIsbnRef.current === isbn) return;
    // 登録図書館が未解決のうちは保存しない（次回 effect で保存される）。
    if (registeredLibraries === undefined) return;
    savedIsbnRef.current = isbn;

    const statuses: Record<string, string> = {};
    for (const library of registeredLibraries) {
      const systemStatus = result.libraryStatuses[library.systemId];
      if (systemStatus === undefined) continue;
      statuses[libraryKey(library)] = statusForLibKey(
        systemStatus,
        library.libKey,
      );
    }
    save({
      isbn,
      searchedAt: new Date(),
      libraryStatuses: statuses,
    }).catch(() => {
      // 履歴保存は中核機能（蔵書表示）を妨げない範囲で通知する。
      enqueueSnackbar('検索履歴を保存できませんでした', { variant: 'warning' });
    });
    // save（mutateAsync）は React Query が安定参照を保証するため依存に含められる。
  }, [isSuccess, data, registeredLibraries, isbn, save]);
}

function IsbnSection({ isbn }: { isbn: string }): JSX.Element {
  return (
    <Card>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <BookIcon sx={{ fontSize: 24 }} />
        <Typography variant="body1">{`ISBN: ${isbn}`}</Typography>
      </Box>
    </Card>
  );
}

/**
 * 書影・タイトル・Amazon リンク。書影とリンクは ISBN から導出するため、
 * タイトル取得（OpenBD）が失敗・未取得でも常に表示できる。メタデータ取得の
 * 失敗はページ全体のエラー表示には波及させない（中核機能の蔵書状況は無影響）。
 */
function MetadataSection({
  isbn,
  metadata,
}: {
  isbn: string;
  metadata: MetadataProps;
}): JSX.Element {
  return (
    <Box sx={{ mt: 2 }}>
      <BookMetadataCard
        isbn={isbn}
        title={metadata.title}
        openBdCoverUrl={metadata.coverUrl}
        isLoadingTitle={metadata.isLoading}
      />
    </Box>
  );
}

function ScanAnotherButton({ isScan }: { isScan: boolean }): JSX.Element {
  const navigate = useNavigate();
  return (
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
  );
}

function ErrorState({
  isbn,
  metadata,
  error,
  isScan,
  onRetry,
}: {
  isbn: string;
  metadata: MetadataProps;
  error: unknown;
  isScan: boolean;
  onRetry: () => void;
}): JSX.Element {
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
      <IsbnSection isbn={isbn} />
      <MetadataSection isbn={isbn} metadata={metadata} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 3,
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
        <Typography sx={{ mt: 2 }}>{resolveErrorMessage(error)}</Typography>
        <Button variant="contained" onClick={onRetry} sx={{ mt: 2 }}>
          再試行
        </Button>
      </Box>
      <Box sx={{ mt: 3 }}>
        <ScanAnotherButton isScan={isScan} />
      </Box>
    </Box>
  );
}

function LoadingState({
  isbn,
  metadata,
}: {
  isbn: string;
  metadata: MetadataProps;
}): JSX.Element {
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
      <IsbnSection isbn={isbn} />
      <MetadataSection isbn={isbn} metadata={metadata} />
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <CircularProgress />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Typography>蔵書を検索中...</Typography>
      </Box>
    </Box>
  );
}

function NoLibraryState({ isbn }: { isbn: string }): JSX.Element {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
      <IsbnSection isbn={isbn} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 3,
        }}
      >
        <LocalLibraryIcon sx={{ fontSize: 48, color: 'grey.500' }} />
        <Typography sx={{ mt: 2 }}>図書館が登録されていません</Typography>
        <Typography sx={{ mt: 1 }}>
          図書館を登録すると蔵書を検索できます
        </Typography>
      </Box>
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/library/add')}
          sx={{ width: '100%' }}
        >
          図書館を登録する
        </Button>
      </Box>
    </Box>
  );
}

function ResultState({
  isbn,
  metadata,
  libraries,
  results,
  isScan,
}: {
  isbn: string;
  metadata: MetadataProps;
  libraries: Library[];
  results: BookAvailability[];
  isScan: boolean;
}): JSX.Element {
  const result = findResultForIsbn(results, isbn);
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
      <IsbnSection isbn={isbn} />
      <MetadataSection isbn={isbn} metadata={metadata} />
      <Typography variant="subtitle1" sx={{ mt: 3 }}>
        蔵書状況
      </Typography>
      <Box sx={{ mt: 1 }}>
        {results.length > 0 ? (
          sortLibrariesByAvailability(libraries, result).map((library) => {
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
      </Box>
      <Box sx={{ mt: 3 }}>
        <ScanAnotherButton isScan={isScan} />
      </Box>
    </Box>
  );
}

/**
 * 蔵書検索結果画面。
 *
 * 登録図書館を読み込み、ISBN の蔵書状況を表示する。
 * 結果が読み込まれたら検索履歴を1度だけ保存する（useSaveHistoryOnResult）。
 * 表示は状態別コンポーネント（Loading/Error/NoLibrary/Result）に分離している。
 */
export function BookSearchResultPage(): JSX.Element {
  const params = useParams<{ isbn: string }>();
  const isbn = params.isbn ?? '';
  const [searchParams] = useSearchParams();
  const isScan = (searchParams.get('source') ?? undefined) === 'scan';
  const queryClient = useQueryClient();

  const registeredQuery = useRegisteredLibraries();
  const availabilityQuery = useBookAvailability(isbn);
  const metadataQuery = useBookMetadata(isbn);
  useSaveHistoryOnResult(isbn, availabilityQuery, registeredQuery.data);

  const metadata: MetadataProps = {
    title: metadataQuery.data?.title,
    coverUrl: metadataQuery.data?.coverImageUrl,
    isLoading: metadataQuery.isLoading,
  };

  const handleRetry = (): void => {
    void queryClient.invalidateQueries({
      queryKey: ['bookAvailability', isbn],
    });
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
      return (
        <ErrorState
          isbn={isbn}
          metadata={metadata}
          error={registeredQuery.error}
          isScan={isScan}
          onRetry={handleRetry}
        />
      );
    }

    const libraries = registeredQuery.data ?? [];
    if (libraries.length === 0) {
      return <NoLibraryState isbn={isbn} />;
    }

    if (availabilityQuery.isLoading) {
      return <LoadingState isbn={isbn} metadata={metadata} />;
    }
    if (availabilityQuery.isError) {
      return (
        <ErrorState
          isbn={isbn}
          metadata={metadata}
          error={availabilityQuery.error}
          isScan={isScan}
          onRetry={handleRetry}
        />
      );
    }
    return (
      <ResultState
        isbn={isbn}
        metadata={metadata}
        libraries={libraries}
        results={availabilityQuery.data ?? []}
        isScan={isScan}
      />
    );
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <SubPageAppBar title="検索結果" />
      {renderBody()}
    </Box>
  );
}
