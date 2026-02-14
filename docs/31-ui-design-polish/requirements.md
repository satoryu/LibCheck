# Issue #31: UIデザインの仕上げ — 要件定義

## Problem Statement

現状のアプリテーマは `Colors.deepPurple` をシードカラーとしたデフォルトテーマが使用されており、デザインガイドラインで定義された `Teal (#00796B)` ベースの配色が適用されていない。また、ホームページの AppBar に `inversePrimary` 背景色がハードコードされている等、全体的な統一感が不足している。

## Requirements

### Functional Requirements

1. **テーマカラーの適用**: デザインガイドラインの Teal (#00796B) をプライマリカラーとしたカスタム `ColorScheme` を適用する
2. **AppBar スタイルの統一**: 全画面の AppBar を統一した見た目にする（`inversePrimary` の個別指定を除去）
3. **ホームページの改善**: アプリの顔となるホームページにアイコンやウェルカムメッセージを追加

### Non-Functional Requirements

1. デザインガイドラインに準拠した配色
2. Material Design 3 に準拠

## Constraints

- 既存の機能を壊さない
- 既存テストが全て通ること

## Acceptance Criteria

1. アプリ全体の Primary カラーが Teal (#00796B) になっている
2. ホームページの AppBar が他画面と統一されている
3. ホームページにアプリの説明やアイコンが表示されている
4. 全テストが通ること
