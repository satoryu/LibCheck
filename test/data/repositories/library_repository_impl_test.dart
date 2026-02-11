import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:libcheck/data/datasources/calil_api_client.dart';
import 'package:libcheck/data/repositories/library_repository_impl.dart';
import 'package:libcheck/domain/models/availability_status.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';

void main() {
  group('LibraryRepositoryImpl', () {
    test('implements LibraryRepository', () {
      final mockClient = MockClient((request) async {
        return http.Response('[]', 200);
      });
      final apiClient =
          CalilApiClient(appKey: 'test_api_key', httpClient: mockClient);
      final repo = LibraryRepositoryImpl(apiClient: apiClient);

      expect(repo, isA<LibraryRepository>());
    });

    group('getLibraries', () {
      test('converts LibraryResponse DTOs to Library domain models', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            json.encode([
              {
                'systemid': 'Tokyo_Minato',
                'systemname': '港区図書館',
                'libkey': 'みなと',
                'libid': '123',
                'short': 'みなと図書館',
                'formal': '港区立みなと図書館',
                'url_pc': 'https://example.com',
                'address': '東京都港区芝公園3-2-25',
                'pref': '東京都',
                'city': '港区',
                'tel': '03-1234-5678',
                'geocode': '139.7454,35.6586',
                'category': 'MEDIUM',
              },
            ]),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        });

        final apiClient =
            CalilApiClient(appKey: 'test_api_key', httpClient: mockClient);
        final repo = LibraryRepositoryImpl(apiClient: apiClient);

        final libraries = await repo.getLibraries(pref: '東京都');

        expect(libraries, hasLength(1));
        final lib = libraries[0];
        expect(lib.systemId, 'Tokyo_Minato');
        expect(lib.systemName, '港区図書館');
        expect(lib.formalName, '港区立みなと図書館');
        expect(lib.url, 'https://example.com');
        expect(lib.tel, '03-1234-5678');
        expect(lib.geocode, '139.7454,35.6586');
      });
    });

    group('checkBookAvailability', () {
      test('converts CheckResponse to BookAvailability domain models',
          () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            json.encode({
              'session': 'abc123',
              'continue': 0,
              'books': {
                '9784774142230': {
                  'Tokyo_Minato': {
                    'status': 'OK',
                    'reserveurl': 'https://example.com/reserve',
                    'libkey': {
                      'みなと': '貸出可',
                      '三田': '貸出中',
                    },
                  },
                },
              },
            }),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        });

        final apiClient = CalilApiClient(
          appKey: 'test_api_key',
          httpClient: mockClient,
          pollingInterval: Duration.zero,
        );
        final repo = LibraryRepositoryImpl(apiClient: apiClient);

        final results = await repo.checkBookAvailability(
          isbn: ['9784774142230'],
          systemIds: ['Tokyo_Minato'],
        );

        expect(results, hasLength(1));
        final availability = results[0];
        expect(availability.isbn, '9784774142230');

        final libraryStatus = availability.libraryStatuses['Tokyo_Minato']!;
        expect(libraryStatus.systemId, 'Tokyo_Minato');
        expect(libraryStatus.reserveUrl, 'https://example.com/reserve');
        expect(libraryStatus.libKeyStatuses, {
          'みなと': '貸出可',
          '三田': '貸出中',
        });
        // Aggregated: available (貸出可) has higher priority than checkedOut (貸出中)
        expect(libraryStatus.status, AvailabilityStatus.available);
      });

      test('aggregates statuses correctly with multiple libKeys', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            json.encode({
              'session': 'abc123',
              'continue': 0,
              'books': {
                '9784774142230': {
                  'Tokyo_Minato': {
                    'status': 'OK',
                    'libkey': {
                      'みなと': '貸出中',
                      '三田': '蔵書なし',
                    },
                  },
                },
              },
            }),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        });

        final apiClient = CalilApiClient(
          appKey: 'test_api_key',
          httpClient: mockClient,
          pollingInterval: Duration.zero,
        );
        final repo = LibraryRepositoryImpl(apiClient: apiClient);

        final results = await repo.checkBookAvailability(
          isbn: ['9784774142230'],
          systemIds: ['Tokyo_Minato'],
        );

        final libraryStatus =
            results[0].libraryStatuses['Tokyo_Minato']!;
        // checkedOut (priority 6) > notFound (priority 2)
        expect(libraryStatus.status, AvailabilityStatus.checkedOut);
      });
    });
  });
}
