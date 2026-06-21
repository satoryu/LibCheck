import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import HistoryIcon from '@mui/icons-material/History';

import { AuthButton } from '@/presentation/widgets/AuthButton';

interface TabDefinition {
  readonly label: string;
  readonly path: string;
  readonly icon: React.ReactNode;
  /** 上部バーに表示するタイトル。 */
  readonly title: string;
}

const TABS: readonly TabDefinition[] = [
  { label: 'ホーム', path: '/', icon: <HomeIcon />, title: 'LibCheck' },
  { label: '図書館', path: '/library', icon: <LocalLibraryIcon />, title: '登録図書館' },
  { label: '履歴', path: '/history', icon: <HistoryIcon />, title: '検索履歴' },
];

/**
 * 3つのタブ（ホーム・図書館・履歴）を持つシェル。
 *
 * 上部に共通の AppBar（タブごとのタイトル + 右上にアカウント/ログイン）、
 * 下部に BottomNavigation を配置する。`lib/presentation/pages/app_shell.dart`
 * の移植 + 共通上部バーの追加。
 */
export function AppShell(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();

  const currentIndex = resolveCurrentIndex(location.pathname);
  const title = TABS[currentIndex]?.title ?? 'LibCheck';

  return (
    <Box sx={{ pb: 7, minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <AuthButton />
        </Toolbar>
      </AppBar>
      <Outlet />
      <Paper
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={currentIndex}
          onChange={(_event, newIndex: number) => {
            const tab = TABS[newIndex];
            if (tab) {
              navigate(tab.path);
            }
          }}
        >
          {TABS.map((tab) => (
            <BottomNavigationAction
              key={tab.path}
              label={tab.label}
              icon={tab.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

function resolveCurrentIndex(pathname: string): number {
  if (pathname === '/' || pathname === '') {
    return 0;
  }
  if (pathname.startsWith('/library')) {
    return 1;
  }
  if (pathname.startsWith('/history')) {
    return 2;
  }
  return 0;
}
