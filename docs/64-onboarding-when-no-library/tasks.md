# Issue #64: Tasks — 図書館未登録時のオンボーディング体験改善

## 実装タスク

- [x] **[Test] `app_router_test.dart` に図書館未登録時のリダイレクトテストを追加する**
  - `FakeRegisteredLibraryRepository` が空リストを返すとき、`/` にアクセスすると `/library` にリダイレクトされること（`登録図書館` AppBar が表示される）

- [x] **[Test] `app_router_test.dart` の既存テスト `navigates to home page at /` を図書館登録済みケースに更新する**
  - 図書館を1件返す `FakeRegisteredLibraryRepositoryWithData` を追加する
  - テストで `FakeRegisteredLibraryRepositoryWithData` を使い、リダイレクトが発生しないことを確認する

- [x] **[Impl] `lib/presentation/router/app_router.dart` に `RouterNotifier` を追加する**
  - `ChangeNotifier` を継承する
  - コンストラクタで `ref.listen(registeredLibrariesProvider, ...)` し、変化時に `notifyListeners()` を呼ぶ

- [x] **[Impl] `lib/presentation/router/app_router.dart` の `routerProvider` を修正する**
  - `RouterNotifier` を生成し `refreshListenable` に設定する
  - `redirect` コールバックを追加する
    - `ref.read(registeredLibrariesProvider)` の `maybeWhen` で状態を確認
    - `data` かつ空リスト かつ `state.matchedLocation == '/'` のとき `'/library'` を返す
    - それ以外は `null` を返す

- [x] **[Verify] 既存テストがすべてパスすることを確認する**
  - `flutter test` を実行し、全170テストがグリーンであること
