# Issue #53: ルーターのisbnパラメータ強制アンラップ修正

## Problem Statement

`app_router.dart` の `/result/:isbn` ルートで `state.pathParameters['isbn']!` と強制アンラップしている。go_routerの仕様上、パスパラメータはルートマッチ時に必ず存在するが、防御的プログラミングとしてnull安全な実装に変更する。

## Requirements

### Functional Requirements

- `isbn` パラメータが欠損した場合にホームへリダイレクトする
- 正常なルーティングの動作に変更がないこと

### Non-Functional Requirements

- 強制アンラップ `!` を使用しない

## Constraints

- go_routerのパスパラメータはルートマッチ時に保証されるため、実質的なリスクは低い
- 防御的プログラミングの観点からの改善

## Acceptance Criteria

1. `state.pathParameters['isbn']!` が `!` なしの安全な実装に変更されていること
2. isbn が空の場合にホームへリダイレクトされること
3. 全テストがパスすること
