# Issue #55: 検索履歴の保存形式ドキュメント化

## Problem Statement

検索履歴の `libraryStatuses` にDartのenum名（"available", "checkedOut" 等）を保存しているが、この設計判断が文書化されておらず、将来の開発者が意図を理解しにくい。

## Requirements

- 検索履歴の保存形式を仕様として文書化する
- enum名での保存を意図的な設計判断であることをコード上でも明示する

## Acceptance Criteria

1. `SearchHistoryEntry` のデータ形式がドキュメントに記載されていること
2. 保存処理にコメントが追加され、設計意図が明確であること
3. 全テストがパスすること
