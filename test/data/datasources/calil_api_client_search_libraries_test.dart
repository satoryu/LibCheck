import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:libcheck/data/datasources/calil_api_client.dart';
import 'package:libcheck/data/exceptions/calil_api_exception.dart';

void main() {
  group('CalilApiClient.searchLibraries', () {
    test('returns list of LibraryResponse on success', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.path, '/library');
        expect(request.url.queryParameters['appkey'], 'test_api_key');
        expect(request.url.queryParameters['pref'], '東京都');
        expect(request.url.queryParameters['format'], 'json');

        return http.Response(
          json.encode([
            {
              'systemid': 'Tokyo_Minato',
              'systemname': '港区図書館',
              'libkey': 'みなと',
              'libid': '123',
              'short': 'みなと図書館',
              'formal': '港区立みなと図書館',
              'address': '東京都港区芝公園3-2-25',
              'pref': '東京都',
              'city': '港区',
              'category': 'MEDIUM',
            },
          ]),
          200,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      });

      final client =
          CalilApiClient(appKey: 'test_api_key', httpClient: mockClient);
      final results = await client.searchLibraries(pref: '東京都');

      expect(results, hasLength(1));
      expect(results[0].systemId, 'Tokyo_Minato');
      expect(results[0].formalName, '港区立みなと図書館');
    });

    test('passes city parameter when provided', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.queryParameters['city'], '港区');

        return http.Response(json.encode([]), 200);
      });

      final client =
          CalilApiClient(appKey: 'test_api_key', httpClient: mockClient);
      await client.searchLibraries(pref: '東京都', city: '港区');
    });

    test('throws CalilHttpException on non-200 status', () async {
      final mockClient = MockClient((request) async {
        return http.Response('Internal Server Error', 500);
      });

      final client =
          CalilApiClient(appKey: 'test_api_key', httpClient: mockClient);

      expect(
        () => client.searchLibraries(pref: '東京都'),
        throwsA(isA<CalilHttpException>()),
      );
    });

  });
}
