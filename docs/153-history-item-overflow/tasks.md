# Tasks — #153 履歴画面（モバイル）の横スクロールバー問題

- [x] 開発環境の準備（`feature/153-history-item-overflow` ブランチ作成）
- [x] `requirements.md` 作成
- [x] `design.md` 作成
- [x] 実装（TDD）
  - [x] `SearchHistoryPage.test.tsx` / `SearchHistoryCard.test.tsx` に、長いタイトル・ISBN 表記の切り詰めを確認する回帰テストを追加（Red 確認済み）
  - [x] `SearchHistoryPage.tsx:106` の `Box sx={{ flexGrow: 1 }}` に `minWidth: 0` を追加
  - [x] `SearchHistoryCard.tsx` の ISBN キャプション（:96-102）とフォールバック（:105-110）に `overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'` を追加
  - [x] `npm test` / `npx tsc -b` がグリーンであることを確認（417 tests passed, tsc no errors）
- [x] Claude in Chrome によるブラウザ実機検証
  - [x] Dev ログインでタイトル長の異なる複数書籍（短・長・ISBN のみ）を履歴に積む
  - [x] 390px/360px 幅で `/history` を表示し、横スクロールバーが出ないことを screenshot + `scrollWidth`/`clientWidth` 計測で確認（修正後は `scrollWidth === clientWidth === 591px`）
- [ ] PR 作成（Test Plan に上記検証結果を記載）
- [ ] 自己コードレビュー（Correctness / Readability / Performance / Security / Maintainability）とレビューコメント記載
- [ ] CI green を確認しつつ `scripts/watch-pr.sh` 経由でマージ
- [ ] 本番デプロイ監視（`gh run watch`）
- [ ] `scripts/smoke.sh` 実行・全項目パス確認
- [ ] 本番での変更点確認（履歴画面の横スクロール解消）
- [ ] PR / Issue に検証結果を記録してクローズ
