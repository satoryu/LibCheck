# Issue #64: 図書館未登録時のオンボーディング体験改善

## Problem Statement

アプリインストール直後は図書館が未登録のため、`initialLocation: '/'` によってホーム画面（ISBN検索）が最初に表示される。しかし、図書館が未登録の状態ではISBN検索を行っても意味のある結果が得られず（`BookSearchResultPage` 上で「図書館が登録されていません」状態になる）、ユーザーは何もできずに困惑する。

ユーザーが最初にすべきことは図書館の登録であるが、現在の導線ではそれが自明でない。`LibraryManagementPage` の空状態UIは既に実装済みだが、ユーザーをそこへ誘導する仕組みがない。

## Requirements

### Functional Requirements

1. アプリ起動時（または図書館が未登録の状態でホーム画面を訪れた際）に、ユーザーを図書館登録へ誘導すること
2. 図書館が1件以上登録された後は、通常のホーム画面（ISBN検索UI）を表示すること
3. 図書館未登録時でも、ユーザーは BottomNavigationBar を通じて図書館タブや履歴タブに自由に移動できること
4. 図書館が未登録の状態でホームタブを表示したとき、ユーザーに「図書館を登録してください」という明確なメッセージと、登録画面へ遷移するボタンを提供すること

### Non-Functional Requirements

1. `registeredLibrariesProvider` の `AsyncValue` の loading / error / data 全ての状態を適切にハンドリングすること
2. 画面遷移はスムーズで、余計なリダイレクトループが発生しないこと
3. 既存の `LibraryManagementPage._buildEmptyState` の実装パターンと一貫性のあるUIとすること
4. 既存テストが引き続きパスすること

## Constraints

- `go_router` の `StatefulShellRoute.indexedStack` 構造を変更しないこと
- Riverpod の `AsyncNotifierProvider` パターンを維持すること
- 新規に専用のオンボーディング画面（独立ルート）は作らないこと（BottomNavigation の構造を壊すリスクを避ける）
- `LibraryManagementPage._buildEmptyState` を直接再利用または参考にすること

## Acceptance Criteria

1. 図書館が未登録の状態でアプリを起動すると、ホームタブに「図書館が登録されていません」旨のメッセージと登録ボタンが表示されること
2. 登録ボタンをタップすると `/library/add` に遷移すること
3. 図書館を1件以上登録してホームタブに戻ると、通常のISBN検索UI（バーコードスキャン・ISBN入力ボタン）が表示されること
4. 図書館未登録中も BottomNavigationBar の図書館タブ・履歴タブは通常どおり動作すること
5. `registeredLibrariesProvider` がローディング中は適切なローディング表示が出ること
6. `registeredLibrariesProvider` がエラーの場合は `ErrorStateWidget` が表示されること
7. 既存のすべてのテストがパスすること

## User Stories

- **新規ユーザーとして**、アプリを初めて起動したときに何をすべきかが一目でわかるので、迷わず図書館を登録してアプリを使い始めたい
- **ユーザーとして**、図書館を登録した後はすぐにISBN検索ができる状態になるので、スムーズに本の蔵書確認ができる
- **ユーザーとして**、ホーム画面から直接図書館登録に進めるので、タブを切り替えて探す手間が省ける
