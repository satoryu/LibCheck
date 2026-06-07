import { useMemo } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

import {
  DependenciesProvider,
  createDefaultDependencies,
} from '@/app/dependencies';
import { createAppRouter } from '@/app/router';
import { makeQueryClient } from '@/queryClient';
import { theme } from '@/theme';
import { SelectedLibrariesProvider } from '@/presentation/hooks/useSelectedLibraries';

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

  return (
    <DependenciesProvider value={dependencies}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider>
            <SelectedLibrariesProvider>
              <RouterProvider router={router} />
            </SelectedLibrariesProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </DependenciesProvider>
  );
}
