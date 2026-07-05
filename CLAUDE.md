# CLAUDE.md

## Tech Stacks

- React 18 / TypeScript / Vite
- [カーリル 図書館API](https://calil.jp/doc/api_ref.html)
- Google 認証（Google Identity Services / @react-oauth/google、ID トークンは jose でサーバ検証）— ログイン必須
- Cloudflare Pages + Pages Functions（静的配信 + API プロキシ / 認証 / 永続化 API）
- Cloudflare D1（登録図書館・検索履歴をユーザー単位で永続化。スキーマは infra/d1/migrations で管理）

## Workflow

0. Create a development environment to work on the issue.
1. Analyze the user's request in the issue and write down the requirements in the document `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/requirements.md`.
2. Design the architecture and write it down in `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/design.md`.
3. Plan the implementation tasks and create a checklist in `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/tasks.md`.
4. You must be approved by the user before starting the implementation.
5. Implement the tasks one by one, following TDD principles after approval.
6. After completing the implementation, create a pull request to merge the feature branch into the `main` branch.
7. Review the code and write a review feedback to the pull-request.

## Documents

### `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/requirements.md`

This document contains the requirements for the issue number `[ISSUE-NUMBER]`, including the following sections:

- Problem Statement
- Requirements(Functional and Non-Functional)
- Constraints
- Acceptance Criteria
- User Stories

### `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/design.md`

This document contains the design for the issue number `[ISSUE-NUMBER]`, including the following sections:

- Architecture Overview
- Component Design
- Data Flow
- Domain Models

The diagrams should be created using [Mermaid](https://mermaid-js.github.io/mermaid/#/) syntax.

### `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/tasks.md`

This document contains the implementation tasks for the issue number `[ISSUE-NUMBER]`, including a checklist of tasks to be completed.

You must complete each task in order and check them off as you complete them.

## Implementation

You must follow TDD (Test-Driven Development) principles when implementing the tasks.
This means you must write todos to complete the task first, then write a test that fails, and finally implement the code to make the test pass. Then refactor the code if necessary.

The codebase follows a Clean Architecture layout under `src/` (`domain` / `data` / `presentation`).
Keep dependencies pointing inward: `presentation` and `data` may depend on `domain`, but `domain` must not depend on the outer layers.

## Testing

Tests are written with [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/). You can run them using the following commands:

```bash
npm test          # run the whole suite once
npm run test:watch # watch mode

npx tsc -b        # type-check (also runs as part of `npm run build`)
```

## Branching Strategy

GitHub flow is used as the branching strategy.

- `main` branch: This is the production-ready branch. Only code that has been tested and approved should be merged into this branch.
- `feature/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]` branches: These branches are used for developing new features. They should be created from the `main` branch and merged back into `main` when the feature is complete.

## Code Reviews

After completing the implementation of a feature, you must create a pull request to merge the `feature/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]` branch into the `main` branch.
Then you must review the code by yourself and write a review feedback to the pull-request, ensure that it meets the requirements and passes all tests before merging.

In review phase, you must focus on the following aspects:

- Correctness
- Readability
- Performance
- Security
- Maintainability

When issues are found during code review, do not dismiss them solely because they fall below a scoring threshold. Any issue flagged with high confidence (e.g. resource leaks, unclear test intent, code duplication, insufficient assertions) must be evaluated and fixed before merging.

## In-Browser Testing

When the Test Plan includes manual verification items (UI behavior, camera/barcode scanning, navigation), you must perform the verification yourself in a browser. Do not leave it to the user unless the browser environment is genuinely unavailable. Steps:

1. Start the dev server (`npm run dev`, default `http://localhost:5173`), or emulate the production setup (Pages Functions) with `npm run pages:dev`.
2. Open the app in a browser and verify each acceptance criterion manually (use the Chrome integration tools when available; Playwright does not install in this environment — see Known Pitfalls).
3. For camera/barcode features, verify graceful handling when camera access is denied or unavailable.
4. Check off the verified items in the PR Test Plan.

## Merging

Do not merge a PR if there are unchecked items in its Test Plan. For items that cannot be verified by automated tests (e.g. in-browser verification), perform the verification yourself first. Only ask the user for approval if the environment is genuinely unavailable.

## Definition of Done

「マージして終わり」にしない。1つの Issue/PR は以下をすべて満たして完了とする:

1. CI 緑（`scripts/watch-pr.sh [PR番号]` で待機できる）→ squash merge
2. main へのマージで走る本番デプロイ（cloudflare-pages.yml）の完了を `gh run watch` で見届ける
3. **`scripts/smoke.sh` を実行し全項目 ✅**（本番の一次検証。読み取りのみで安全）
4. その変更固有の本番検証（新エンドポイントの応答、ヘッダ、表示など）を実測する
5. 検証結果を PR / Issue に記録してからクローズする

## Verification Principles

- **記憶で書かない**: 外部サービス（Cloudflare / Google / Workbox 等）の仕様・コマンド・制約は、実装前に公式ドキュメントで裏取りする。ダッシュボードのクリック手順は陳腐化するため、手順は API / CLI で示す。
- **変更前に影響範囲を grep する**: 呼び出し側・テスト・Fake 実装を先に洗ってから設計する。
- **サーバとクライアントを切り分ける**: 本番の不具合は、まず curl（サーバ/CDN の状態）とブラウザ（SW・キャッシュ・Cookie などクライアントの状態）を分けて観測してから原因を推定する。
- **Service Worker / PWA を変更したら「更新が届くこと」自体を検証項目にする**: 新 SW が waiting に滞留しないこと（`navigator.serviceWorker.getRegistration()` で `waiting` が残らない）をブラウザで確認する。curl やユニットテストでは検出できない。

## Known Pitfalls（このプロジェクト固有の罠）

- **Cloudflare Pages の環境変数は必ず `secret_text`**: plain 変数は `wrangler pages deploy` が消す（正本は wrangler.toml の `[vars]`）。変更は再デプロイで初めて反映される。
- **クリーン URL（拡張子なし）は本番 Pages のみの機能**: ローカル Vite dev では 404 になる。アプリ内リンクは `.html` 付きにする（本番は 308 で追従される）。
- **`git add -A` を使わない**: 未追跡のゴミ（過去に pnpm ファイル）を巻き込んだ事故がある。対象パスを明示して add する。
- **wrangler / Playwright はローカルに入らない**（sharp のネイティブビルドで失敗する環境）。wrangler は CI（wrangler-action）か `npx`、ブラウザ確認は Chrome 連携ツールか、ユーザーの目視に依頼する。
- **GIS One Tap は承認済みユーザーを即・自動ログインさせる**: 未ログイン画面（ランディング）の確認はログアウト直後かシークレットウィンドウで行う。dev で実 Google ログインは通らない（`VITE_AUTH_MOCK=true` でモックを使う）。
- **Cloudflare API トークンの受け渡し**: ユーザーが `/tmp/cf_token`・`/tmp/cf_acct` に配置（`umask 077`）→ 値は一切表示しない → **検証が完了するまで削除しない** → 完了後に `rm`。
