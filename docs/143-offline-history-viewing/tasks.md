# #143 — Tasks（TDD）

- [x] 1. `pwa.test.ts` を更新し、runtimeCaching が registered-libraries/search-history を
      NetworkFirst でキャッシュし、Calil を対象外にすることを検証するテストを先に赤にする
- [x] 2. `vite.config.ts` に `workbox.runtimeCaching` を追加してテストを緑にする。
      `npm run build` で `dist/sw.js` を検査し、`registerRoute` が意図どおり
      シリアライズされていることを確認
- [x] 3. `AppShell.test.tsx` に図書館・履歴タブでの拡張バナー文言のテストを追加 → `AppShell.tsx` を実装
- [x] 4. `offlineCache.test.ts`（`clearOfflineApiCache`）を先に書く → `offlineCache.ts` を実装
- [x] 5. `AuthProvider.test.tsx` に signOut がキャッシュ削除を呼ぶテストを追加 → `AuthProvider.tsx` に配線
- [x] 6. `npx tsc -b` / `npm test` 緑（381 tests）
- [x] 7. dev + Chrome で `navigator.onLine` スタブによりバナー文言の出し分けを確認
- [x] 8. PR #147 を作成 → CI green → `scripts/watch-pr.sh 147 && gh pr merge --squash --delete-branch`
- [x] 9. DoD: 本番デプロイを `gh run watch` で確認 → `scripts/smoke.sh` 13/13 PASS
- [x] 10. 本番で `/library`・`/history` を閲覧し `api-user-data` キャッシュに実データが入ることを確認、
       ログアウトでキャッシュが削除されることを確認 → Issue #143 に検証結果を記録してクローズ

## 積み残し・分かっている制約
- ブラウザ自動化環境に DevTools 相当のネットワークレベル遮断 API が無く、「実際に電波を切った状態で
  SW が NetworkFirst のフォールバックとしてキャッシュを返す」という一次動作そのものは
  end-to-end 再現できていない（`window.fetch` のスタブは SW 自身のフェッチには届かないため）。
  生成された `sw.js` の設定検証 + 実データがキャッシュに書き込まれていることの確認で代替した
- 「最終更新: ○分前」等の正確な相対時刻表示は見送り（design.md 参照）
