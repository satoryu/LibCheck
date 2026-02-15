# CLAUDE.md

## Tech Stacks

- Flutter / Dart
- [カーリル 図書館API](https://calil.jp/doc/api_ref.html)

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

## Testing

Tests are written using `flutter_test`. You can run the tests using the following command:

```bash
flutter test
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

## Merging

Do not merge a PR if there are unchecked items in its Test Plan. For items that cannot be verified by automated tests (e.g. on-device testing), ask the user to confirm and get their approval before merging.
