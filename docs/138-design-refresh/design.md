# #138 デザイン刷新 — Design（Phase 1: テーマ基盤）

## 方針

LP（#113）で確立した Knowledge Cartography のトークンを**共有トークンに昇格**し、
MUI テーマに統合する。署名的な大胆さは Phase 2（図書カード）に取っておき、
Phase 1 は「静かな地の統一」に徹する。ダークモードはスコープ外。

## トークン（`src/presentation/theme/tokens.ts`・新規）

LP の `landingTokens.ts` の値をそのまま正本化:

| トークン | 値 | 用途 |
| --- | --- | --- |
| `verdigris` | `#0E3B36` | AppBar・フッター等の濃色面 |
| `teal` | `#00796B` | primary（既存どおり） |
| `parchment` | `#F4F1E8` | アプリ背景（`background.default`） |
| `card` | `#FBF8F0` | カード面（`background.paper`） |
| `brass` | `#B8894B` | カード罫・ラベル |
| `stampRed` | `#C0392B` | スタンプ（Phase 2 で使用） |
| `ink` / `inkSoft` | `#23302D` / `#5A6360` | 文字 |

書体: `KC_SERIF`（明朝・見出し）/ `KC_MONO`（等幅・ISBN 等のデータ）。すべて system フォント（追加読み込みなし・CSP 不変）。

## MUI テーマ統合（`src/theme.ts`）

- `palette.background`: default=parchment / paper=card
- `palette.text`: primary=ink / secondary=inkSoft
- `typography`: h5/h6/subtitle1 を明朝（KC_SERIF・600）に。本文は BIZ UDGothic 維持
- `components`:
  - `MuiAppBar`: colorPrimary の背景を verdigris（LP フッターと同じ濃緑の帯）
  - `MuiCard`: 真鍮の細罫 + 控えめな影（LP のカードと同じ佇まい）
- success/warning/error は既存値を維持（#95 P1-3 のトークン）

## LP の重複解消

`landingTokens.ts` は共有トークンの re-export に変更（LP コンポーネントは無改修）。

## 検証

- 全テスト緑（文言・挙動ベースのテストのためテーマ変更で壊れない想定）
- dev サーバを起動し Chrome で目視（ランディング→モックログイン→ホーム/図書館/履歴/結果）
- メンテナーのローカル目視 → マージ → 本番確認
