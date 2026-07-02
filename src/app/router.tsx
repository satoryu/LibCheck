import {
  Navigate,
  createBrowserRouter,
  type RouteObject,
} from 'react-router-dom';

import { AppShell } from '@/presentation/pages/AppShell';
import { RouteErrorFallback } from '@/presentation/widgets/AppErrorBoundary';
import { HomePage } from '@/presentation/pages/HomePage';
import { LibraryManagementPage } from '@/presentation/pages/LibraryManagementPage';
import { SearchHistoryPage } from '@/presentation/pages/SearchHistoryPage';
import { PrefectureSelectionPage } from '@/presentation/pages/PrefectureSelectionPage';
import { CitySelectionPage } from '@/presentation/pages/CitySelectionPage';
import { LibraryListPage } from '@/presentation/pages/LibraryListPage';
import { BarcodeScannerPage } from '@/presentation/pages/BarcodeScannerPage';
import { IsbnInputPage } from '@/presentation/pages/IsbnInputPage';
import { BookSearchResultPage } from '@/presentation/pages/BookSearchResultPage';

/**
 * Route table mirroring `lib/presentation/router/app_router.dart`.
 *
 * The three tabbed pages (`/`, `/library`, `/history`) share the `<AppShell>`
 * layout (MUI BottomNavigation). The empty-registered-libraries redirect that
 * the Flutter router performed in its top-level `redirect` callback is handled
 * inside `HomePage` (it renders `<Navigate to="/library" replace/>` once the
 * registered libraries query resolves to an empty list).
 *
 * The `routes` array is exported so tests can build a `createMemoryRouter`.
 */
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/library', element: <LibraryManagementPage /> },
      { path: '/history', element: <SearchHistoryPage /> },
    ],
  },
  { path: '/library/add', element: <PrefectureSelectionPage /> },
  { path: '/library/add/:pref', element: <CitySelectionPage /> },
  { path: '/library/add/:pref/:city', element: <LibraryListPage /> },
  { path: '/scan', element: <BarcodeScannerPage /> },
  { path: '/isbn-input', element: <IsbnInputPage /> },
  { path: '/result/:isbn', element: <BookSearchResultPage /> },
  // Mirror the Dart redirect for an empty `:isbn` (path param cannot actually
  // be empty in react-router, but keep an explicit fallback to `/`).
  { path: '/result', element: <Navigate to="/" replace /> },
];

export function createAppRouter() {
  // 全ルートを pathless な親で包み、ルート描画中の例外を errorElement で受ける
  // （白画面回避。#117）。URL 構造は変わらない。
  return createBrowserRouter([
    { errorElement: <RouteErrorFallback />, children: routes },
  ]);
}
