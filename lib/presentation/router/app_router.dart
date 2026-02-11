import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/presentation/pages/home_page.dart';
import 'package:libcheck/presentation/pages/prefecture_selection_page.dart';
import 'package:libcheck/presentation/pages/city_selection_page.dart';
import 'package:libcheck/presentation/pages/library_list_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomePage(),
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
    ],
  );
});
