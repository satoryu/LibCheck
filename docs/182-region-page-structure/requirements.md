# 要件定義: 地域ページの基本構造（h1・メタ・パンくず・内部リンク・構造化データ・sitemap）（#182）

親Issue: #181

## Problem Statement

Google にインデックスされている主なページは図書館追加画面 `/library/add/{都道府県}/{市区町村}`（1,481 ページ）である。Search Console（2026/8/20〜10/5）では表示回数が 9/19 のピーク（1,097/日）から 65〜200/日 に急落し、表示されたページ数も 1,000 以上から 308 に減った。

リポジトリを調査した結果、Google が「地名違いの薄い機能画面」と評価した原因は次のとおりと考えられる。

1. **配信 HTML の本文が空**: `functions/_middleware.js` は `<head>` の title / description / canonical / og / robots を書き換えるだけで、`<body>` は `<div id="root"></div>` のみ。本文（図書館名・住所）は SPA がクライアントで描画している。JS を実行しないクローラには本文がまったく見えない。
2. **描画後の DOM にも見出し・リンクがない**: `SubPageAppBar` のタイトルは `<div>`、都道府県・市区町村の一覧は `ListItemButton` + `navigate()` で `<a href>` を持たない。JS を実行する Googlebot から見ても、h1 も内部リンクもない。
3. **トップページから地域ページへの導線がない**: 未ログインのトップ（`LandingPage`）は `/library/add` にリンクしていない。地域ページの発見経路は sitemap.xml だけ。
4. **メタ情報がほぼ同文**: title は `{都道府県}{市区町村}の図書館 — LibCheck`、description は地名以外が全ページ同じ。さらに「蔵書を検索できます」と書いており、キーワードで蔵書検索できるように読める。
5. **構造化データが全ページ共通**: `index.html` の `SoftwareApplication` がそのまま全ページに出ている。
6. **存在しない地域の URL も indexable**: 未知の都道府県・市区町村でも robots は `index,follow` のまま、本文が空になる（ソフト404の候補。#174）。

## Requirements

### Functional

- **F1. h1**: `/library/add/:pref/:city`・`/library/add/:pref`・`/library/add` に、ページ固有の h1 を置く。
- **F2. title / description**: 3ルートの title と meta description を、アプリの実際の機能（本のバーコードで、登録した図書館の貸出・予約の可否を確認する）に沿った文言に変える。市区町村ページと都道府県ページの description には館数と図書館名（市区町村ページ）・市区町村数（都道府県ページ）を入れ、ページごとに異なる文にする。
- **F3. パンくず**: 3ルートにパンくず（トップ > 地域から探す > 都道府県 > 市区町村）を表示し、同じ内容の `BreadcrumbList` 構造化データを付ける。
- **F4. 都道府県 → 市区町村の導線**: トップ → `/library/add`（都道府県一覧）→ `/library/add/:pref`（市区町村一覧）→ `/library/add/:pref/:city` を `<a href>` でたどれるようにする。
  - 都道府県ページは既存の `/library/add/:pref` を強化する（新しい URL は作らない。後述「Constraints」）。
  - 未ログインのトップページに、`/library/add` と47都道府県ページへのリンクを置く。
- **F5. 同一都道府県内の他の市区町村へのリンク**: 市区町村ページに、同じ都道府県の他の市区町村（全件）へのリンクを置く。
- **F6. 構造化データ**: 市区町村ページは `BreadcrumbList` + 掲載図書館の `Library`。都道府県ページと `/library/add` は `BreadcrumbList`。トップページは現在の `SoftwareApplication` を維持する。
- **F7. 0館ページ**: 図書館が0館になる URL（データに無い都道府県・市区町村）は `noindex` にし、sitemap.xml から除く。
- **F8. sitemap.xml**: 公開ページを列挙し、`lastmod` を付ける（本PRで内容が変わる全公開ページの lastmod を更新）。0館ページは含めない。#173 から引き継いだ priority の館数別段階化も行う。
- **F9. JS 非実行で取得できる HTML**: F1・F3〜F6 の内容（h1、パンくず、内部リンク、図書館一覧、JSON-LD）を、JavaScript を実行しなくても取得できる配信 HTML に含める。JS 実行後の SPA の描画にも同じ内容を出す。

### Non-Functional

- **NF1. 性能**: ミドルウェアでの追加処理（静的 JSON の取得・HTML 生成）は1リクエストあたり最大の東京都（約340KB）でも体感できる遅延を生まないこと。
- **NF2. 安全性**: URL 由来の文字列（都道府県名・市区町村名）や図書館データを HTML / JSON-LD に埋め込む際は必ずエスケープする（XSS・`</script>` 混入の防止）。
- **NF3. 保守性**: title / description / h1 などの文言は、ミドルウェア（Pages Functions）と SPA で二重管理しない。
- **NF4. 文言**: アプリにない機能（キーワードでの蔵書検索など）があるように読める文言は使わない。

## Constraints

- 既存の URL（`/library/add/...`）は変更しない。都道府県ページは既存の `/library/add/:pref` を使う。
- `google-site-verification` の meta タグは削除しない。
- ログイン必須の個人向けページを `noindex` にする既存の仕組み（`_middleware.js` + `routeMeta.js`）は維持する。
- 既存のログイン後の図書館登録フロー（`LibraryListPage` の選択 → 登録、未ログイン時のその場ログイン #167）を壊さない。
- 静的データ（`public/data/libraries/*.json`）だけを使い、カーリル API を呼ばない（#158 の方針）。
- PWA の Service Worker は `navigateFallback` でプリキャッシュ済みの `index.html` を返す場合がある。その場合は差し込み HTML が届かないが、SPA が同じ内容を描画するため許容する（#157 と同じ扱い）。

## Acceptance Criteria

代表ページの配信 HTML を `curl`（JS 非実行）で取得して確認する。

- **AC1**: `/library/add/滋賀県/野洲市` と `/library/add/岐阜県/可児市` で、h1・title・meta description・canonical・robots（`index,follow`）が設計どおり。description に館数と図書館名が入っている。
- **AC2**: 都道府県ページ（`/library/add/滋賀県`、`/library/add/岐阜県`）と `/library/add` で、h1・title・description・canonical・robots が設計どおり。
- **AC3**: 上記ページの HTML に、パンくずのリンクと内部リンク（都道府県 → 市区町村、市区町村 → 同じ都道府県の他の市区町村）が `<a href>` として含まれている。
- **AC4**: トップページ `/` の HTML に `/library/add` と47都道府県ページへのリンクが含まれ、`SoftwareApplication` の JSON-LD が残っている。`google-site-verification` が残っている。
- **AC5**: 市区町村ページの JSON-LD が `BreadcrumbList` と `Library` を含む妥当な JSON で、`SoftwareApplication` を含まない。都道府県ページ・`/library/add` は `BreadcrumbList` を含む。
- **AC6**: 存在しない市区町村（例 `/library/add/滋賀県/存在しない市`）と存在しない都道府県が `noindex` で配信される。
- **AC7**: sitemap.xml に全公開ページ（トップ、`/library/add`、47都道府県、1,481市区町村）が `lastmod` 付きで含まれ、0館ページが含まれない。
- **AC8**: 個人向けページ（`/library`・`/history`・`/scan` など）が引き続き `noindex` で配信される。
- **AC9**: ブラウザ（コールドロード）で、地域ページの h1・パンくず・リンクが表示され、ログイン後の図書館登録フローが従来どおり動く。
- **AC10**: `npm test`・`npx tsc -b`・`npm run build` が通る。

## User Stories

- 本屋で見かけた本を地元の図書館で借りられるか調べたい人として、自分の市区町村の図書館に LibCheck が対応しているかを、検索結果とページの見出しだけで判断したい。
- 地域ページに着いた人として、同じ都道府県の別の市区町村（勤務先の近くなど）の図書館にもすぐ移動したい。
- 検索エンジンのクローラとして、JS を実行しなくてもページ固有の見出し・本文・リンク・構造化データを取得したい。
- 運営者として、存在しない地域の URL が薄いページとして評価され、サイト全体の評価を下げることを防ぎたい。
