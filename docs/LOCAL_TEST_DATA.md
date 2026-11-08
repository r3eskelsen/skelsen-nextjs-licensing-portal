# ESK-LAB-04 synthetic local testing — safe fixture setup

The automated authenticated matrix creates temporary users, organizations and membership assignments and removes them afterward. Use only **fresh disposable local Supabase**, never company/production/shared databases.

## Safety gate

The test helper refuses non-loopback endpoints. It accepts only `http://127.0.0.1:55321` or `http://localhost:55321`. It uses a local service-role key **only within the Node.js process** to create and remove synthetic fixtures. The application itself must use only the local anon key. Never commit the test service-role value into `.env.local`, source files, evidence or screenshots.

Check `supabase/config.toml` for ports and run the read-only G1 preflight before starting any container. `npx supabase db reset` **destroys data in the selected local environment** and must only be used when the active Supabase project is confirmed disposable.

## PowerShell — example local test session

From the extracted project root:

```powershell
npm ci
npx supabase start
npx supabase status
Copy-Item .env.example .env.local
# Edit only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# with the actual local values from your own supabase status output.

# In this same terminal, assign actual values from LOCAL Supabase status.
# DO NOT paste real token values into chat, logs, git, or screenshots.
$env:LAB04_LOCAL_SUPABASE_URL = 'http://127.0.0.1:55321'
$env:LAB04_LOCAL_ANON_KEY = '<YOUR LOCAL ANON KEY>'
$env:LAB04_LOCAL_SERVICE_ROLE_KEY = '<YOUR LOCAL SERVICE-ROLE KEY>'

npm test
npx tsc --noEmit
npm run build
npm run test:auth
# For browser test, local Next.js app must have .env.local configured.
npm run test:e2e

# Clear all test-only environment keys immediately after validation.
Remove-Item Env:LAB04_LOCAL_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
Remove-Item Env:LAB04_LOCAL_ANON_KEY -ErrorAction SilentlyContinue
Remove-Item Env:LAB04_LOCAL_SUPABASE_URL -ErrorAction SilentlyContinue
```

The `npm run test:auth` suite checks three roles in two organizations plus an unassigned account with signed-in sessions and direct PostgREST. It rejects unauthorized cross-tenant reads and writes and checks audit actors. Authenticated Playwright tests use **different disposable fixtures**, so neither suite depends on the other's data.

Cleanup is attempted in `finally`/`afterAll`. If a process is forcibly killed, inspect only the local synthetic fixture IDs and clean them from the **local** Studio; do not run broad destructive cleanup commands. Fixture email domains use `.invalid` and never refer to real people.

## CSV format (admin/owner only)

```csv
organization_id,name,expires_on
<YOUR_SAVED_SYNTHETIC_ORG_UUID>,Synthetic Subscription,2028-12-31
```

This is **restricted** CSV: exact header, unquoted simple names, maximum 100 rows and 64 KiB file size. No Excel/XLSX import, formulas, embedded commas or arbitrary file uploads. The HTTP multipart request limit is 96 KiB including fields and boundaries.

## Evidence

If all real checks pass, record actual exit status and test counts and capture **authentic** signed-in screenshots using the synthetic fixtures, removing user identifiers and tokens. Do not generate illustrative screenshots and claim they are runtime proof.
