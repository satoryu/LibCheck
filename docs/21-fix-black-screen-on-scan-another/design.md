# 設計: 「別の本をスキャンする」ボタンで画面が真っ黒になるバグ修正 (#21)

## Architecture Overview

GoRouterには2つの主要な遷移メソッドがある：
- `context.go()`: 現在のルートを**置き換える**（スタックから消える）
- `context.push()`: 現在のルートの上に**積む**（スタックに残る）

本修正では、`BarcodeScannerPage`の遷移を`go()`から`push()`に変更する。

## Data Flow

### 修正前（バグあり）

```mermaid
sequenceDiagram
    participant Home as / (Home)
    participant Scan as /scan
    participant Result as /result/:isbn

    Home->>Scan: push /scan
    Note over Home,Scan: Stack: [/, /scan]
    Scan->>Result: go /result/:isbn (replaces /scan!)
    Note over Home,Result: Stack: [/, /result/:isbn]
    Result--xHome: pop() → / がpopされて黒画面!
```

### 修正後

```mermaid
sequenceDiagram
    participant Home as / (Home)
    participant Scan as /scan
    participant Result as /result/:isbn

    Home->>Scan: push /scan
    Note over Home,Scan: Stack: [/, /scan]
    Scan->>Result: push /result/:isbn
    Note over Home,Result: Stack: [/, /scan, /result/:isbn]
    Result->>Scan: pop() → /scan に戻る
    Note over Home,Scan: Stack: [/, /scan]
```

## Component Design

変更対象: `BarcodeScannerPage._navigateToResult()`

変更前: `context.go('/result/$isbn');`
変更後: `context.push('/result/$isbn');`
