# Design — #163 地域ページが初回読み込みで固まる問題の修正

## Problem

`RootAuthGate`（#157）の副作用:

```tsx
useEffect(() => {
  if (user === null) queryClient.clear();
}, [user, queryClient]);
```

`AuthProvider` は初回マウント時、セッション復元（`GET /api/me`）が完了するまで必ず一瞬 `user: null` を返す（`useState<User | null>(initialUser)` の既定値、`initialUser` 未指定時は `null`）。

#157 時点ではこれは無害だった。当時 `PUBLIC_PATHS` は空で、`user === null` の間は常に `LandingPage`（データ取得を行わない）しか描画されなかったため。

#158 で `/library/add/:pref` 系が公開ルートになったことで、`user === null` の間も `<Outlet/>` 経由で `CitySelectionPage` 等が描画され、`useCityList`（`useQuery`）がマウント直後にデータ取得を開始するようになった。復元待ちの一瞬の `null` を検知した `RootAuthGate` の effect が `queryClient.clear()` を呼び、子が開始したばかりのクエリの購読を破壊する。結果、データ取得自体は成功する（実測: 手動 fetch は常に一瞬で成功）にもかかわらず、React Query 側の状態が「読み込み中」から進まなくなる。

SPA内遷移（既に起動済みのアプリ内で `/library/add` から都道府県をクリック等）では `user` の値が遷移の前後で変化しないため、この effect は再発火せず、問題が起きない。フルナビゲーション（直接URL・外部リンク・リロード）でのみ発生する。

## Fix

`RootAuthGate` に「直前の `user` の値」を `useRef` で保持し、**実際に非null→nullへ遷移したとき（＝本物のログアウト）だけ** `queryClient.clear()` を呼ぶよう変更した。

```tsx
const previousUserRef = useRef(user);

useEffect(() => {
  if (previousUserRef.current !== null && user === null) {
    queryClient.clear();
  }
  previousUserRef.current = user;
}, [user, queryClient]);
```

初回マウント時は `previousUserRef.current` の初期値も `user`（＝ `null`）と同じため、条件 `previousUserRef.current !== null` が false になり、クリアはスキップされる。以降、ログインが確定して `user` が非nullになれば `previousUserRef.current` もそれに追従し、その後 `signOut()` で本当に `null` に遷移したときだけクリアが発火する（既存の「ログアウトで他ユーザーのデータを残さない」という目的は保持）。

## テスト

`RootAuthGate.test.tsx` に2ケースを追加・改修:
- 実際のログアウト遷移（ログイン済み→`signOut()`）でクリアされることを、`useAuth().signOut()` を呼ぶテスト用コンポーネントで再現して検証（既存テストは初回マウント状態のみで検証しており、修正後の意図と矛盾するため書き換えた）
- 初回マウント時の未確定 `null`（公開ルートに未ログインでアクセス）ではクリアされないことを検証（#163 の回帰テスト）

## 検証

- `npx wrangler pages dev` + Claude in Chrome で、SW/キャッシュを完全にクリアした状態から `/library/add/東京都` および `/library/add/東京都/大田区` をフルナビゲーション（直接URL）で複数回開き、いずれも正しく一覧が表示されることを確認した。
