import { afterEach, describe, expect, test, vi } from 'vitest';

import { trackEvent } from './gtag';
import {
  trackAmazonAffiliateLinkClick,
  trackBookSearchResultView,
  trackIsbnScanSuccess,
  trackLibraryReservationLinkClick,
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
});
