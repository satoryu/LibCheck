# CLAUDE.md

## Tech Stacks

- React 18 / TypeScript / Vite
- [カーリル 図書館API](https://calil.jp/doc/api_ref.html)
- Google 認証（Google Identity Services / @react-oauth/google、ID トークンは jose でサーバ検証）— ログイン必須
- Cloudflare Pages + Pages Functions（静的配信 + API プロキシ / 認証 / 永続化 API）
- Cloudflare D1（登録図書館・検索履歴をユーザー単位で永続化。スキーマは infra/d1/migrations で管理）

## Workflow

0. Create a development environment to work on the issue.
1. Analyze the user's request in the issue and write down the requirements in the document `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/requirements.md`.
2. Design the architecture and write it down in `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/design.md`.
3. Plan the implementation tasks and create a checklist in `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/tasks.md`.
4. You must be approved by the user before starting the implementation.
5. Implement the tasks one by one, following TDD principles after approval.
6. After completing the implementation, create a pull request to merge the feature branch into the `main` branch.
7. Review the code and write a review feedback to the pull-request.

## Documents

### `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/requirements.md`

This document contains the requirements for the issue number `[ISSUE-NUMBER]`, including the following sections:

- Problem Statement
- Requirements(Functional and Non-Functional)
- Constraints
- Acceptance Criteria
- User Stories

### `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/design.md`

This document contains the design for the issue number `[ISSUE-NUMBER]`, including the following sections:

- Architecture Overview
- Component Design
- Data Flow
- Domain Models

The diagrams should be created using [Mermaid](https://mermaid-js.github.io/mermaid/#/) syntax.

### `docs/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]/tasks.md`

This document contains the implementation tasks for the issue number `[ISSUE-NUMBER]`, including a checklist of tasks to be completed.

You must complete each task in order and check them off as you complete them.

## Implementation

You must follow TDD (Test-Driven Development) principles when implementing the tasks.
This means you must write todos to complete the task first, then write a test that fails, and finally implement the code to make the test pass. Then refactor the code if necessary.

The codebase follows a Clean Architecture layout under `src/` (`domain` / `data` / `presentation`).
Keep dependencies pointing inward: `presentation` and `data` may depend on `domain`, but `domain` must not depend on the outer layers.

## Testing

Tests are written with [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/). You can run them using the following commands:

```bash
npm test          # run the whole suite once
npm run test:watch # watch mode

npx tsc -b        # type-check (also runs as part of `npm run build`)
```

## Branching Strategy

GitHub flow is used as the branching strategy.

- `main` branch: This is the production-ready branch. Only code that has been tested and approved should be merged into this branch.
- `feature/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]` branches: These branches are used for developing new features. They should be created from the `main` branch and merged back into `main` when the feature is complete.

## Code Reviews

After completing the implementation of a feature, you must create a pull request to merge the `feature/[ISSUE-NUMBER]-[SHORT-DESCRIPTION]` branch into the `main` branch.
Then you must review the code by yourself and write a review feedback to the pull-request, ensure that it meets the requirements and passes all tests before merging.

In review phase, you must focus on the following aspects:

- Correctness
- Readability
- Performance
- Security
- Maintainability

When issues are found during code review, do not dismiss them solely because they fall below a scoring threshold. Any issue flagged with high confidence (e.g. resource leaks, unclear test intent, code duplication, insufficient assertions) must be evaluated and fixed before merging.

## In-Browser Testing

When the Test Plan includes manual verification items (UI behavior, camera/barcode scanning, navigation), you must perform the verification yourself in a browser. Do not leave it to the user unless the browser environment is genuinely unavailable. Steps:

1. Start the dev server (`npm run dev`, default `http://localhost:5173`), or emulate the production setup (Pages Functions) with `npm run pages:dev`.
2. Open the app in a browser and verify each acceptance criterion manually (use the Chrome integration tools when available; Playwright does not install in this environment — see Known Pitfalls).
3. For camera/barcode features, verify graceful handling when camera access is denied or unavailable.
4. Check off the verified items in the PR Test Plan.

## Merging

Do not merge a PR if there are unchecked items in its Test Plan. For items that cannot be verified by automated tests (e.g. in-browser verification), perform the verification yourself first. Only ask the user for approval if the environment is genuinely unavailable.

## Definition of Done

Merging is not the end of the work. An Issue/PR is done only when all of the following hold:

1. CI is green, and the merge is chained to it: `scripts/watch-pr.sh <PR> && gh pr merge <PR> --squash --delete-branch` (never merge as a separate step that ignores the exit code).
2. Watch the production deploy triggered by the merge to main (cloudflare-pages.yml) with `gh run watch` until it completes.
3. **Run `scripts/smoke.sh` and confirm every item passes** (first-line production verification; read-only and safe).
4. Verify the change-specific behavior in production (new endpoint responses, headers, rendering, etc.).
5. Record the verification results on the PR / Issue before closing it.

## Verification Principles

- **Never implement from memory**: verify specs, commands, and constraints of external services (Cloudflare / Google / Workbox etc.) against official docs before implementing. Dashboard click-paths go stale quickly, so document procedures as API / CLI commands.
- **Grep the blast radius before changing code**: find callers, tests, and fake implementations first, then design the change.
- **Separate server state from client state**: for production issues, observe with curl (server/CDN state) and the browser (Service Worker, caches, cookies) independently before hypothesizing a cause.
- **When touching the Service Worker / PWA, verify that updates actually reach users**: confirm in a browser that the new SW does not stay in `waiting` (`navigator.serviceWorker.getRegistration()`). Neither curl nor unit tests can catch this.

## Known Pitfalls (project-specific)

- **Cloudflare Pages env vars must be `secret_text`**: plain-text vars are wiped by `wrangler pages deploy` (the source of truth for plain vars is `[vars]` in wrangler.toml). Changes take effect only on the next deploy.
- **Clean URLs (extension-less) exist only on production Pages**: they 404 on the local Vite dev server. Use `.html` links in the app (production follows with a 308).
- **Do not use `git add -A`**: it once swept in untracked junk (pnpm files). Always stage explicit paths. Enforced by a PreToolUse hook (`scripts/claude-hooks/block-git-add-all.sh`, wired in `.claude/settings.json`) that also blocks `git add --all` / `git add .`.
- **wrangler / Playwright do not install locally** (the sharp native build fails in this environment). Use CI (wrangler-action) or `npx` for wrangler; use the Chrome integration tools or ask the user for browser verification.
- **GIS One Tap silently signs in previously-approved users**: check the logged-out view (landing page) right after signing out or in an incognito window. Real Google sign-in does not work on the dev server (use `VITE_AUTH_MOCK=true`).
- **Cloudflare API token handoff**: the user places tokens at `/tmp/cf_token` / `/tmp/cf_acct` (`umask 077`) → never print the values → **keep them until verification completes** → then `rm`.
