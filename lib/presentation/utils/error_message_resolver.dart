import 'package:libcheck/data/exceptions/calil_api_exception.dart';

class ErrorMessageResolver {
  static String resolve(Object error) {
    return switch (error) {
      CalilNetworkException() => 'インターネット接続を確認してください',
      CalilTimeoutException() => '応答に時間がかかっています。再度お試しください',
      CalilHttpException() => 'サーバーとの通信に失敗しました',
      CalilParseException() => 'データの読み取りに失敗しました',
      _ => 'エラーが発生しました',
    };
  }
}
