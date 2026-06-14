/**
 * Amazon アソシエイト（アフィリエイト）タグ。
 *
 * ビルド時の環境変数 `VITE_AMAZON_ASSOCIATE_TAG` から取得し、未設定なら空文字。
 * - ローカル開発（`.env` 未設定）: 空 → 通常リンク
 * - 本番ビルド（デプロイワークフローで注入）: タグ付きアフィリエイトリンク
 *
 * タグは生成される URL に必ず現れる公開値のため、`VITE_` プレフィックスで
 * クライアントバンドルに含めて問題ない（Calil の app key とは性質が異なる）。
 */
export const AMAZON_ASSOCIATE_TAG = (
  import.meta.env.VITE_AMAZON_ASSOCIATE_TAG ?? ''
).trim();
