# Issue #54: マジックカラーの集約

## Problem Statement

同じカラーコードが複数ファイルに散在しており、デザイン変更時に漏れが生じるリスクがある。

## Requirements

- マジックカラーを `AppColors` 定数クラスに集約する
- 既存のカラー参照をすべて定数に置き換える
- 既存の動作に変更がないこと

## Acceptance Criteria

1. `Color(0x...)` のハードコードが `app.dart` の `seedColor` を除いて存在しないこと
2. 全テストがパスすること
