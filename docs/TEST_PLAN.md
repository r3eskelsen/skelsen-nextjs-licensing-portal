# ESK-LAB-04 — v1.0.1 acceptance and test matrix

There are three separate verification levels:

1. **Static / unit (`npm test`)**: confirms parser boundaries and selected SQL/Next.js source patterns, not a real database's enforcement.
2. **Real authenticated API (`npm run test:auth`)**: creates synthetic users and organizations in disposable local Supabase, obtains actual user tokens, attempts positive and negative PostgREST operations, and deletes fixtures afterward.
3. **Real authenticated browser (`npm run test:e2e`)**: with local Supabase and synthetic fixtures tests client-read-only UI, admin writes, and owner tenant isolation. Also includes public landing and unauthenticated redirect checks.

## Matrix for this revision

| ID | Requirement | Test | Expected | v1.0.1 status |
| --- | --- | --- | --- | --- |
| U01 | CSV validation, size, rows, invalid tenant/date | `npm test` | Reject invalid; accept valid | PASS (unit, 2026-11-08) |
| U02 | Real calendar date validation | `npm test` | Leap day only when valid | PASS (unit) |
| U03 | Multipart bound before parsing | `npm test` | Oversized body rejected | PASS (unit) |
| S01 | RLS declarations and composite FKs | `npm test` | SQL structure present | PASS (static) |
| S02 | Membership self-only SELECT policy | `npm test` | Latest migration restricts `auth.uid` | PASS (static) |
| S03 | Dashboard role-scoped query and UI | `npm test` | Fetch only signed-in user's memberships | PASS (static) |
| G1 | Preflight project-configured ports | `scripts/g1-readonly-preflight.ps1` | 3000, 55320–55324 inspected | NOT RUN on Windows |
| I01 | Apply both migrations | `npx supabase start` / `npx supabase db reset` | Schema applied without failure | HOLD |
| I02 | Client A can read only A records | `npm run test:auth` | A only | HOLD |
| I03 | Client A cannot see admin A membership | `npm run test:auth` | Own membership only | HOLD |
| I04 | Client A cannot insert/update | `npm run test:auth` | SQL deny / no rows updated | HOLD |
| I05 | Admin A can write only A | `npm run test:auth` | Allow A, reject B | HOLD |
| I06 | Owner B can write only B | `npm run test:auth` | Allow B, reject A | HOLD |
| I07 | Audit actor and tenant isolation | `npm run test:auth` | Correct actor; no cross-tenant audit | HOLD |
| I08 | Anonymous REST request | `npm run test:auth` | Denied / no license rows | HOLD |
| E01 | Client cannot see privileged UI | `npm run test:e2e` | Read-only section only | HOLD |
| E02 | Admin A creates via UI | `npm run test:e2e` | Success, no org B option | HOLD |
| E03 | Owner B sees only B | `npm run test:e2e` | No A organization | HOLD |
| E04 | Anonymous dashboard redirect | `npm run test:e2e` | Redirect to login | HISTORICAL only |
| B01 | TypeScript compilation | `npx tsc --noEmit` | Exit 0 | HOLD |
| B02 | Next production build | `npm run build` | Exit 0 | HOLD |
| G4 | Public package scan and SHA256 | Release packager | No environment secrets; manifest matches | See final release manifest |

If an authentication test fails, report `FAIL` rather than bypassing it. Do not mark a complete security PASS based on the static checks.

## Windows runbook

1. In a **disposable project directory**, inspect `supabase/config.toml` and run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\g1-readonly-preflight.ps1` (reads resources, creates `evidence/` locally).
2. Once approved, run `npm ci`, `npx supabase start`, `npx supabase status`, and create `.env.local` from `.env.example` with the **local** anon key only.
3. Run `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run dev`.
4. In a separate terminal, set the three local `LAB04_LOCAL_*` variables using values from **your own** local `supabase status -o env`; see `docs/LOCAL_TEST_DATA.md`. Execute `npm run test:auth`, then `npm run test:e2e`.
5. Save **redacted** exit codes, tool versions, test summaries, commit SHA, and screenshots to the local excluded `evidence/` directory. Do not copy secrets into GitHub. Update `docs/RESULTS.md` only after the actual tests pass.
