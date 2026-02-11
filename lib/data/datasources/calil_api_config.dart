class CalilApiConfig {
  static const String appKey = String.fromEnvironment(
    'CALIL_APP_KEY',
    defaultValue: '',
  );

  static const String baseUrl = 'https://api.calil.jp';
  static const Duration pollingInterval = Duration(seconds: 2);
  static const int maxPollingCount = 30;
  static const Duration httpTimeout = Duration(seconds: 10);
}
