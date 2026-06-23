import { useMemo } from 'react';
import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { GoogleOAuthProvider } from '@react-oauth/google';

import {
  DependenciesProvider,
  createDefaultDependencies,
} from '@/app/dependencies';
import { createAppRouter } from '@/app/router';
import { makeQueryClient } from '@/queryClient';
import { theme } from '@/theme';
import { SelectedLibrariesProvider } from '@/presentation/hooks/useSelectedLibraries';
import { AuthProvider } from '@/presentation/auth/AuthProvider';
import { AuthGate } from '@/presentation/auth/AuthGate';
import { googleClientId } from '@/data/datasources/authConfig';

/**
 * Root application component.
 *
 * Composes the provider tree in the exact order required by the migration
 * spec:
 *   DependenciesProvider
 *     > QueryClientProvider
 *       > ThemeProvider + CssBaseline
 *         > SnackbarProvider
 *           > SelectedLibrariesProvider
 *             > RouterProvider
 */
export function App() {
  const dependencies = useMemo(() => createDefaultDependencies(), []);
  const queryClient = useMemo(() => makeQueryClient(), []);
  const router = useMemo(() => createAppRouter(), []);
  const clientId = googleClientId();

  const routedTree = (
    <AuthGate>
      <SelectedLibrariesProvider>
        <RouterProvider router={router} />
      </SelectedLibrariesProvider>
    </AuthGate>
  );

  return (
    <DependenciesProvider value={dependencies}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/* モバイル幅では画面下部固定の BottomNavigation とスナックバーが
              重なってタブのタップをブロックするため、上部に表示する。
              さらに AppBar(56px) のタイトル・戻る・フラッシュの各ボタンを
              覆わないよう、表示位置を AppBar の直下までオフセットする。 */}
          <GlobalStyles
            styles={{
              '.notistack-SnackbarContainer': { top: '64px !important' },
            }}
          />
          <SnackbarProvider
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <AuthProvider>
              {/* クライアント ID がある場合のみ GIS を有効化（無い/モック時は
                  AuthButton 側でログインUIを出さない or モックに切替）。 */}
              {clientId.length > 0 ? (
                <GoogleOAuthProvider clientId={clientId}>
                  {routedTree}
                </GoogleOAuthProvider>
              ) : (
                routedTree
              )}
            </AuthProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </DependenciesProvider>
  );
}
