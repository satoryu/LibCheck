# Issue #52: results[0]のハードコード参照を明示的なISBN検索に変更

## Problem Statement

`BookSearchResultPage` で `results[0]` をハードコードで参照しているが、カーリルAPIは複数ISBNの同時検索をサポートしており、将来的に複数結果が返る可能性がある。前提条件が明示されていないため保守時に誤解される恐れがある。

## Requirements

### Functional Requirements

- `results[0]` を `results.firstWhere((r) => r.isbn == isbn)` に変更し、ISBNで明示的に検索する
- 該当ISBNの結果が見つからない場合のフォールバック処理を追加する

### Non-Functional Requirements

- 既存の動作に変更がないこと

## Constraints

- 現在のアプリは単一ISBNのみ検索するため、`results[0]` でも動作する
- 将来の複数ISBN検索対応への布石

## Acceptance Criteria

1. `_saveSearchHistory` で `results[0]` の代わりに ISBN で明示検索していること
2. `_buildResultState` で `results[0]` の代わりに ISBN で明示検索していること
3. 全テストがパスすること

## User Stories

- 開発者として、コードの意図が明確に表現されていることで保守性を向上させたい
