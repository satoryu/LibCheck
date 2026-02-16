# Issue #43: Implementation Tasks

- [x] 1. `BookSystemStatus.fromJson()` に空文字列 `reserveurl` のテストを追加する (`test/data/models/check_response_test.dart`)
- [x] 2. `BookSystemStatus.fromJson()` で空文字列を `null` に変換するよう修正する (`lib/data/models/check_response.dart`)
- [x] 3. `LibraryAvailabilityCard` に空文字列 `reserveUrl` のテストを追加し、UI層でも空文字列をガードする (`test/presentation/widgets/library_availability_card_test.dart`, `lib/presentation/widgets/library_availability_card.dart`)
- [x] 4. 全テストが通ることを確認する
