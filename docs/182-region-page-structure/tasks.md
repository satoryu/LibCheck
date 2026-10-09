# 実装タスク: 地域ページの基本構造（#182）

TDD で進める（失敗するテストを先に書く → 実装 → リファクタ）。各タスク完了ごとにチェックする。

## 1. スパイク: Pages Functions から `src/` の TS モジュールを import できるか

- [x] 最小の純粋 TS モジュールを `src/presentation/regionPage/` に置き、`_middleware.js` から相対 import して `npm run pages:dev` で動作を確認する
- [x] 結果を design.md の「懸念点 1」に追記する（不可なら代替案に切り替え、設計を更新してから進める）

## 2. ページ内容の純粋関数 `regionPageContent.ts`

- [x] `regionPageContent.test.ts` に失敗するテストを書く
  - 市区町村: title / description（館数・館名3件・「ほか」の有無）/ h1 / パンくず / 他の市区町村（自分を除く・館数付き・ソート済み）
  - 館名の前後空白を除く
  - 都道府県: 市区町村数・館数・市区町村リンク
  - `/library/add`: 47都道府県を地方ごとに返す
  - 未知の都道府県・データにない市区町村は `notFound`
  - パスは `encodeURIComponent` 済み
  - 文言に「蔵書を検索」「蔵書検索」を含まない
- [x] 実装してテストを通す

## 3. HTML / JSON-LD 生成 `functions/_shared/regionPageHtml.js`

- [x] `regionPageHtml.test.ts` に失敗するテストを書く
  - `renderRootHtml`: h1・パンくず（`<a href>`、最後はリンクなし）・図書館一覧・他の市区町村リンク・カーリルのクレジット
  - `renderJsonLd`: `JSON.parse` できる / `BreadcrumbList`（position・最後の item 省略）/ `Library`（BM を除く・geo の緯度経度の順序）/ 都道府県・index は `BreadcrumbList` のみ
  - エスケープ: `<script>` や `"` を含む地名・館名が HTML で無害化され、JSON-LD に `</script>` が現れない
- [x] 実装してテストを通す

## 4. `routeMeta.js` / `_middleware.js`

- [x] `routeMeta.test.ts` を更新（地域ルートがマッチ情報を返す、個人向けルートは従来どおり noindex）
- [x] `_middleware.test.ts` に失敗するテストを追加（フェイク HTMLRewriter / フェイク `env.ASSETS`）
  - 市区町村ページ: title / description / canonical / og / JSON-LD 置換 / `#root` 差し込みのハンドラを登録する
  - 未知の都道府県（ASSETS を呼ばない）・データにない市区町村・JSON 取得失敗 → robots を noindex
  - `/`: head は変えず `#root` にだけ差し込む
  - 個人向けルート・未知ルート・`/api/*`・非 HTML は従来どおり
- [x] 実装してテストを通す

## 5. SPA

- [ ] `RegionBreadcrumbs` のテスト → 実装
- [ ] `LibraryListPage.test.tsx`: h1・パンくず・他の市区町村リンク（`<a href>`）・新しい intro 文言のテストを追加し失敗させる → 実装。既存の選択・登録・未ログイン時ログインダイアログのテストが通ることを確認
- [ ] `CitySelectionPage.test.tsx`: h1・パンくず・市区町村が `<a href>`・館数表示・検索フィルタ維持 → 実装
- [ ] `PrefectureSelectionPage.test.tsx`: h1・パンくず・都道府県が `<a href>` → 実装
- [ ] `RegionLinks` のテスト → 実装し、`LandingPage` に組み込む

## 6. sitemap

- [ ] `scripts/generateSitemap.test.mjs`（または既存 `generateLibraryData.test.mjs` の更新）に失敗するテストを書く
  - 全 URL に `lastmod`、priority の段階化、0館の市区町村・都道府県を出さない、件数（1 + 1 + 47 + 1,481）
- [ ] `scripts/generateSitemap.mjs` を実装し、`generateLibraryData.mjs` から呼ぶ。`package.json` に `generate:sitemap` を追加
- [ ] `npm run generate:sitemap -- --lastmod=<実装日>` で `public/sitemap.xml` を再生成してコミット

## 7. 全体確認

- [ ] `npm test` / `npx tsc -b` / `npm run build` が通る
- [ ] `npm run pages:dev` で代表ページを `curl` し、AC1〜AC8 を確認（h1・title・description・canonical・robots・パンくず・内部リンク・JSON-LD の妥当性・noindex）
- [ ] ブラウザ（Chrome 連携）のコールドロードで、地域ページとトップの表示・ちらつき・登録フロー（`VITE_AUTH_MOCK=true`）を確認（AC9）
- [ ] PR を作成し、Test Plan に代表ページの確認結果を記載する
- [ ] セルフレビューをPRに記載し、指摘を修正する
- [ ] マージ後: 本番デプロイを `gh run watch` → `scripts/smoke.sh` → 本番の代表ページを `curl` で確認し、結果を PR / Issue に記録する
