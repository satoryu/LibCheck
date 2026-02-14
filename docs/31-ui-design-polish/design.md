# Issue #31: UIデザインの仕上げ — 設計

## Architecture Overview

テーマ定義を `app.dart` に集約し、デザインガイドラインの配色を適用する。個別画面のスタイル個別指定を除去して統一する。

## Component Design

### テーマ設定 (`app.dart`)

```dart
ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFF00796B),  // Teal
  ),
  useMaterial3: true,
)
```

### 修正対象

| ファイル | 修正内容 |
|---------|----------|
| `app.dart` | seedColor を `deepPurple` → `Teal (#00796B)` に変更 |
| `home_page.dart` | AppBar の `backgroundColor: inversePrimary` を除去、ウェルカムUI追加 |

## Data Flow

テーマ変更のみのため、データフローの変更なし。

## Domain Models

変更なし。
