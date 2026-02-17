# Issue #50: reserveUrlのURLスキーム検証

## Problem Statement

`LibraryAvailabilityCard` で予約リンクをタップした際、カーリルAPIから取得した `reserveUrl` をバリデーションなしで `launchUrl` に渡している。APIレスポンスの改ざんやAPI不具合により不正なURLスキーム（`javascript:`, `file:`, `data:` 等）が含まれた場合、セキュリティリスクとなる。

## Requirements

### Functional Requirements

- 予約リンクタップ時、URLスキームが `http` または `https` の場合のみ外部ブラウザで開く
- 不正なスキームの場合はリンクを開かず、ユーザーに適切なフィードバックを表示する

### Non-Functional Requirements

- 既存の予約リンク表示ロジック（`isReservable` チェック、空文字列チェック）に影響を与えない
- `LaunchMode.externalApplication` を明示して、アプリ内WebViewでの実行を防ぐ

## Constraints

- カーリルAPIの `reserveurl` フィールドは通常 `https://` で始まるURLを返す
- `url_launcher` パッケージの `launchUrl` を使用する既存設計を維持する

## Acceptance Criteria

1. `https://` で始まるURLの場合、外部ブラウザで正常に開くこと
2. `http://` で始まるURLの場合、外部ブラウザで正常に開くこと
3. `javascript:` スキームのURLの場合、ブラウザを開かないこと
4. `file:` スキームのURLの場合、ブラウザを開かないこと
5. 不正なURLの場合、アプリがクラッシュしないこと
6. `LaunchMode.externalApplication` が指定されていること

## User Stories

- 利用者として、予約リンクをタップした際に安全に図書館の予約ページが開かれることを期待する
- 利用者として、不正なURLによりアプリがクラッシュしないことを期待する
