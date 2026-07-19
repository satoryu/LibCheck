# #141 — Tasks（TDD）

- [ ] 1. `OpenBdApiClient.getByIsbns` のテスト（CSV URL・要求順・null・空配列）→ 実装
- [ ] 2. `BookMetadataRepository.getByIsbns` 契約追加・実装（Map 変換）のテスト → 実装
- [ ] 3. `useBookMetadataList` フックのテスト（1回取得・キー安定）→ 実装
- [ ] 4. `BookCoverThumbnail` を切り出し（BookMetadataCard から共通化）＋テスト
- [ ] 5. `SearchHistoryCard` に metadata 表示（タイトル/サムネ/ISBN降格）＋テスト
- [ ] 6. `SearchHistoryPage` で一括取得・配布＋結合テスト
- [ ] 7. `npx tsc -b` / `npm test` 緑
- [ ] 8. dev + Chrome で目視（タイトルあり・なし混在）
- [ ] 9. PR → セルフレビュー → DoD（デプロイ watch → smoke → 本番確認）
