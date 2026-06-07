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
 */
export function resolveErrorMessage(error: unknown): string {
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
