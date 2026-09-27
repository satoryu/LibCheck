# 要件: Google Identity Services 内部の例外を Sentry 送信から除外する（#179）

## Problem Statement

Sentry に Google Identity Services（GIS, `https://accounts.google.com/gsi/client`）内部の例外が記録されている。

| Issue | メッセージ | 件数 | 環境 |
|---|---|---|---|
| [LIBCHECK-5](https://sato-ryu.sentry.io/issues/LIBCHECK-5) | `Error: pa` | 4 | Windows Chrome 117 / tz UTC / US / libcheck.app |
| [LIBCHECK-6](https://sato-ryu.sentry.io/issues/LIBCHECK-6) | `Error: pa` | 2 | Windows Chrome 117 / tz UTC / US / libcheck.pages.dev |
| [LIBCHECK-7](https://sato-ryu.sentry.io/issues/LIBCHECK-7) | `Error: ta` | 1 | iOS 18.7.8 Safari 26 / tz UTC / Ashburn / libcheck.pages.dev |

- GIS の XHR `readystatechange` ハンドラ内で GIS 自身が throw している（最内フレームが `gsi/client`、`mechanism: auto.browser.browserapierrors.xhr.onreadystatechange`）。
- メッセージは GIS の minify 名で、GIS のリリースごとに変わる（`pa` / `ta` と既に揺れている）。
- 環境はいずれも tz UTC・en-US・米国データセンターで、ボットの可能性が高い。
- 自コードでは修正できず、Sentry 上のノイズとして本当に対応すべきエラーを埋もれさせる。

## Requirements

### Functional

- FR-1: 最内フレーム（例外が throw された箇所）が GIS スクリプト（`https://accounts.google.com/gsi/` 配下）の例外を Sentry に送らない。
- FR-2: 自アプリのバンドル（`/assets/*.js`）で throw された例外は従来どおり送る。**GIS から呼ばれた自コードのコールバック内で throw された例外**（最内フレームが自バンドル）も送る。

### Non-Functional

- NFR-1: メッセージ（`pa` / `ta`）ではなくスクリプトの URL で判定する（GIS のリリースで minify 名が変わっても効くように）。
- NFR-2: Sentry SDK の公式オプション（`denyUrls`）を使い、独自の `beforeSend` フィルタは書かない。

## Constraints

- `denyUrls` は「ページの URL ではなくスタックフレームで判定」する（公式ドキュメント）。SDK（@sentry/core 10.63.0）の実装では、root exception のフレームを末尾（最内）から走査し、`<anonymous>` / `[native code]` 以外で最初のフレームの `filename` と照合する。
- トレードオフ: GIS 自体が throw する例外（設定不備などによるもの含む）は Sentry では見えなくなる。GIS の設定不備は通常 GIS がコンソールに `[GSI_LOGGER]` として出す警告であり、ログイン不能は smoke / 手動確認で検知する前提とする。

## Acceptance Criteria

- AC-1: LIBCHECK-6 と同じ形（最内フレームが `https://accounts.google.com/gsi/client`）のイベントが、SDK の実フィルタ（`eventFiltersIntegration`）で破棄される（ユニットテスト）。
- AC-2: 最内フレームが自アプリのバンドル（GIS が外側にあっても）のイベントは破棄されない（ユニットテスト）。
- AC-3: `initSentry()` が上記の `denyUrls` を `Sentry.init` に渡す（ユニットテスト）。
- AC-4: デプロイ後、LIBCHECK-5 / 6 / 7 が再発しない（Sentry 監視）。

## User Stories

- 開発者として、Sentry には自分たちが対応できるエラーだけが並ぶようにしたい。それにより、利用者に影響する問題に集中できる。
