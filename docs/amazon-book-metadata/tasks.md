# 書影・タイトル・購入リンク表示 — Tasks

TDD（失敗するテスト → 実装 → リファクタ）で上から順に進める。

## Domain
- [x] `isbn13to10` のテストを追加（`isbnValidator.test.ts`）
- [x] `isbn13to10` を実装（`isbnValidator.ts`）
- [x] `amazonUrls` のテストを作成（`amazonUrls.test.ts`）
- [x] `amazonUrls`（`amazonProductUrl`/`amazonCoverImageUrl`）を実装
- [x] `bookMetadata` モデルを作成
- [x] `bookMetadataRepository` インターフェースを作成

## Data
- [x] `openBdApiConfig` を作成
- [x] `openBdResponse` DTO を作成
- [x] `openBdApiClient` のテストを作成
- [x] `openBdApiClient` を実装
- [x] `bookMetadataRepositoryImpl` のテストを作成
- [x] `bookMetadataRepositoryImpl` を実装

## DI
- [x] `dependencies.tsx` に `openBdApiClient`/`bookMetadataRepository` を追加
- [x] `testUtils.tsx` に `FakeBookMetadataRepository` を追加し `makeFakeDeps` に組込み

## Presentation
- [x] `useBookMetadata` のテストを作成
- [x] `useBookMetadata` を実装
- [x] `BookMetadataCard` のテストを作成
- [x] `BookMetadataCard` を実装
- [x] `BookSearchResultPage` の結合テストを拡張
- [x] `BookSearchResultPage` に `BookMetadataCard` を統合

## 検証
- [x] `npx tsc -b` 通過
- [x] `npm test` 全緑（234 tests）
- [x] `npm run dev` で In-Browser 動作確認（書影/タイトル/Amazonリンク・フォールバック・蔵書状況維持）
  - 既知ISBN `9784873117584`: Amazon書影＋OpenBDタイトル＋`/dp/4873117585` リンクを確認
  - 979始まり `9791032305690`: プレースホルダ書影＋検索フォールバックリンクを確認
- [ ] PR 作成・セルフレビュー
