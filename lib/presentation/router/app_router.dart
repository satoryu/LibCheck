import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/presentation/pages/app_shell.dart';
import 'package:libcheck/presentation/pages/barcode_scanner_page.dart';
import 'package:libcheck/presentation/pages/book_search_result_page.dart';
import 'package:libcheck/presentation/pages/home_page.dart';
import 'package:libcheck/presentation/pages/library_management_page.dart';
import 'package:libcheck/presentation/pages/history_placeholder_page.dart';
import 'package:libcheck/presentation/pages/prefecture_selection_page.dart';
import 'package:libcheck/presentation/pages/city_selection_page.dart';
import 'package:libcheck/presentation/pages/library_list_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                builder: (context, state) => const HomePage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/library',
                builder: (context, state) =>
                    const LibraryManagementPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/history',
                builder: (context, state) =>
                    const HistoryPlaceholderPage(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/library/add',
        builder: (context, state) => const PrefectureSelectionPage(),
      ),
      GoRoute(
        path: '/library/add/:pref',
        builder: (context, state) {
          final pref = state.pathParameters['pref']!;
          return CitySelectionPage(prefecture: pref);
        },
      ),
      GoRoute(
        path: '/library/add/:pref/:city',
        builder: (context, state) {
          final pref = state.pathParameters['pref']!;
          final city = state.pathParameters['city']!;
          return LibraryListPage(prefecture: pref, city: city);
        },
      ),
      GoRoute(
        path: '/scan',
        builder: (context, state) => const BarcodeScannerPage(),
      ),
      GoRoute(
        path: '/result/:isbn',
        builder: (context, state) {
          final isbn = state.pathParameters['isbn']!;
          return BookSearchResultPage(isbn: isbn);
        },
      ),
    ],
  );
});
