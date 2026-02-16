# Issue #43: reserveUrlが空文字列の場合に無効な「予約する」リンクが表示される

## Problem Statement

カーリルAPIが `reserveurl` に空文字列 `""` を返した場合、現在のnullチェックを通過して「予約する」リンクが表示される。このリンクをタップすると `launchUrl(Uri.parse(""))` が実行され、無効なURLエラーが発生する。

## Requirements

### Functional Requirements

- `reserveUrl` が空文字列の場合、「予約する」リンクを表示しない
- `reserveUrl` が `null` の場合、従来通り「予約する」リンクを表示しない
- `reserveUrl` が有効なURLの場合、従来通り「予約する」リンクを表示する

### Non-Functional Requirements

- データ層で空文字列をnullに正規化し、下流のコンポーネントに無効なデータが伝播しないようにする

## Constraints

- カーリルAPIのレスポンス仕様は変更できない
- 既存のテストが壊れないようにする

## Acceptance Criteria

1. APIレスポンスの `reserveurl` が空文字列 `""` の場合、`BookSystemStatus.reserveUrl` が `null` になること
2. `reserveUrl` が `null` または空文字列の場合、UIに「予約する」リンクが表示されないこと
3. `reserveUrl` が有効なURLの場合、UIに「予約する」リンクが正しく表示されること
4. 既存のテストがすべてパスすること

## User Stories

- ユーザーとして、蔵書の予約ページが存在しない場合に「予約する」リンクが表示されないことで、無効なリンクをタップしてエラーに遭遇することを避けたい
