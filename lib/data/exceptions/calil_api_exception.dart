abstract class CalilApiException implements Exception {
  final String message;
  const CalilApiException(this.message);

  @override
  String toString() => '$runtimeType: $message';
}

class CalilNetworkException extends CalilApiException {
  const CalilNetworkException(super.message);
}

class CalilHttpException extends CalilApiException {
  final int statusCode;
  const CalilHttpException(super.message, {required this.statusCode});
}

class CalilParseException extends CalilApiException {
  const CalilParseException(super.message);
}

class CalilTimeoutException extends CalilApiException {
  const CalilTimeoutException(super.message);
}
