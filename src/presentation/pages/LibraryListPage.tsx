import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import { libraryKey } from '@/domain/models/library';
import type { Library } from '@/domain/models/library';
import { useAuth } from '@/presentation/auth/AuthProvider';
import { usePrefectureLibraries } from '@/presentation/hooks/usePrefectureLibraries';
import { useRegisteredLibraryMutations } from '@/presentation/hooks/useRegisteredLibraries';
import { useSelectedLibraries } from '@/presentation/hooks/useSelectedLibraries';
import { ErrorStateWidget } from '@/presentation/widgets/ErrorStateWidget';
import {
  APP_SUMMARY,
  buildCityPageContent,
  regionBreadcrumbs,
} from '@/presentation/regionPage/regionPageContent';
import { PublicPageIntro } from '@/presentation/widgets/PublicPageIntro';
import { RegionPageHeader } from '@/presentation/widgets/RegionPageHeader';
import { RegisterLoginDialog } from '@/presentation/widgets/RegisterLoginDialog';
import { SubPageAppBar } from '@/presentation/widgets/SubPageAppBar';

/**
 * 図書館一覧画面。
 *
 * `lib/presentation/pages/library_list_page.dart` の移植。
 * チェックボックスで図書館を選択し、登録ボタンで一括登録する。
 *
 * #182: 地域ページとして h1・パンくず・同じ都道府県の他の市区町村へのリンクを
 * 持つ。文言は配信 HTML と同じ regionPageContent.ts から取る。
 */
export function LibraryListPage(): JSX.Element {
  const params = useParams<{ pref: string; city: string }>();
  const pref = params.pref ?? '';
  const city = params.city ?? '';
  const navigate = useNavigate();
  const { user } = useAuth();

  // 館数・他の市区町村も出すため、都道府県単位で取得して絞り込む。
  const prefectureQuery = usePrefectureLibraries(pref);
  const prefectureLibraries = prefectureQuery.data;
  const libraries = useMemo(
    () => (prefectureLibraries ?? []).filter((library) => library.city === city),
    [prefectureLibraries, city],
  );
  const content =
    prefectureLibraries === undefined
      ? null
      : buildCityPageContent(pref, city, prefectureLibraries);
  const { selected, isSelected, toggle, clear } = useSelectedLibraries();
  const { addAll } = useRegisteredLibraryMutations();

  // 未ログインで登録を試みたときに開くログインダイアログの状態。
  // true の間にログインが完了したら、選び直しなしで登録を自動続行する。
  const [pendingRegister, setPendingRegister] = useState(false);

  // 選択状態はこの市区町村の一覧での一時的なもの。pref/city が変わったとき
  // （初回マウント含む）に必ずクリアし、別の街の選択が持ち越されて誤登録
  // されるのを防ぐ。同一ルートでパラメータだけ変わる遷移ではアンマウント
  // されないため、アンマウントではなく pref/city 依存でクリアする。
  // ログインダイアログを開いたまま別の街へ遷移した場合、選択が空のまま
  // ログイン完了時に登録が走ってしまうのを避けるため、ダイアログも閉じる。
  useEffect(() => {
    clear();
    setPendingRegister(false);
  }, [pref, city, clear]);

  const registerSelected = async (libraries: Library[]): Promise<void> => {
    await addAll(libraries);
    clear();
    enqueueSnackbar('図書館を登録しました');
    // 登録完了後は登録図書館の管理画面へ遷移し、登録結果を確認できるようにする。
    navigate('/library');
  };

  const handleRegister = async (): Promise<void> => {
    if (selected.length === 0) return;

    // この画面は #158 で未ログインでも閲覧できるようになったが、登録は
    // サーバ側が引き続き認証必須（#89）。以前は navigate('/') でランディング
    // へ丸ごと遷移し選択状態を破棄していたが、選び直しを強いる離脱要因に
    // なっていたため、選択を保持したままその場でログインするダイアログを
    // 開く形に変更した（#167）。ログイン完了は下の useEffect で検知する。
    //
    // 既知のトレードオフ: AuthProvider はセッション復元完了まで一瞬 user が
    // null を返す（#163 と同種のタイミング）。ログイン済みユーザーが
    // コールドロード直後・復元完了前に登録を押すと、このダイアログが一瞬
    // 開いてから下の useEffect で自動的に登録・遷移する（結果は正しいが
    // ダイアログが一瞬見える）。復元用のグローバルな isRestoring フラグを
    // AuthProvider に追加すれば防げるが、影響範囲が全消費者に及ぶ割に
    // 実際の発生条件（一覧の読み込み完了前に選択・登録まで完了する速さ）が
    // 極めて狭いため、今回は許容する（#167 レビューで検討済み）。
    if (user === null) {
      setPendingRegister(true);
      return;
    }

    await registerSelected([...selected]);
  };

  // ログインダイアログを開いた後にログインが完了したら、選択していた図書館
  // をそのまま登録して続行する。
  useEffect(() => {
    if (!pendingRegister || user === null) return;
    setPendingRegister(false);
    void registerSelected([...selected]);
    // ログイン完了の瞬間の selected で1回だけ登録する。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pendingRegister]);

  const renderBody = (): JSX.Element => {
    if (prefectureQuery.isLoading) {
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
          {/* カーリルAPIの規約上、APIで取得した図書館名を表示する画面には
              カーリルへのリンクが必要（#156）。各行は選択用の ListItemButton
              であり内側に <a> を置くと不正な入れ子になるため、一覧単位の
              帰属表示でリンクを担保する。 */}
          {libraries.length > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', px: 2, pb: 1 }}
            >
              図書館情報の提供:{' '}
              <Link href="https://calil.jp/" target="_blank" rel="noopener noreferrer">
                カーリル
              </Link>
            </Typography>
          )}
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
      {/* 文言は配信 HTML の meta description と同じ（regionPageContent.ts）。 */}
      <PublicPageIntro
        description={content?.kind === 'city' ? content.description : APP_SUMMARY}
      />
      <RegionPageHeader
        breadcrumbs={regionBreadcrumbs(pref, city)}
        heading={content?.h1 ?? `${pref}${city}の図書館`}
      />
      {renderBody()}
      {content?.kind === 'city' && content.otherCities.length > 0 && (
        <Box component="section" sx={{ px: 2, pb: 3 }}>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
            {`${pref}の他の市区町村`}
          </Typography>
          <Box
            component="ul"
            sx={{ listStyle: 'none', p: 0, m: 0, mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}
          >
            {content.otherCities.map((other) => (
              <li key={other.path}>
                <Link component={RouterLink} to={other.path} variant="body2">
                  {`${other.name}（${other.libraryCount}館）`}
                </Link>
              </li>
            ))}
          </Box>
        </Box>
      )}
      <RegisterLoginDialog
        open={pendingRegister}
        libraries={selected}
        onClose={() => setPendingRegister(false)}
      />
    </Box>
  );
}
