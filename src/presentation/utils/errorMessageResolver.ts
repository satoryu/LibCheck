import {
  CalilHttpException,
  CalilNetworkException,
  CalilParseException,
  CalilTimeoutException,
} from '@/data/exceptions/calilApiException';

/**
 * エラーの種類に応じたユーザー向けメッセージを返す。
 *
 * `lib/presentation/utils/error_message_resolver.dart` の移植。
 *
 * `isOnline` が false（オフライン）のときは、エラーの種類によらず
 * オフライン専用メッセージに一本化する（#145）。オフライン中は通信系の
 * 例外だけでなくあらゆる失敗が「繋がっていないこと」に起因するため、
 * サーバー障害等の一般的なエラーメッセージと区別してユーザーに伝える。
 * 省略時は `navigator.onLine` を用いる。
 */
export function resolveErrorMessage(
  error: unknown,
  isOnline: boolean = navigator.onLine,
): string {
  if (!isOnline) {
    return 'オフラインです。接続を確認してください';
  }
  if (error instanceof CalilNetworkException) {
    return 'インターネット接続を確認してください';
  }
  if (error instanceof CalilTimeoutException) {
    return '応答に時間がかかっています。再度お試しください';
  }
  if (error instanceof CalilHttpException) {
    return 'サーバーとの通信に失敗しました';
  }
  if (error instanceof CalilParseException) {
    return 'データの読み取りに失敗しました';
  }
  return 'エラーが発生しました';
}
