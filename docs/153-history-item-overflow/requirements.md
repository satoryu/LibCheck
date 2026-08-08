# Requirements — #153 履歴画面（モバイル）の横スクロールバー問題

## Problem Statement

履歴画面（`/history`）をスマートフォン幅で閲覧すると、書籍タイトルの長さによって履歴アイテム（カード）の横幅が異なり、画面全体に横スクロールバーが表示されてしまう。タイトルが短い書籍の行は画面幅に収まるが、タイトルが長い書籍の行だけ画面右にはみ出し、削除アイコンが画面外に押し出される。

Claude in Chrome を用いた実機相当環境（390×844）での再現・DOM 計測により、原因は `SearchHistoryPage.tsx` の履歴行ラッパー `Box` に `minWidth: 0` が欠けていることによる、ネストした flexbox の縮小伝播不全であると特定済み（詳細は [design.md](./design.md) を参照）。

## Requirements

### Functional

- 履歴画面の各アイテムは、書籍タイトルの長さに関わらず、画面（ビューポート）幅を超えて描画されないこと。
- タイトルが画面幅に収まらない場合は、既存どおり末尾を省略記号（…）で切り詰めて 1 行表示すること（レイアウト自体は変更しない）。
- ISBN 表記（キャプション表示・メタデータ未取得時のフォールバック表示）も同様に、想定外に長い文字列が来ても行の横幅を広げないこと。

### Non-Functional

- 既存の見た目（余白・アイコン配置・タップ領域）を変更しないこと。修正はレイアウトの「縮小できない」原因を取り除くことに限定する。
- モバイル幅（360px〜430px 程度の一般的なスマートフォン幅）で横スクロールバーが出ないことを実機（Claude in Chrome）で確認する。

## Constraints

- Vitest + jsdom のユニットテストでは実レイアウトエンジンが無いため、`scrollWidth`/`clientWidth` 等のピクセル計測による「オーバーフローしないこと」の自動テストは書けない。最終確認は Claude in Chrome によるブラウザ実機検証で行う（CLAUDE.md の In-Browser Testing 方針に準拠）。
- `SearchHistoryCard` は他画面と共有されていない（`SearchHistoryPage.tsx` からのみ使用）が、内部の `BookCoverThumbnail` は `BookMetadataCard`（検索結果画面）と共有されているため、`BookCoverThumbnail` 自体は変更しない。

## Acceptance Criteria

- モバイル幅（360px〜430px）で、タイトル長の異なる複数の履歴エントリ（短いタイトル／長いタイトル／メタデータ未取得の ISBN のみ表示）を表示しても、履歴リストの `scrollWidth` が `clientWidth` を超えない（横スクロールバーが表示されない）こと。
- 既存の `SearchHistoryPage.test.tsx` / `SearchHistoryCard.test.tsx` が引き続きパスすること。
- `npm test` / `npx tsc -b` がグリーンであること。

## User Stories

- スマートフォンで検索履歴を確認するユーザーとして、書籍タイトルの長さに関わらず、横スクロールなしで履歴一覧をスムーズに閲覧したい。
