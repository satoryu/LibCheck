# #144 オフライン中にスキャンした ISBN を貯めて復帰後に自動検索 — Tasks

TDD（テスト先行）で、依存の内側（domain）から外側（presentation）の順に進める。

- [x] T1: `PendingScan` モデルと `PendingScanRepository` インターフェースを追加
      （`src/domain/models/pendingScan.ts` / `src/domain/repositories/pendingScanRepository.ts`）
- [x] T2: `PendingScanRepositoryImpl`（localStorage 実装）をテスト先行で実装
      （getAll / add の重複排除 / remove / 壊れた JSON の空配列フォールバック /
      scannedAt の ISO 往復）
- [x] T3: `src/app/dependencies` に `pendingScanRepository` を配線
- [x] T4: `usePendingScans` / `usePendingScanMutations` フックをテスト先行で実装
      （キャッシュ直接更新の検証）
- [x] T5: 履歴ステータス変換 `availabilityToHistoryStatuses` を
      `BookSearchResultPage.useSaveHistoryOnResult` から抽出（リファクタリング。
      既存テストが緑のまま維持されることを確認）
- [x] T6: `usePendingScanProcessor` をテスト先行で実装
      （オンライン&キューあり&図書館ありで一括検索 / 成功分の履歴保存とキュー削除 /
      失敗時はキュー維持 / 多重実行ガード / 図書館0件では何もしない /
      bookAvailability キャッシュへの反映）
- [x] T7: `BarcodeScannerPage` のオフライン分岐をテスト先行で実装
      （オフライン時: add + snackbar + スキャン継続 / オンライン時: 従来遷移）
- [x] T8: `HomePage` の保留中カードをテスト先行で実装（0件で非表示 / N件表示 / 削除）
- [x] T9: `AppShell` に `usePendingScanProcessor` をマウント
- [x] T10: `npx tsc -b` / `npm test` 全緑を確認（74ファイル・412テスト）
- [x] T11: ブラウザで一連の流れを検証（Chrome 実ブラウザ + dev サーバ + 実 Calil API）
      - 保留カード（件数・ISBN・読取時刻・削除ボタン・説明文）の表示 ✅
      - 起動時の自動検索 → 完了スナックバー → 履歴へ分館単位ステータスで保存 →
        キュー空化（`/api/search-history` の実データで確認）✅
      - キューの localStorage 永続化（リロード跨ぎ）✅
      - 検証中に React Query v5 の networkMode 既定値によるオフライン時
        一時停止バグを発見 → `networkMode: 'always'` で修正 + 回帰テスト追加
      - カメラ実スキャンは自動化環境では不可（ユニットテストで担保）。
        実機（機内モード）での通し確認は PR の Test Plan に記載
- [ ] T12: PR 作成（Test Plan 付き）→ セルフレビュー → CI 緑 → マージ →
      本番デプロイ監視 → `scripts/smoke.sh` → 本番で挙動確認 → Issue へ記録
