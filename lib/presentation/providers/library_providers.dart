import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import 'package:libcheck/data/datasources/calil_api_client.dart';
import 'package:libcheck/data/datasources/calil_api_config.dart';
import 'package:libcheck/data/repositories/library_repository_impl.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';

final httpClientProvider = Provider<http.Client>((ref) => http.Client());

final calilApiClientProvider = Provider<CalilApiClient>((ref) {
  final httpClient = ref.watch(httpClientProvider);
  return CalilApiClient(
    appKey: CalilApiConfig.appKey,
    httpClient: httpClient,
  );
});

final libraryRepositoryProvider = Provider<LibraryRepository>((ref) {
  final apiClient = ref.watch(calilApiClientProvider);
  return LibraryRepositoryImpl(apiClient: apiClient);
});
