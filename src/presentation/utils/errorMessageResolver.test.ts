import { describe, it, expect } from 'vitest';

import {
  CalilHttpException,
  CalilNetworkException,
  CalilParseException,
  CalilTimeoutException,
} from '@/data/exceptions/calilApiException';
import { resolveErrorMessage } from '@/presentation/utils/errorMessageResolver';

describe('resolveErrorMessage', () => {
  describe('オンライン時（従来どおりエラー種別ごとのメッセージ）', () => {
    it('CalilNetworkException', () => {
      expect(resolveErrorMessage(new CalilNetworkException('x'), true)).toBe(
        'インターネット接続を確認してください',
      );
    });
    it('CalilTimeoutException', () => {
      expect(resolveErrorMessage(new CalilTimeoutException('x'), true)).toBe(
        '応答に時間がかかっています。再度お試しください',
      );
    });
    it('CalilHttpException', () => {
      expect(resolveErrorMessage(new CalilHttpException('x', 500), true)).toBe(
        'サーバーとの通信に失敗しました',
      );
    });
    it('CalilParseException', () => {
      expect(resolveErrorMessage(new CalilParseException('x'), true)).toBe(
        'データの読み取りに失敗しました',
      );
    });
    it('不明なエラー', () => {
      expect(resolveErrorMessage(new Error('x'), true)).toBe(
        'エラーが発生しました',
      );
    });
  });

  describe('オフライン時（#145: エラー種別によらずオフライン専用メッセージ）', () => {
    it('通信系の例外はすべて「オフラインです」に一本化される', () => {
      const offlineMessage = 'オフラインです。接続を確認してください';
      expect(resolveErrorMessage(new CalilNetworkException('x'), false)).toBe(
        offlineMessage,
      );
      expect(resolveErrorMessage(new CalilTimeoutException('x'), false)).toBe(
        offlineMessage,
      );
      expect(resolveErrorMessage(new CalilHttpException('x', 500), false)).toBe(
        offlineMessage,
      );
      expect(resolveErrorMessage(new Error('x'), false)).toBe(offlineMessage);
    });
  });

  describe('isOnline 省略時', () => {
    it('navigator.onLine（テスト環境では true）を既定値として使う', () => {
      expect(resolveErrorMessage(new CalilNetworkException('x'))).toBe(
        'インターネット接続を確認してください',
      );
    });
  });
});
