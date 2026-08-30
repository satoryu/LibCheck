# 実装タスク: 公開図書館追加ページに離脱防止の案内・ログイン導線を追加する（#167）

TDD で進める（失敗するテストを先に書く → 実装 → リファクタ）。各タスク完了ごとにチェックする。

## 1. `PublicPageIntro` ウィジェット

- [ ] `src/presentation/widgets/PublicPageIntro.test.tsx` を作成し、以下を検証する失敗するテストを書く
  - 未ログイン（`user === null`）のとき、渡した `description` とアプリ名、ログイン操作（`GoogleSignInControl` 相当）が描画される
  - ログイン済み（`user` あり）のとき、何も描画しない（`null`）
- [ ] `src/presentation/widgets/PublicPageIntro.tsx` を実装してテストを通す
- [ ] スタイルを `landingTokens.ts` のトーンに合わせて整える（モバイルでコンパクトに収まることを目視確認）

## 2. `RegisterLoginDialog` ウィジェット

- [ ] `src/presentation/widgets/RegisterLoginDialog.test.tsx` を作成し、以下を検証する失敗するテストを書く
  - `open=true` のとき、`libraryNames` の内容とログイン操作が描画される
  - `open=false` のとき、何も表示されない
- [ ] `src/presentation/widgets/RegisterLoginDialog.tsx` を実装してテストを通す

## 3. `LibraryListPage` の登録フロー変更

- [ ] `LibraryListPage.test.tsx` に以下のケースを追加し、まず失敗させる
  - 未ログイン・1件以上選択済みの状態で「登録する」を押すと、`RegisterLoginDialog` が開き、選択が失われない（`selected` が保持される）こと
  - ダイアログ内でログイン（`signIn` 相当の操作）した後、`addAll` が選択していた図書館で自動的に呼ばれ、`/library` へ遷移すること
  - 既存の「ログイン済みで登録する」ケースが引き続き通ること（回帰確認）
  - `navigate('/')` へのフォールバックが発生しないこと
- [ ] `LibraryListPage.tsx` の `handleRegister` を設計どおりに変更し、テストを通す
  - `pendingRegister` 状態の追加
  - `useEffect` での「ログイン待ち → 自動登録」の実装
  - `RegisterLoginDialog` の呼び出し
- [ ] `<PublicPageIntro description="..." />` を `SubPageAppBar` 直下に追加する

## 4. `PrefectureSelectionPage` / `CitySelectionPage` へのバナー追加

- [ ] `PrefectureSelectionPage.test.tsx` に「未ログイン時にバナーが表示される／ログイン済み時は表示されない」テストを追加し、失敗させる
- [ ] `PrefectureSelectionPage.tsx` に `<PublicPageIntro description="..." />` を追加してテストを通す
- [ ] `CitySelectionPage.test.tsx` に同様のテストを追加し、失敗させる
- [ ] `CitySelectionPage.tsx` に `<PublicPageIntro description="..." />` を追加してテストを通す

## 5. 全体確認

- [ ] `npm test` が全て通る
- [ ] `npx tsc -b` が通る
- [ ] ブラウザ（Chrome integration tools）で未ログイン状態からの **コールドロード**（typed URL）で以下を確認
  - `/library/add` にバナーが表示される
  - `/library/add/:pref` にバナーが表示される
  - `/library/add/:pref/:city` にバナーが表示され、図書館選択→未ログインで登録→インラインログイン→選択保持のまま自動登録→`/library` 遷移、まで一連が動作する
- [ ] ログイン済み状態で同じ3URLに直接アクセスしても機能が壊れない（クエリが固まる等がない）ことを確認
- [ ] `docs/167-public-page-onboarding/requirements.md` の Acceptance Criteria を全てチェック

## 6. PR・レビュー・マージ

- [ ] PR 作成（本文に Test Plan として上記チェックリストを含める）
- [ ] self-review（Correctness / Readability / Performance / Security / Maintainability の観点）
- [ ] `scripts/watch-pr.sh <PR> && gh pr merge <PR> --squash --delete-branch`
- [ ] `cloudflare-pages.yml` の本番デプロイを `gh run watch` で監視
- [ ] `scripts/smoke.sh` を実行し全項目パス
- [ ] 本番で変更内容（バナー表示・登録フロー）を確認
- [ ] Issue #167 に検証結果を記録してクローズ
