import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'package:libcheck/data/datasources/calil_api_config.dart';
import 'package:libcheck/data/exceptions/calil_api_exception.dart';
import 'package:libcheck/data/models/check_response.dart';
import 'package:libcheck/data/models/library_response.dart';

class CalilApiClient {
  CalilApiClient({
    required String appKey,
    http.Client? httpClient,
    Duration? pollingInterval,
    int? maxPollingCount,
  })  : _appKey = appKey,
        _httpClient = httpClient ?? http.Client(),
        _pollingInterval = pollingInterval ?? CalilApiConfig.pollingInterval,
        _maxPollingCount = maxPollingCount ?? CalilApiConfig.maxPollingCount;

  final String _appKey;
  final http.Client _httpClient;
  final Duration _pollingInterval;
  final int _maxPollingCount;

  Future<List<LibraryResponse>> searchLibraries({
    required String pref,
    String? city,
  }) async {
    final queryParams = {
      'appkey': _appKey,
      'pref': pref,
      'format': 'json',
      if (city != null) 'city': city,
    };

    final uri =
        Uri.parse('${CalilApiConfig.baseUrl}/library').replace(queryParameters: queryParams);

    final response = await _executeRequest(uri);
    final body = _parseJson(response.body);

    if (body is! List) {
      throw const CalilParseException('Expected JSON array for /library response');
    }

    return body
        .cast<Map<String, dynamic>>()
        .map((json) => LibraryResponse.fromJson(json))
        .toList();
  }

  Future<CheckResponse> checkAvailability({
    required List<String> isbn,
    required List<String> systemIds,
  }) async {
    final queryParams = {
      'appkey': _appKey,
      'isbn': isbn.join(','),
      'systemid': systemIds.join(','),
      'format': 'json',
    };

    final uri =
        Uri.parse('${CalilApiConfig.baseUrl}/check').replace(queryParameters: queryParams);

    var response = await _executeRequest(uri);
    var checkResponse = _parseCheckResponse(response.body);

    var pollCount = 0;
    while (checkResponse.continueFlag == 1 && pollCount < _maxPollingCount) {
      await Future.delayed(_pollingInterval);
      pollCount++;

      final pollParams = {
        'appkey': _appKey,
        'session': checkResponse.session,
        'format': 'json',
      };
      final pollUri =
          Uri.parse('${CalilApiConfig.baseUrl}/check').replace(queryParameters: pollParams);

      response = await _executeRequest(pollUri);
      checkResponse = _parseCheckResponse(response.body);
    }

    if (checkResponse.continueFlag == 1) {
      throw CalilTimeoutException(
        'Polling exceeded maximum count of $_maxPollingCount',
      );
    }

    return checkResponse;
  }

  Future<http.Response> _executeRequest(Uri uri) async {
    try {
      final response = await _httpClient
          .get(uri)
          .timeout(CalilApiConfig.httpTimeout);

      if (response.statusCode != 200) {
        throw CalilHttpException(
          'HTTP ${response.statusCode}: ${response.reasonPhrase}',
          statusCode: response.statusCode,
        );
      }

      return response;
    } on CalilApiException {
      rethrow;
    } on SocketException catch (e) {
      throw CalilNetworkException('Network error: ${e.message}');
    } on http.ClientException catch (e) {
      throw CalilNetworkException('Client error: ${e.message}');
    }
  }

  dynamic _parseJson(String body) {
    try {
      return json.decode(body);
    } on FormatException catch (e) {
      throw CalilParseException('Invalid JSON: ${e.message}');
    }
  }

  CheckResponse _parseCheckResponse(String body) {
    final parsed = _parseJson(body);
    if (parsed is! Map<String, dynamic>) {
      throw const CalilParseException('Expected JSON object for /check response');
    }
    return CheckResponse.fromJson(parsed);
  }
}
