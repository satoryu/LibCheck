# Issue #26: 検索履歴一覧・再検索 — 設計

## Architecture Overview

既存の `HistoryPlaceholderPage` を `SearchHistoryPage` に置き換える。Issue #25 で実装した `searchHistoryProvider` を利用してデータを表示する。

```mermaid
graph TB
    subgraph Presentation
        SHP[SearchHistoryPage]
        SHC[SearchHistoryCard<br/>widget]
        SHPV[searchHistoryProvider]
    end

    subgraph Domain
        SHE[SearchHistoryEntry]
    end

    SHP --> SHPV
    SHP --> SHC
    SHC --> SHE
    SHPV --> SHE

    SHP -->|タップ| BSRP[BookSearchResultPage<br/>/result/:isbn]
```

## Component Design

### `SearchHistoryPage` (StatelessWidget / ConsumerWidget)

既存の `HistoryPlaceholderPage` を置き換えるメイン画面。

**構成要素:**
- AppBar: タイトル「検索履歴」+ 全削除アクション（アイコンボタン）
- Body: `searchHistoryProvider` の状態に応じて表示を切り替え
  - Loading: `CircularProgressIndicator`
  - Error: エラーメッセージ + リトライボタン
  - Data (empty): 空状態メッセージ（アイコン + テキスト）
  - Data (non-empty): `ListView.builder` で `SearchHistoryCard` をリスト表示

### `SearchHistoryCard` (StatelessWidget)

履歴1件を表示するカードウィジェット。

**表示要素:**
- ISBN テキスト
- 検索日時（フォーマット済み）
- 蔵書状況サマリーバッジ（最も良い `AvailabilityStatus` をバッジ表示）

**操作:**
- タップ: `/result/:isbn` に遷移して再検索
- スワイプ（Dismissible）: 個別削除（確認スナックバー付き）

### 日時フォーマット

`SearchHistoryEntry.searchedAt` を以下のルールで表示:
- 今日: 「HH:mm」
- 昨日: 「昨日」
- 2〜7日前: 「○日前」
- それ以上: 「yyyy/MM/dd」

## Data Flow

### 履歴一覧表示フロー

```mermaid
sequenceDiagram
    participant User
    participant SHP as SearchHistoryPage
    participant Prov as searchHistoryProvider
    participant Repo as SearchHistoryRepository

    User->>SHP: 「履歴」タブをタップ
    SHP->>Prov: watch(searchHistoryProvider)
    Prov->>Repo: getAll()
    Repo-->>Prov: List<SearchHistoryEntry>
    Prov-->>SHP: AsyncValue<List<SearchHistoryEntry>>
    SHP->>SHP: ListView.builder で表示
```

### 再検索フロー

```mermaid
sequenceDiagram
    participant User
    participant SHP as SearchHistoryPage
    participant Router as GoRouter
    participant BSRP as BookSearchResultPage

    User->>SHP: 履歴カードをタップ
    SHP->>Router: context.push('/result/$isbn')
    Router->>BSRP: BookSearchResultPage(isbn: isbn)
    BSRP->>BSRP: 蔵書検索を実行（既存フロー）
    Note over BSRP: 検索完了時に履歴も自動更新される（Issue #25）
```

### 個別削除フロー

```mermaid
sequenceDiagram
    participant User
    participant SHP as SearchHistoryPage
    participant Prov as SearchHistoryNotifier

    User->>SHP: 履歴カードをスワイプ
    SHP->>Prov: remove(isbn)
    Prov-->>SHP: 更新された履歴リスト
    SHP->>User: スナックバーで削除通知
```

## Domain Models

既存の `SearchHistoryEntry` モデル（Issue #25）をそのまま使用。追加のモデルは不要。
