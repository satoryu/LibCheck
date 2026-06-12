import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import HistoryIcon from '@mui/icons-material/History';

interface TabDefinition {
  readonly label: string;
  readonly path: string;
  readonly icon: React.ReactNode;
}

const TABS: readonly TabDefinition[] = [
  { label: 'ホーム', path: '/', icon: <HomeIcon /> },
  { label: '図書館', path: '/library', icon: <LocalLibraryIcon /> },
  { label: '履歴', path: '/history', icon: <HistoryIcon /> },
];

/**
 * 3つのタブ（ホーム・図書館・履歴）を持つボトムナビゲーションのシェル。
 *
 * `lib/presentation/pages/app_shell.dart` の移植。
 */
export function AppShell(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();

  const currentIndex = resolveCurrentIndex(location.pathname);

  return (
    <Box sx={{ pb: 7, minHeight: '100vh' }}>
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
