# Issue #54: Design - マジックカラー集約

## Architecture Overview

`lib/presentation/theme/app_colors.dart` にカラー定数クラスを新規作成し、全ファイルのマジックカラーを置き換える。

## Component Design

### AppColors 定数クラス

```dart
class AppColors {
  static const Color success = Color(0xFF2E7D32);   // 緑: 貸出可能、館内のみ
  static const Color warning = Color(0xFFEF6C00);   // オレンジ: 貸出中、予約中、準備中
  static const Color error = Color(0xFFD32F2F);     // 赤: エラー
  static const Color inactive = Color(0xFF9E9E9E);  // グレー: 休館中、蔵書なし、不明
}
```

### 置き換え対象

| ファイル | カラーコード | 置き換え先 |
|---|---|---|
| availability_status_badge.dart | 0xFF2E7D32 x2 | AppColors.success |
| availability_status_badge.dart | 0xFFEF6C00 x3 | AppColors.warning |
| availability_status_badge.dart | 0xFF9E9E9E x3 | AppColors.inactive |
| availability_status_badge.dart | 0xFFD32F2F x1 | AppColors.error |
| book_search_result_page.dart | 0xFFD32F2F x1 | AppColors.error |
| book_search_result_page.dart | 0xFF9E9E9E x1 | AppColors.inactive |
| error_state_widget.dart | 0xFFD32F2F x1 | AppColors.error |
| search_history_page.dart | 0xFF9E9E9E x1 | AppColors.inactive |
| search_history_page.dart | 0xFFD32F2F x1 | AppColors.error |
