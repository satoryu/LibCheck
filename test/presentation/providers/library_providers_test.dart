import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/data/datasources/calil_api_client.dart';
import 'package:libcheck/data/repositories/library_repository_impl.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';

void main() {
  group('library providers', () {
    test('calilApiClientProvider creates CalilApiClient', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final apiClient = container.read(calilApiClientProvider);
      expect(apiClient, isA<CalilApiClient>());
    });

    test('libraryRepositoryProvider creates LibraryRepositoryImpl', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final repository = container.read(libraryRepositoryProvider);
      expect(repository, isA<LibraryRepository>());
      expect(repository, isA<LibraryRepositoryImpl>());
    });
  });
}
