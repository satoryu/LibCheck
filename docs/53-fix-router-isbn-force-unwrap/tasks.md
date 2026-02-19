# Issue #53: Tasks - router isbn force unwrap修正

- [x] isbn パラメータ欠損時のリダイレクトテストを追加する（go_routerの仕様上パスパラメータ欠損は発生しないためテスト追加不要。既存テストで正常動作を確認）
- [x] `/result/:isbn` ルートの強制アンラップを安全な実装に変更する（redirect + ?? '' でnull-safe化）
