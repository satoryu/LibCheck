import { trackEvent } from '@/analytics/gtag';

/**
 * アプリで計測するイベントの定義（#169）。
 *
 * GA4 のイベント名・パラメータ名を知っているのはこのファイルだけにし、UI からは
 * 意味のある関数名だけを呼ぶ（GA4 固有の処理を UI 全体に散在させないため）。
 *
 * 初期実装では「ユーザー価値（図書館の予約導線）」と「収益化（Amazon）」を
 * 別イベントとして分け、混ぜずに追えるようにしている。
 * ISBN・書名・図書館名など高カーディナリティな値は送らない。
 */

/** `book_search_result_view` に付与する蔵書状況の件数（分館単位）。 */
export interface LibraryAvailabilityCounts {
  /** 検索対象となった図書館数（登録分館数）。 */
  searchedLibraryCount: number;
  /** 蔵書が見つかった図書館数。 */
  holdingLibraryCount: number;
  /** 現在貸出可能な図書館数。 */
  availableLibraryCount: number;
}

/** カメラで ISBN を読み取れた（ファネルの入口）。 */
export function trackIsbnScanSuccess(): void {
  trackEvent('isbn_scan_success');
}

/** 書籍情報と登録図書館の蔵書状況を確認できる状態になった。 */
export function trackBookSearchResultView(
  counts: LibraryAvailabilityCounts,
): void {
  trackEvent('book_search_result_view', {
    searched_library_count: counts.searchedLibraryCount,
    holding_library_count: counts.holdingLibraryCount,
    available_library_count: counts.availableLibraryCount,
  });
}

/**
 * 未ログインで検索結果ページを開き、書誌情報と案内（蔵書状況なし）を表示した（#159）。
 * 共有された URL から来た人の数を測る。蔵書状況を確認できる状態ではないため、
 * `book_search_result_view` とは別のイベントにする。
 */
export function trackBookPreviewView(): void {
  trackEvent('book_preview_view');
}

/** 図書館の予約・蔵書検索サイトへ遷移した（現時点の主要な価値到達イベント）。 */
export function trackLibraryReservationLinkClick(): void {
  trackEvent('library_reservation_link_click');
}

/** Amazon アソシエイトリンクへ遷移した（収益化側の指標）。 */
export function trackAmazonAffiliateLinkClick(): void {
  trackEvent('amazon_affiliate_link_click');
}

/** 体験版（#183）の結果の種別。 */
export type TrialCheckOutcome = 'found' | 'not_found' | 'rate_limited' | 'error';

/** 地域ページの体験版（ログインなしの蔵書確認）を実行した。 */
export function trackTrialCheckSubmit(): void {
  trackEvent('trial_check_submit');
}

/**
 * 体験版の結果が出た。`found` / `not_found` は蔵書状況の件数を伴う。
 * 体験版 → 図書館の登録（既存のファネル）への到達を評価するために使う。
 */
export function trackTrialCheckResult(
  outcome: TrialCheckOutcome,
  counts?: LibraryAvailabilityCounts,
): void {
  trackEvent('trial_check_result', {
    outcome,
    ...(counts && {
      searched_library_count: counts.searchedLibraryCount,
      holding_library_count: counts.holdingLibraryCount,
      available_library_count: counts.availableLibraryCount,
    }),
  });
}
