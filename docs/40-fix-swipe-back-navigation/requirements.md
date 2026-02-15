# Issue #40: バーコードスキャン画面からスワイプバックするとアプリが閉じる — 要件定義

## Problem Statement

ホーム画面からバーコードスキャン画面・ISBN入力画面への遷移に `context.go()` を使用しているため、ナビゲーションスタックが置き換わり、スワイプバックでアプリが閉じてしまう。

## Requirements

### Functional Requirements

1. バーコードスキャン画面からスワイプバックでホーム画面に戻れる
2. ISBN入力画面からスワイプバックでホーム画面に戻れる

### Non-Functional Requirements

1. 既存の画面遷移フローに影響を与えない

## Constraints

- GoRouter の `push()` / `go()` の使い分けに準拠する

## Acceptance Criteria

1. バーコードスキャン画面で左端スワイプするとホーム画面に戻る
2. ISBN入力画面で左端スワイプするとホーム画面に戻る
3. 全テストが通る
