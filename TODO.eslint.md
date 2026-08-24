# TODO.eslint — remixjs-msal-starter-code

Lint debt inventory for a follow-up agent.
Generated with `npx oxlint` on 2026-08-23 (read-only scan; oxlint not installed in this repo).
Total findings: **9** across **3** rules.

Recommended disposition per rule: fix at the source where cheap; disable via `.oxlintrc.json` where the pattern is intentional or generated code is involved.

| Rule | Count |
|---|---|
| `eslint(no-unused-vars)` | 6 |
| `unicorn(no-useless-spread)` | 2 |
| `eslint(no-useless-rename)` | 1 |

## Details per rule

### `eslint(no-unused-vars)` (6)
- e.g. `remixjs-msal-starter-code/app/components/DataTable/index.tsx — Identifier 'useMemo' is imported but never used.`

### `unicorn(no-useless-spread)` (2)
- e.g. `remixjs-msal-starter-code/app/utils/backend/auth/microsoft.ts — Using a spread operator here creates a new object unnecessarily.`

### `eslint(no-useless-rename)` (1)
- e.g. `remixjs-msal-starter-code/app/components/DataTable/index.tsx — Do not rename import, export, or destructured assignments to the same name`
