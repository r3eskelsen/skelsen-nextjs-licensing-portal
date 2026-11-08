# Limitations and disclosure

ESK-LAB-04 is a local-first engineering demonstration. It is **not** a production-certified application, a penetration-tested service, or a claim of complete security.

## Verification boundaries

- For the previous v1.0.0 source, the Next.js production build and TypeScript checks were reported to have passed locally. These have **not** yet been rerun for v1.0.1.
- Seventeen automated Node.js unit/static tests passed on v1.0.1 (2026-11-08).
- v1.0.0 historical local SQL tests reportedly demonstrated RLS denial and role-based write behavior using disposable test transactions.
- A v1.0.0 unauthenticated import API request reportedly returned HTTP 401; v1.0.1 requires revalidation.
- A v1.0.0 anonymous browser test reported redirect to login; v1.0.1 requires revalidation.
- v1.0.0 landing and login pages reportedly returned HTTP 200 and were captured with Playwright and Microsoft Edge.
- A complete authenticated HTTP matrix covering client, admin, owner, and cross-tenant scenarios has **not yet been executed against v1.0.1**. The runnable scripts are included.
- Browser screenshots are local evidence, not yet approved as public portfolio screenshots.
- Load testing, penetration testing, production backup recovery, and external security audits have not been performed.

## Functional scope

- Tenant membership assignment is manual and privileged in the demo.
- No production tenant invitation or self-service onboarding flow.
- No complete billing, payment collection, email-delivery, or license-renewal workflow.
- Document and renewal metadata are modeled; full document storage and upload permissions are outside the verified demo.
- CSV import supports a restricted, simple format and rejects unsupported complex quoting.
- Excel `.xlsx` import is unsupported.
- Audit logging is limited in scope and should not be treated as a complete forensic audit trail.

## Production gaps

- No demonstrated production readiness for rate limiting, CAPTCHA, MFA, abuse detection, high availability, backups, disaster recovery, monitoring, or scaling.
- The current local test configuration must not be reused as a public service configuration.
- Use synthetic data only. Keep environment files, credentials, internal execution logs, and recovery caches outside the public repository.
- The project requires a separate security and operational review before any production deployment.

See `docs/RESULTS.md` for observed verification results.
