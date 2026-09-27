# 要件: Service Worker 登録失敗の未処理 rejection の解消（#176）

## Problem Statement

Sentry で Service Worker（SW）登録失敗の未処理 rejection が最多のノイズになっている（2026-09-27 時点でも数時間おきに発生中）。

| Issue | メッセージ | 件数 | 主な発生環境 |
|---|---|---|---|
| [LIBCHECK-4](https://sato-ryu.sentry.io/issues/LIBCHECK-4) | `Error: Rejected` | 18+ | Android 10 / Chrome Mobile 138 で `/library/add/<都道府県>/<市町村>` を巡回（クローラ風）。一部 Windows Chrome 152・Android Chrome 151 のトップページ |
| [LIBCHECK-9](https://sato-ryu.sentry.io/issues/LIBCHECK-9) | `AbortError: Failed to register a ServiceWorker …` | 5 | iOS 13.2.3 Safari（tz: Asia/Shanghai）で市町村ページを巡回 |
| [LIBCHECK-8](https://sato-ryu.sentry.io/issues/LIBCHECK-8) | `TypeError: Failed to register a ServiceWorker …` | 3 | Windows Chrome 138/142 で市町村ページを巡回 |

原因は vite-plugin-pwa（`injectRegister: 'script'`）が生成する `/registerSW.js` が
`navigator.serviceWorker.register('/sw.js', { scope: '/' })` を `.catch` なしで呼んでいること。
SW を拒否・取得失敗する環境では rejection が `onunhandledrejection` として Sentry に送られる。

SW 登録失敗の実害は「その環境でオフライン動作・インストールが効かない」ことだけで、アプリ本体は動作する。
一方で Sentry 上では最多件数を占め、対応が必要なエラーを埋もれさせている。

## Requirements

### Functional

- FR-1: SW 登録が失敗（reject）しても未処理 rejection を発生させない。
- FR-2: SW 非対応環境（`navigator.serviceWorker` が無い）では何もしない（現行どおり）。
- FR-3: SW の登録タイミング・パス・スコープは現行と同じ（`window` の `load` 後に `/sw.js` をスコープ `/` で登録）。
- FR-4: SW 登録失敗は Sentry に送らない（開発時の調査用にコンソールへ警告のみ出す）。

### Non-Functional

- NFR-1: 自動更新（`registerType: 'autoUpdate'` + `skipWaiting` / `clientsClaim`）の挙動を変えない。新 SW が `waiting` に留まらず、ページの強制リロードも発生しない。
- NFR-2: CSP（`script-src 'self'`、`'unsafe-inline'` 不許可）を維持する。
- NFR-3: バンドルサイズを増やさない（workbox-window 等の追加依存を入れない）。

## Constraints

- vite-plugin-pwa 1.3.0。登録方式は公式ドキュメントに記載のある方式に限る（`public/registerSW.js` の差し替えは、コード上は機能するが公式に記載が無いため採らない）。
- 公式の `virtual:pwa-register` の `registerSW` は autoUpdate 時に SW 更新で `window.location.reload()` を行う（現行に無い挙動）ため採らない。
- 本番検証では、旧 SW（`registerSW.js` 方式）から新方式への更新が利用者に届くことを確認する必要がある（CLAUDE.md 検証原則）。

## Acceptance Criteria

- AC-1: `register` が reject しても未処理 rejection が発生しない（ユニットテスト）。
- AC-2: SW 非対応環境で例外が出ない（ユニットテスト）。
- AC-3: `load` 前に呼ばれた場合は `load` 後に、`load` 済みで呼ばれた場合は即座に、`/sw.js`・スコープ `/` で登録する（ユニットテスト）。
- AC-4: ビルド成果物の HTML に `registerSW.js` の script タグが無く、アプリのバンドルから SW が登録される（ブラウザ検証）。
- AC-5: 本番で旧 SW からの更新後、`navigator.serviceWorker.getRegistration()` が `active` のみ（`waiting` / `installing` なし）になる（ブラウザ検証）。
- AC-6: デプロイ後、LIBCHECK-4 / 8 / 9 が再発しない（Sentry 監視）。

## User Stories

- 開発者として、Sentry に実害のない SW 登録失敗が並ばないようにしたい。それにより、利用者に影響するエラーにすぐ気付ける。
- 利用者として、SW が使えない環境でもこれまでどおりアプリを使いたい。
