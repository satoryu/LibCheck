# タスクチェックリスト: 蔵書状況の表示バグ修正 (#19)

## 実装タスク

- [x] Task 1: `LibraryStatus.statusForLibKey()` メソッドのテストを追加
  - libKeyが存在する場合に正しいAvailabilityStatusを返すテスト
  - libKeyが存在しない場合にnotFoundを返すテスト
  - 複数のlibKeyがある場合にそれぞれ正しいステータスを返すテスト

- [x] Task 2: `LibraryStatus.statusForLibKey()` メソッドを実装
  - `libKeyStatuses`マップからlibKeyに対応するAPI文字列を取得
  - `AvailabilityStatus.fromApiString()`で変換して返す
  - libKeyが存在しない場合は`AvailabilityStatus.notFound`を返す

- [x] Task 3: `LibraryAvailabilityCard` のウィジェットテストを修正・追加
  - libKeyに応じた個別ステータスが表示されることを確認するテスト
  - 同一システム内でlibKeyごとに異なるステータスが表示されるテスト

- [x] Task 4: `LibraryAvailabilityCard` でlibKeyごとのステータスを使用するよう修正
  - `status.status` を `status.statusForLibKey(library.libKey)` に変更

- [x] Task 5: 全テスト実行・確認
  - `flutter test` ですべてのテストがパスすることを確認
