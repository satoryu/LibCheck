# #141 検索履歴に書籍タイトル・書影を表示 — Requirements

## Problem Statement
履歴画面の各エントリは ISBN のみで、何の書籍の履歴か判別しづらい。

## Requirements
- FR-1: 履歴一覧の各エントリに書籍タイトルを表示する（取得できた場合）
- FR-2: 各エントリに書影サムネイルを表示する（Amazon → OpenBD → プレースホルダのフォールバック）
- FR-3: タイトル表示時も ISBN は補助表記として残す
- FR-4: メタデータは履歴全件に対して 1 リクエストで一括取得する（OpenBD `/get?isbn=csv`）
- FR-5: 取得失敗・未収載時は従来表示（ISBN 主表記）に自然フォールバックし、履歴機能自体は無影響
- NFR-1: D1 スキーマ・保存 API は変更しない
- NFR-2: 書誌は不変データとして長期キャッシュ（staleTime: Infinity）

## Acceptance Criteria
- AC-1: 履歴に書影・タイトルが表示され、ISBN は補助表記になる
- AC-2: OpenBD 呼び出しが履歴全件で 1 回（テストで検証）
- AC-3: metadata が無いエントリは従来表示で崩れない
- AC-4: `npx tsc -b` / `npm test` 緑（TDD）
