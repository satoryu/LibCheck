import { afterEach, describe, expect, test, vi } from 'vitest';

import { trackEvent } from './gtag';
import {
  trackAmazonAffiliateLinkClick,
  trackBookPreviewView,
  trackBookSearchResultView,
  trackIsbnScanSuccess,
  trackLibraryReservationLinkClick,
  trackTrialCheckResult,
  trackTrialCheckSubmit,
} from './events';

vi.mock('./gtag', () => ({ trackEvent: vi.fn() }));

const trackEventMock = vi.mocked(trackEvent);

/**
 * イベント名・パラメータ名は GA4 側の設定（カスタムディメンション等）と対応するため、
 * 意図しない変更が入ったらテストで気付けるように固定する。
 */
describe('analytics/events', () => {
  afterEach(() => {
    trackEventMock.mockClear();
  });

  test('ISBN 読み取り成功', () => {
    trackIsbnScanSuccess();

    expect(trackEventMock).toHaveBeenCalledWith('isbn_scan_success');
  });

  test('検索結果の表示（蔵書状況の件数を伴う）', () => {
    trackBookSearchResultView({
      searchedLibraryCount: 5,
      holdingLibraryCount: 2,
      availableLibraryCount: 1,
    });

    expect(trackEventMock).toHaveBeenCalledWith('book_search_result_view', {
      searched_library_count: 5,
      holding_library_count: 2,
      available_library_count: 1,
    });
  });

  test('図書館の予約リンクのクリック（ユーザー価値）', () => {
    trackLibraryReservationLinkClick();

    expect(trackEventMock).toHaveBeenCalledWith(
      'library_reservation_link_click',
    );
  });

  test('Amazon アフィリエイトリンクのクリック（収益化）', () => {
    trackAmazonAffiliateLinkClick();

    expect(trackEventMock).toHaveBeenCalledWith('amazon_affiliate_link_click');
  });

  test('体験版の実行（#183）', () => {
    trackTrialCheckSubmit();

    expect(trackEventMock).toHaveBeenCalledWith('trial_check_submit');
  });

  test('体験版の結果（結果の種別と蔵書状況の件数）', () => {
    trackTrialCheckResult('found', { searchedLibraryCount: 3, holdingLibraryCount: 2, availableLibraryCount: 1 });

    expect(trackEventMock).toHaveBeenCalledWith('trial_check_result', {
      outcome: 'found',
      searched_library_count: 3,
      holding_library_count: 2,
      available_library_count: 1,
    });
  });

  test('体験版の結果（上限到達・失敗は件数なし）', () => {
    trackTrialCheckResult('rate_limited');

    expect(trackEventMock).toHaveBeenCalledWith('trial_check_result', { outcome: 'rate_limited' });
  });

  test('未ログインで検索結果ページ（書誌情報のみ）を表示した（#159）', () => {
    trackBookPreviewView();

    expect(trackEventMock).toHaveBeenCalledWith('book_preview_view');
  });
});
