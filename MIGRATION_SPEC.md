# LibCheck — Flutter → React (Vite) Migration Spec

This is the **authoritative contract** for porting the Flutter app at repo root
(`lib/`, `test/`) into a Vite + React + TypeScript web app under `react-app/`.
Every agent MUST read this file first and follow the file paths, export names,
and signatures **exactly** so independently-written modules integrate.

The original Flutter source stays in place (`/Users/satoutatsuya/Projects/private/libcheck/lib`
and `/test`) — read it for behavior. Do NOT modify Flutter files. All new code goes
under `/Users/satoutatsuya/Projects/private/libcheck/react-app/`.

## Tech stack (exact)

- Build: **Vite 6** + **TypeScript 5.7** (strict mode), React 18.
- UI: **MUI v6** (`@mui/material`, `@emotion/react`, `@emotion/styled`) + `@mui/icons-material`.
- Routing: **react-router-dom v7** (`createBrowserRouter` / `<RouterProvider>`; tests use `createMemoryRouter`).
- Server/async + persisted state: **@tanstack/react-query v5**.
- Snackbars (incl. undo action): **notistack v3** (`SnackbarProvider`, `enqueueSnackbar`).
- Barcode scanning: **@zxing/browser** + **@zxing/library**.
- Tests: **vitest 2** + **@testing-library/react** + **@testing-library/user-event** +
  **@testing-library/jest-dom** + **jsdom**.

## Conventions

- TypeScript strict. **Named exports** for everything (no default exports) except React
  page/widget components which use **named exports** too (e.g. `export function HomePage()`).
- File naming: domain/data/hooks/utils = `camelCase.ts`; React components = `PascalCase.tsx`.
- Tests co-located next to the file under test: `foo.ts` → `foo.test.ts`, `Foo.tsx` → `Foo.test.tsx`.
- Imports use the `@/` alias = `react-app/src/` (configured in vite + tsconfig + vitest).
- Japanese UI strings must be copied **verbatim** from the Flutter source.
- No `Date.now()` concerns here (that limitation is only for workflow scripts, not app code).

## Directory layout (under react-app/src)

```
main.tsx                         App bootstrap (createRoot, providers, RouterProvider)
App.tsx                          Provider tree wrapper: <Deps><QueryClient><Snackbar><Theme><SelectedLibs>{children}
theme.ts                         MUI theme (seed color #00796B, M3, font BIZUDGothic)
queryClient.ts                   makeQueryClient(): QueryClient factory (tests get fresh client)
vite-env.d.ts

app/
  dependencies.tsx               DI: AppDependencies, DependenciesProvider, useDeps, createDefaultDependencies
  router.tsx                     routes array (export `routes`) + createAppRouter()

domain/
  models/
    library.ts                   Library
    availabilityStatus.ts        AvailabilityStatus enum + helpers
    libraryStatus.ts             LibraryStatus
    bookAvailability.ts          BookAvailability
    searchHistoryEntry.ts        SearchHistoryEntry
  data/
    japanesePrefectures.ts       RegionGroup, JAPANESE_PREFECTURE_REGIONS, allPrefectures
  utils/
    isbnValidator.ts             isbnValidator (object of functions)
  repositories/                  TS interfaces only
    libraryRepository.ts         LibraryRepository
    registeredLibraryRepository.ts  RegisteredLibraryRepository
    searchHistoryRepository.ts   SearchHistoryRepository
    localStorageRepository.ts    LocalStorageRepository

data/
  datasources/
    calilApiConfig.ts            CALIL_API_CONFIG
    calilApiClient.ts            CalilApiClient
  exceptions/
    calilApiException.ts         CalilApiException + subclasses
  models/
    checkResponse.ts             CheckResponse, BookSystemStatus
    libraryResponse.ts           LibraryResponse
  repositories/
    libraryRepositoryImpl.ts     LibraryRepositoryImpl
    registeredLibraryRepositoryImpl.ts
    searchHistoryRepositoryImpl.ts
    localStorageRepositoryImpl.ts   WebLocalStorageRepository (localStorage-backed)

presentation/
  theme/appColors.ts             APP_COLORS
  utils/errorMessageResolver.ts  resolveErrorMessage(error): string
  hooks/
    useCityList.ts               useCityList(pref)
    useLibraryList.ts            LibraryListParam type, useLibraryList(param)
    useBookAvailability.ts       useBookAvailability(isbn)
    useRegisteredLibraries.ts    useRegisteredLibraries() + useRegisteredLibraryMutations()
    useSearchHistory.ts          useSearchHistory() + useSearchHistoryMutations()
    useSelectedLibraries.tsx     SelectedLibrariesProvider + useSelectedLibraries()
  widgets/
    AvailabilityStatusBadge.tsx
    LibraryAvailabilityCard.tsx
    SearchHistoryCard.tsx
    ErrorStateWidget.tsx
    CameraErrorWidget.tsx
    CameraPermissionErrorWidget.tsx
    ScanOverlayWidget.tsx
  pages/
    AppShell.tsx
    HomePage.tsx
    IsbnInputPage.tsx
    LibraryManagementPage.tsx
    PrefectureSelectionPage.tsx
    CitySelectionPage.tsx
    LibraryListPage.tsx
    BookSearchResultPage.tsx
    SearchHistoryPage.tsx
    BarcodeScannerPage.tsx

test/
  testUtils.tsx                  renderWithProviders, makeFakeDeps, FakeLocalStorageRepository
  setup.ts                       vitest setup (jest-dom, etc.)
```

## Domain models (exact shapes)

### Library (`domain/models/library.ts`)
Plain readonly type + helpers. Fields (all `string` unless noted):
`systemId, systemName, libKey, libId, shortName, formalName, address, pref, city, category`,
optional `url?, tel?, geocode?`.
- `export interface Library { ... }`
- `libraryFromJson(json: Record<string, unknown>): Library` — maps the SAME keys the Dart `Library.fromJson` uses (camelCase keys: `systemId, systemName, libKey, libId, shortName, formalName, address, pref, city, category, url, tel, geocode`). Throw if a required string is missing (mirror Dart `as String`).
- `libraryToJson(lib: Library): Record<string, unknown>` — same keys, includes nulls for url/tel/geocode.
- `librariesEqual(a, b): boolean` — equality by `systemId && libKey && libId` (mirrors Dart `==`).
- `libraryKey(lib): string` — stable key `${systemId}|${libKey}|${libId}` for dedup/React keys/Set membership.

### AvailabilityStatus (`domain/models/availabilityStatus.ts`)
TS string-union or string enum. Use a **string enum**:
```ts
export enum AvailabilityStatus {
  available='available', inLibraryOnly='inLibraryOnly', checkedOut='checkedOut',
  reserved='reserved', preparing='preparing', closed='closed', notFound='notFound',
  error='error', unknown='unknown',
}
```
Helpers (exact behavior from Dart `availability_status.dart`):
- `availabilityPriority(s): number` (available 8 … unknown 0).
- `isReservable(s): boolean` (true for available|inLibraryOnly|checkedOut|reserved|preparing).
- `availabilityFromApiString(value: string): AvailabilityStatus` — map: `'貸出可'|'蔵書あり'→available`, `'館内のみ'→inLibraryOnly`, `'貸出中'→checkedOut`, `'予約中'→reserved`, `'準備中'→preparing`, `'休館中'→closed`, `'蔵書なし'|''→notFound`, default→unknown.
- `aggregateAvailability(statuses: AvailabilityStatus[]): AvailabilityStatus` — empty→notFound, else max by priority.
- `availabilityFromName(name: string): AvailabilityStatus` — reverse of enum value name (used by SearchHistory; mirror Dart `AvailabilityStatus.values.byName`). Throw on unknown name.

### LibraryStatus (`domain/models/libraryStatus.ts`)
`export interface LibraryStatus { systemId: string; status: AvailabilityStatus; reserveUrl?: string; libKeyStatuses: Record<string,string>; }`
- `statusForLibKey(ls: LibraryStatus, libKey: string): AvailabilityStatus` — if `libKeyStatuses[libKey]` missing → notFound, else `availabilityFromApiString(...)`.

### BookAvailability (`domain/models/bookAvailability.ts`)
`export interface BookAvailability { isbn: string; libraryStatuses: Record<string, LibraryStatus>; }`

### SearchHistoryEntry (`domain/models/searchHistoryEntry.ts`)
`export interface SearchHistoryEntry { isbn: string; searchedAt: Date; libraryStatuses: Record<string,string>; }`
(`libraryStatuses` values are AvailabilityStatus **enum-name strings**, e.g. "available".)
- `searchHistoryEntryFromJson(json)` — `isbn` string, `searchedAt: new Date(json.searchedAt)`, `libraryStatuses` copied.
- `searchHistoryEntryToJson(e)` — `searchedAt: e.searchedAt.toISOString()`.
- `searchHistoryEntriesEqual(a,b)` — by `isbn` only (mirror Dart `==`).

### japanesePrefectures (`domain/data/japanesePrefectures.ts`)
Port `lib/domain/data/japanese_prefectures.dart` verbatim:
`export interface RegionGroup { name: string; prefectures: string[]; }`
`export const JAPANESE_PREFECTURE_REGIONS: RegionGroup[] = [...]` (all 7 regions, exact JP strings).
`export const allPrefectures: string[]` (flatten).

### isbnValidator (`domain/utils/isbnValidator.ts`)
Export an object `export const isbnValidator = { isValidIsbn13, isValidIsbn10, isValidIsbn, normalizeIsbn, getValidationMessage }`.
Port logic + Japanese messages **exactly** from `lib/domain/utils/isbn_validator.dart`.
`getValidationMessage(value: string): string | null`.

## Data layer

### calilApiException (`data/exceptions/calilApiException.ts`)
Base `export class CalilApiException extends Error` with `name` set. Subclasses:
`CalilNetworkException`, `CalilHttpException` (extra `statusCode: number`), `CalilParseException`,
`CalilTimeoutException`. Each sets `this.name`. Use these for `instanceof` checks elsewhere.

### calilApiConfig (`data/datasources/calilApiConfig.ts`)
```ts
export const CALIL_API_CONFIG = {
  appKey: import.meta.env.VITE_CALIL_APP_KEY ?? '',
  baseUrl: import.meta.env.VITE_CALIL_BASE_URL ?? '/api/calil',  // dev proxy path; see vite.config
  pollingIntervalMs: 2000,
  maxPollingCount: 30,
  httpTimeoutMs: 10000,
};
```
NOTE: Browser CORS — real calls go through the Vite dev proxy `/api/calil` → `https://api.calil.jp`.

### checkResponse / libraryResponse (`data/models/`)
Mirror the Dart `fromJson` parsers exactly (note the Calil API uses **lowercase snake** keys:
`systemid, systemname, libkey, libid, short, formal, url_pc, address, pref, city, post, tel, geocode, category`
for library; and `session, continue, books, status, reserveurl, libkey` for check).
- `CheckResponse { session: string; continueFlag: number; books: Record<string, Record<string, BookSystemStatus>>; }`
  with `checkResponseFromJson(json)`.
- `BookSystemStatus { status: string; reserveUrl?: string; libKeys: Record<string,string>; }`
  with `bookSystemStatusFromJson(json)`. `reserveUrl` = `reserveurl` only if non-empty.
- `LibraryResponse { ...camelCase fields... urlPc?, post? }` with `libraryResponseFromJson(json)`.

### CalilApiClient (`data/datasources/calilApiClient.ts`)
Port `lib/data/datasources/calil_api_client.dart`. Constructor options object:
```ts
export interface CalilApiClientOptions {
  appKey: string;
  fetchFn?: typeof fetch;        // injectable for tests (default: globalThis.fetch.bind(globalThis))
  baseUrl?: string;              // default CALIL_API_CONFIG.baseUrl
  pollingIntervalMs?: number;    // default CALIL_API_CONFIG.pollingIntervalMs
  maxPollingCount?: number;      // default CALIL_API_CONFIG.maxPollingCount
  httpTimeoutMs?: number;        // default CALIL_API_CONFIG.httpTimeoutMs
}
export class CalilApiClient {
  constructor(options: CalilApiClientOptions) {...}
  async searchLibraries(args: { pref: string; city?: string }): Promise<LibraryResponse[]>
  async checkAvailability(args: { isbn: string[]; systemIds: string[] }): Promise<CheckResponse>
}
```
Behavior to mirror exactly:
- Query params for `/library`: `appkey, pref, format=json, callback=no, [city]`. Expect a JSON **array**; non-array → `CalilParseException`.
- `/check`: params `appkey, isbn=join(','), systemid=join(','), format=json, callback=no`. Then **poll** while `continueFlag===1` and `pollCount < maxPollingCount`, waiting `pollingIntervalMs` between polls (use a `delay(ms)` helper; in tests interval is 0). Poll params: `appkey, session, format=json, callback=no`. If still `continue===1` after max → `CalilTimeoutException`.
- HTTP: use `fetchFn`, apply a timeout via `AbortController` (`httpTimeoutMs`). Non-200 → `CalilHttpException(message, statusCode)`. Network/abort errors → `CalilNetworkException`. JSON parse failure → `CalilParseException`. Re-throw `CalilApiException` subclasses unchanged.
- IMPORTANT for tests: `fetchFn` returns a standard `Response`. Tests will supply a mock `fetchFn` that inspects `input` (string URL) and returns `new Response(JSON.stringify(...), {status, headers})`. Parse via `await response.text()` then `JSON.parse`.

### Repository interfaces (`domain/repositories/*.ts`)
- `LocalStorageRepository`: `getString(key): Promise<string|null>; setString(key,value): Promise<void>; getStringList(key): Promise<string[]|null>; setStringList(key,value): Promise<void>; remove(key): Promise<void>;`
- `LibraryRepository`: `getLibraries(args:{pref:string; city?:string}): Promise<Library[]>; checkBookAvailability(args:{isbn:string[]; systemIds:string[]}): Promise<BookAvailability[]>;`
- `RegisteredLibraryRepository`: `getAll(): Promise<Library[]>; saveAll(libraries): Promise<void>; add(library): Promise<Library[]>; addAll(libraries): Promise<Library[]>; remove(library): Promise<Library[]>;`
- `SearchHistoryRepository`: `getAll(): Promise<SearchHistoryEntry[]>; save(entry): Promise<void>; remove(isbn): Promise<void>; removeAll(): Promise<void>;`

### Repository impls (`data/repositories/*.ts`)
- `WebLocalStorageRepository implements LocalStorageRepository` — backed by `window.localStorage` (async wrappers). `getStringList`/`setStringList` store JSON arrays.
- `LibraryRepositoryImpl implements LibraryRepository` — constructed with `{ apiClient: CalilApiClient }`. Mirror `library_repository_impl.dart`: map LibraryResponse→Library (`url: urlPc`); for availability, build `LibraryStatus` per system by aggregating libKey statuses (`availabilityFromApiString` + `aggregateAvailability`).
- `RegisteredLibraryRepositoryImpl implements RegisteredLibraryRepository` — ctor `(localStorage: LocalStorageRepository)`, storage key `'registered_libraries'`. Dedup via `librariesEqual`. JSON parse errors → return `[]`.
- `SearchHistoryRepositoryImpl implements SearchHistoryRepository` — ctor `(localStorage)`, key `'search_history'`, max 100. `getAll` sorts by `searchedAt` desc. `save` removes existing same-isbn, adds, sorts desc, trims to 100. Parse errors → `[]`.

## Presentation: DI, hooks, state

### dependencies.tsx (`app/dependencies.tsx`)
```ts
export interface AppDependencies {
  localStorageRepository: LocalStorageRepository;
  calilApiClient: CalilApiClient;
  libraryRepository: LibraryRepository;
  registeredLibraryRepository: RegisteredLibraryRepository;
  searchHistoryRepository: SearchHistoryRepository;
}
export function createDefaultDependencies(): AppDependencies  // real impls (WebLocalStorage, fetch-backed client)
export const DependenciesProvider: React.FC<{ value: AppDependencies; children: React.ReactNode }>
export function useDeps(): AppDependencies   // throws if missing provider
```
This is the React analog of Riverpod provider overrides — tests inject fake deps here.

### React Query mapping (the Riverpod providers)
QueryClient key conventions:
- registered libraries: `['registeredLibraries']`
- search history: `['searchHistory']`
- cities: `['cities', pref]`
- library list: `['libraries', pref, city]`
- book availability: `['bookAvailability', isbn]`

Hooks:
- `useCityList(pref: string)` → `useQuery({queryKey:['cities',pref], queryFn: async () => { const libs = await deps.libraryRepository.getLibraries({pref}); return Array.from(new Set(libs.map(l=>l.city))).sort(); }})`. Returns `UseQueryResult<string[]>`.
- `useLibraryList(param: LibraryListParam)` where `LibraryListParam = { pref: string; city: string }` → `useQuery({queryKey:['libraries',param.pref,param.city], queryFn: () => deps.libraryRepository.getLibraries({pref:param.pref, city:param.city})})`. Returns `UseQueryResult<Library[]>`.
- `useBookAvailability(isbn: string)` → query keyed `['bookAvailability', isbn]`; queryFn: read registered libraries (via `deps.registeredLibraryRepository.getAll()` or the cached query), compute unique systemIds; if empty return `[]`; else `deps.libraryRepository.checkBookAvailability({isbn:[isbn], systemIds})`. Use `enabled` appropriately. Returns `UseQueryResult<BookAvailability[]>`.
- `useRegisteredLibraries()` → `useQuery({queryKey:['registeredLibraries'], queryFn: () => deps.registeredLibraryRepository.getAll()})`.
- `useRegisteredLibraryMutations()` → returns `{ add, addAll, remove }` each a function returning a promise; implemented with `useMutation` or direct calls that, on success, `queryClient.setQueryData(['registeredLibraries'], updated)`. (`add`/`addAll`/`remove` repo methods return the updated list.)
- `useSearchHistory()` → query `['searchHistory']` → `deps.searchHistoryRepository.getAll()`.
- `useSearchHistoryMutations()` → `{ save(entry), remove(isbn), removeAll() }`; after each, refetch/setQueryData `['searchHistory']` (save/remove → `getAll()` again; removeAll → `[]`).
- `useSelectedLibraries()` (`useSelectedLibraries.tsx`) — React context holding `Set<string>`? No: hold `Library[]` selection with toggle/clear. Provide:
  `SelectedLibrariesProvider` (wraps app) and `useSelectedLibraries(): { selected: Library[]; isSelected(lib): boolean; toggle(lib): void; clear(): void; }`. Membership via `libraryKey`. This mirrors Riverpod `selectedLibrariesProvider` (ephemeral, not persisted).

### appColors (`presentation/theme/appColors.ts`)
```ts
export const APP_COLORS = { success:'#2E7D32', warning:'#EF6C00', error:'#D32F2F', inactive:'#9E9E9E' };
```

### errorMessageResolver (`presentation/utils/errorMessageResolver.ts`)
`export function resolveErrorMessage(error: unknown): string` — `instanceof` checks mirroring Dart:
Network→'インターネット接続を確認してください', Timeout→'応答に時間がかかっています。再度お試しください',
Http→'サーバーとの通信に失敗しました', Parse→'データの読み取りに失敗しました', else→'エラーが発生しました'.

## Routing (`app/router.tsx`)
react-router-dom v7. Routes (mirror `app_router.dart`). The three tabbed pages share `<AppShell>`
(MUI BottomNavigation). `AppShell` renders `<Outlet/>` + bottom nav with tabs ホーム(/), 図書館(/library), 履歴(/history).
Redirect rule: when registered libraries list is **empty** and the user is at `/`, redirect to `/library`
(implement via a small guard in HomePage or a loader/wrapper that uses `useRegisteredLibraries`; keep it
simple — a redirect inside the `/` element when data is loaded and empty).

Route table:
- `/` (shell) → HomePage
- `/library` (shell) → LibraryManagementPage
- `/history` (shell) → SearchHistoryPage
- `/library/add` → PrefectureSelectionPage
- `/library/add/:pref` → CitySelectionPage (reads `:pref`)
- `/library/add/:pref/:city` → LibraryListPage (reads `:pref`,`:city`)
- `/scan` → BarcodeScannerPage
- `/isbn-input` → IsbnInputPage
- `/result/:isbn` → BookSearchResultPage (reads `:isbn` and `?source=` query). If `:isbn` empty → redirect `/`.

Navigation: use `useNavigate()`. `context.push(x)` → `navigate(x)`. `context.go(x)` → `navigate(x, {replace:true})`.
"別の本を検索/スキャン" pop button → `navigate(-1)`.

## Native feature mapping
- `shared_preferences` → `localStorage` via `WebLocalStorageRepository`.
- `http` → `fetch` (injected into `CalilApiClient`).
- `url_launcher` `launchUrl(externalApplication)` → `window.open(url, '_blank', 'noopener,noreferrer')`. Keep the http/https **scheme validation** (`LibraryAvailabilityCard`): only open if parsed URL scheme is http/https.
- `HapticFeedback.mediumImpact()` → `navigator.vibrate?.(50)` (guarded).
- `mobile_scanner` → `@zxing/browser` `BrowserMultiFormatReader.decodeFromVideoDevice`. See BarcodeScannerPage section.
- Material widgets → MUI equivalents (AppBar/Toolbar, Button contained/outlined/text, BottomNavigation, Card, List/ListItemButton, Checkbox, Dialog, Snackbar via notistack, CircularProgress, TextField).
- Material Icons → `@mui/icons-material` (Home, LocalLibrary, History, QrCodeScanner, Keyboard, MenuBook, Add, Close, Search, ChevronRight, Book, ErrorOutline, CheckCircle, Schedule, Block, RemoveCircleOutline, HelpOutline, FlashOn, FlashOff, CameraAltOutlined, VideocamOffOutlined, Settings, DeleteSweep, Delete, Refresh, CameraAlt).

## Widgets (port 1:1; read the Dart widget for exact strings/layout)
- `AvailabilityStatusBadge({ status })` — icon+label+color per status (see `availability_status_badge.dart`). Use APP_COLORS and MUI icons. Labels JP verbatim: available '貸出可能', inLibraryOnly '館内のみ', checkedOut '貸出中', reserved '予約中', preparing '準備中', closed '休館中', notFound '蔵書なし', error 'エラー', unknown '不明'.
- `LibraryAvailabilityCard({ library, status })` — Card; name, `${pref}${city}`, badge via `statusForLibKey(status, library.libKey)`; show 予約する button only if a safe http/https `reserveUrl` exists AND `isReservable(statusForLibKey(...))`. Button → `window.open`.
- `SearchHistoryCard({ entry, onTap, now? })` — Card/InkWell→ButtonBase or clickable Card; `ISBN: ${entry.isbn}`, relative date via same logic as `search_history_card.dart` (`_formatDate`: same day→HH:mm, 1日→'昨日', ≤7→'N日前', else→YYYY/MM/DD). `now?: Date` injectable for tests. Best status via `aggregateAvailability(values.map(availabilityFromName))` (empty→notFound). Badge + chevron.
- `ErrorStateWidget({ error, onRetry })` — centered error icon, `resolveErrorMessage(error)`, 再試行 button.
- `CameraErrorWidget({ onRetry, onManualInput })` — 'カメラの起動に失敗しました' + 再試行 / ISBNを手動入力する.
- `CameraPermissionErrorWidget({ onOpenSettings, onManualInput })` — 'カメラへのアクセスが許可されていません' + 設定を開く / ISBNを手動入力する.
- `ScanOverlayWidget()` — CSS overlay with a guide frame + help text 'バーコードをガイド枠に合わせてください' (simple absolutely-positioned divs; no need to replicate canvas corners exactly, approximate the look).

## Pages (port 1:1; read each Dart page for exact strings)
- `AppShell` — layout with `<Outlet/>` + MUI BottomNavigation (3 tabs). Selected tab from current path.
- `HomePage` — title 'LibCheck' (use APP title), menu_book icon, '図書館の蔵書をかんたん検索', 'バーコードでスキャン'→/scan, 'ISBNを入力'→/isbn-input. ALSO host the empty-libraries redirect: if `useRegisteredLibraries()` resolved and empty → `<Navigate to="/library" replace/>` (mirror router redirect).
- `IsbnInputPage` — controlled TextField, live validation via `isbnValidator.getValidationMessage`, '有効なISBNです' when valid, 検索する (enabled when valid) → `/result/<normalized>?source=isbn`, バーコードスキャンへ → /scan.
- `LibraryManagementPage` — AppBar '登録図書館' + add action → /library/add. Loading/error/empty/list states. List rows: formalName, `${pref}${city}`, delete (×) → confirm Dialog → remove + undo Snackbar (notistack, '図書館の登録を解除しました' with '元に戻す' action that re-adds).
- `PrefectureSelectionPage` — search field filters regions; sections per region; tap pref → /library/add/<pref>.
- `CitySelectionPage({ }` reads `:pref`) — `useCityList(pref)`; loading/error/data; search filter; tap city → /library/add/<pref>/<city>.
- `LibraryListPage` (reads `:pref`,`:city`) — `useLibraryList`; checkboxes via `useSelectedLibraries`; register button (disabled if none) → `addAll` + clear + Snackbar '図書館を登録しました' + `navigate(-1)`. Button label includes count when >0.
- `BookSearchResultPage` (reads `:isbn`,`?source`) — uses `useRegisteredLibraries` then `useBookAvailability(isbn)`. ISBN card, 蔵書状況 list of `LibraryAvailabilityCard`, loading/error/no-library states. On successful non-empty availability, **save search history** (enum-name map) via `useSearchHistoryMutations().save` — guard against duplicate saves (save once per result load, e.g. in an effect keyed by isbn+data). 別の本を検索/スキャンする button (label depends on source==='scan') → navigate(-1).
- `SearchHistoryPage` — `useSearchHistory`; delete-all action (DeleteSweep) → confirm dialog → removeAll; list of `SearchHistoryCard` with delete affordance (web: a Delete IconButton on each row OR swipe; a Delete button is acceptable) → remove(isbn); tap card → /result/<isbn>.
- `BarcodeScannerPage` — AppBar 'バーコードスキャン', flash toggle (best-effort via track torch constraint; may noop), video element fed by `@zxing/browser` `BrowserMultiFormatReader.decodeFromVideoDevice(undefined, videoEl, cb)`. On decoded value: normalize, if `isValidIsbn13` → `navigator.vibrate?.()`, stop, navigate `/result/<isbn>?source=scan`. Error handling: getUserMedia rejection with NotAllowedError → render `CameraPermissionErrorWidget` (onOpenSettings best-effort noop/alert, onManualInput → /isbn-input replace); other errors → `CameraErrorWidget` (onRetry restarts, onManualInput → /isbn-input). 'ISBNを手動入力する' button → /isbn-input.
  - **Testability:** abstract the scanner behind a small injectable hook or accept the reader via deps is NOT required; instead make camera start tolerant so jsdom tests can render error/manual-input states. Wrap `navigator.mediaDevices.getUserMedia` usage so that when it is absent/rejects the error UI shows. Tests will mock `navigator.mediaDevices`.

## Testing spec (vitest + RTL)

`test/testUtils.tsx` provides:
- `class FakeLocalStorageRepository implements LocalStorageRepository` — in-memory `Map`.
- `makeFakeDeps(overrides?: Partial<AppDependencies>): AppDependencies` — builds deps with fakes; default `libraryRepository`/`registeredLibraryRepository`/`searchHistoryRepository` built from a FakeLocalStorageRepository + a stub CalilApiClient, but allow overriding any field (esp. `libraryRepository` with a hand-written fake object).
- `renderWithProviders(ui, { deps?, route?, queryClient? })` — wraps `ui` in `DependenciesProvider` + `QueryClientProvider` (fresh client, retries disabled) + `SnackbarProvider` + MUI `ThemeProvider` + `SelectedLibrariesProvider` + a `createMemoryRouter`/`MemoryRouter` at `route` (default '/'). Returns RTL result + `user` (userEvent.setup()).
- For pages that read route params and navigate, prefer rendering the **real router** (`createMemoryRouter(routes, { initialEntries:[route] })` + `RouterProvider`) so `:pref` etc. resolve and navigation works. Provide a helper `renderRouteWithProviders(route, { deps })` for this.

Map the Flutter tests (`test/**`) 1:1 to `*.test.ts(x)` next to each ported file:
- `calil_api_client_*_test.dart` → `data/datasources/calilApiClient.test.ts` — replace `MockClient` with a `fetchFn` mock: `(input) => { const url = new URL(input, 'http://x'); ...; return new Response(JSON.stringify(body), {status:200}); }`. Assert query params via `url.searchParams`. Cover: immediate continue=0, polling until 0, timeout, comma-join, network error (fetchFn throws), invalid JSON.
- repository/model/domain tests → straightforward unit tests (port assertions).
- provider tests (`*_providers_test.dart`) → hook tests using `@testing-library/react`'s `renderHook` with a wrapper that supplies QueryClient + DependenciesProvider (use `makeFakeDeps` with a fake `libraryRepository`). Assert query results via `waitFor`.
- page tests (`*_page_test.dart`) → component tests via `renderRouteWithProviders` or `renderWithProviders`, asserting visible JP text, interactions (userEvent), and navigation outcomes.
- `app_test.dart` → render the app at '/' with empty registered libraries → expect '登録図書館' visible (redirect).
- Preserve each test's **intent and assertions**; keep Japanese `test(...)` descriptions where they aid clarity (English is fine too). Do NOT weaken assertions.

## Build/verify (done by orchestrator after generation)
- `npm install` then `npx tsc --noEmit`, `npm run build`, `npm run test` (vitest run). Fix integration errors.
