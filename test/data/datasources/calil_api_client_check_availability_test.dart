import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:libcheck/data/datasources/calil_api_client.dart';
import 'package:libcheck/data/exceptions/calil_api_exception.dart';

void main() {
  group('CalilApiClient.checkAvailability', () {
    test('returns result immediately when continue=0', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.path, '/check');
        expect(request.url.queryParameters['isbn'], '9784774142230');
        expect(request.url.queryParameters['systemid'], 'Tokyo_Minato');

        return http.Response(
          json.encode({
            'session': 'abc123',
            'continue': 0,
            'books': {
              '9784774142230': {
                'Tokyo_Minato': {
                  'status': 'OK',
                  'reserveurl': 'https://example.com/reserve',
                  'libkey': {'みなと': '貸出可'},
                },
              },
            },
          }),
          200,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      });

      final client = CalilApiClient(
        appKey: 'test_api_key',
        httpClient: mockClient,
        pollingInterval: Duration.zero,
      );
      final result = await client.checkAvailability(
        isbn: ['9784774142230'],
        systemIds: ['Tokyo_Minato'],
      );

      expect(result.session, 'abc123');
      expect(result.continueFlag, 0);
      expect(result.books['9784774142230']!['Tokyo_Minato']!.libKeys['みなと'],
          '貸出可');
    });

    test('polls until continue=0', () async {
      var requestCount = 0;

      final mockClient = MockClient((request) async {
        requestCount++;

        if (requestCount == 1) {
          return http.Response(
            json.encode({
              'session': 'abc123',
              'continue': 1,
              'books': {
                '9784774142230': {
                  'Tokyo_Minato': {
                    'status': 'Running',
                    'libkey': <String, dynamic>{},
                  },
                },
              },
            }),
            200,
          );
        }

        // Second request should use session parameter
        expect(request.url.queryParameters['session'], 'abc123');

        return http.Response(
          json.encode({
            'session': 'abc123',
            'continue': 0,
            'books': {
              '9784774142230': {
                'Tokyo_Minato': {
                  'status': 'OK',
                  'libkey': {'みなと': '貸出可'},
                },
              },
            },
          }),
          200,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      });

      final client = CalilApiClient(
        appKey: 'test_api_key',
        httpClient: mockClient,
        pollingInterval: Duration.zero,
      );
      final result = await client.checkAvailability(
        isbn: ['9784774142230'],
        systemIds: ['Tokyo_Minato'],
      );

      expect(requestCount, 2);
      expect(result.continueFlag, 0);
      expect(result.books['9784774142230']!['Tokyo_Minato']!.libKeys['みなと'],
          '貸出可');
    });

    test('throws CalilTimeoutException when max polling exceeded', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          json.encode({
            'session': 'abc123',
            'continue': 1,
            'books': {
              '9784774142230': {
                'Tokyo_Minato': {
                  'status': 'Running',
                  'libkey': <String, dynamic>{},
                },
              },
            },
          }),
          200,
        );
      });

      final client = CalilApiClient(
        appKey: 'test_api_key',
        httpClient: mockClient,
        pollingInterval: Duration.zero,
        maxPollingCount: 2,
      );

      expect(
        () => client.checkAvailability(
          isbn: ['9784774142230'],
          systemIds: ['Tokyo_Minato'],
        ),
        throwsA(isA<CalilTimeoutException>()),
      );
    });

    test('joins multiple ISBNs and systemIds with commas', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.queryParameters['isbn'],
            '9784774142230,9784873115658');
        expect(request.url.queryParameters['systemid'],
            'Tokyo_Minato,Tokyo_Shibuya');

        return http.Response(
          json.encode({
            'session': 'abc123',
            'continue': 0,
            'books': <String, dynamic>{},
          }),
          200,
        );
      });

      final client = CalilApiClient(
        appKey: 'test_api_key',
        httpClient: mockClient,
        pollingInterval: Duration.zero,
      );
      await client.checkAvailability(
        isbn: ['9784774142230', '9784873115658'],
        systemIds: ['Tokyo_Minato', 'Tokyo_Shibuya'],
      );
    });

    test('throws CalilNetworkException on network error', () async {
      final mockClient = MockClient((request) async {
        throw http.ClientException('Connection refused');
      });

      final client = CalilApiClient(
        appKey: 'test_api_key',
        httpClient: mockClient,
      );

      expect(
        () => client.checkAvailability(
          isbn: ['9784774142230'],
          systemIds: ['Tokyo_Minato'],
        ),
        throwsA(isA<CalilNetworkException>()),
      );
    });

    test('throws CalilParseException on invalid JSON', () async {
      final mockClient = MockClient((request) async {
        return http.Response('not valid json', 200);
      });

      final client = CalilApiClient(
        appKey: 'test_api_key',
        httpClient: mockClient,
      );

      expect(
        () => client.checkAvailability(
          isbn: ['9784774142230'],
          systemIds: ['Tokyo_Minato'],
        ),
        throwsA(isA<CalilParseException>()),
      );
    });
  });
}
