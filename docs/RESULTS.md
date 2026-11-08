# v1.0.1 source review and execution results — 2026-11-08

This record reflects the **current GitHub candidate**, distinct from the earlier v1.0.0 historical logs. The revision was prepared in an isolated offline workspace from the original ZIP (SHA-256: `bbb75c13bd160fa02922fab86bce4732bd041b64e074a1d878a99f0a43bc1792`).

| Area | Result | Basis |
|---|---|---|
| Original archive CRC and file inventory | PASS | v1.0.0 ZIP inspected; 36 entries |
| Membership SELECT privacy | PATCHED; STATIC PASS | Additive migration `20261108000100_membership_visibility.sql`; static assertion |
| Dashboard current-user role filtering | PATCHED; STATIC PASS | Scoped query and admin-only panels; source assertions |
| Calendar date validation | PASS (unit) | Valid / invalid leap-day and format tests |
| Constrained CSV parsing | PASS (unit) | Existing negative tests and strict date validation |
| Pre-parse multipart bounded size | PASS (unit) | Stream bound and negative multipart tests |
| Node.js tests on v1.0.1 | **17/17 PASS** | Executed on Node.js 22.16.0, 2026-11-08; 0 failed |
| TypeScript check on v1.0.1 | **NOT RUN** | No installed Next.js/React/TypeScript dependencies in verification container |
| Next.js production build on v1.0.1 | **NOT RUN** | Dependencies unavailable; build MUST be verified locally |
| Supabase migrations on v1.0.1 | **NOT RUN** | No local container engine / Supabase running in review environment |
| Real client/admin/owner authenticated JWT matrix | **NOT RUN** | `npm run test:auth` supplied; requires disposable local Supabase |
| Authenticated Playwright scenarios | **NOT RUN** | Playwright test source supplied, requires local stack + browser |
| Public landing/sign-in screenshots | HISTORICAL v1.0.0 | Two original unmodified screenshots; do not describe as v1.0.1 authenticated proof |
| GitHub publication | **NOT PERFORMED** | Archive prepared for owner's review and separate upload |
| G5 verified authenticated portfolio claim | **HOLD** | Must pass current migration, JWT, UI, build, packaging and evidence gates |

## Previous revision, kept for provenance

The supplied v1.0.0 documentation reported local TypeScript/Next.js build PASS, historical SQL RLS negative tests, public-page HTTP 200, anonymous API HTTP 401 and browser redirect to login. Those run artifacts are not independently reproduced for v1.0.1 and must **not** be counted toward the current G3 gate.

## Security boundaries

The public package contains source, tests, empty configuration template, SQL migrations, and anonymous screenshots only. It excludes runtime token values, password-bearing fixtures, `.env.local`, local logs, uploaded documents and proprietary production data. A secret scan reduces risk but cannot guarantee an absence of all secrets.
