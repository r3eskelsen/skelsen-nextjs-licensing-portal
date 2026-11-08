# v1.0.1 — security correction and testability release

**Type:** Independent synthetic engineering lab / GitHub source candidate. **Not production-certified.**

## Corrected

- **F-01:** Additive migration narrows `memberships` SELECT to the authenticated user; dashboard also filters membership results to `user.id`, uses only own role, and hides privileged forms from clients.
- **F-02:** Added executable direct PostgREST authenticated matrix with isolated synthetic users (`client`, `admin`, `owner`, `noMembership`), multi-org writes/reads, role denial, and audit checks; added role-aware Playwright scenarios. **Real Supabase execution remains pending**.
- **F-03:** Windows preflight now derives configured ports from `supabase/config.toml` (3000, 55320–55324 by current configuration).
- **F-04:** Reconciled results/test matrix against **v1.0.1** and distinguished local unit/static PASS from historical v1.0.0 reports and current HOLD items.
- **F-05:** Added repeatable, local-only synthetic fixture helpers and explicit screenshots/capability limitations. Signed-in screenshots cannot be legitimately captured without running a real local auth environment.
- **F-06:** Enforced 96 KiB streamed multipart cap before `formData()` and 64 KiB/100-row CSV constraints; replaced raw JSON-on-submit UX with inline import feedback; added strict calendar-date validation.

## Remaining gates

- Local Supabase migration apply (two migration files), real-JWT authenticated matrix and authenticated browser tests.
- Next.js TypeScript check and production build for v1.0.1.
- Authenticated dashboard screenshots using synthetic accounts.
- Owner review before publication and final public repository push.

Once those gates pass, update `docs/RESULTS.md` using the actual output and commit identity. The term "verified authenticated multi-tenant" should not be used before that verification.
