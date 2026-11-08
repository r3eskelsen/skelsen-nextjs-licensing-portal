# Upload instructions — owner-controlled GitHub publication

This package is a **source archive**, not a `.git` directory and not a deployment or security certification. It is prepared for manual GitHub upload only after the owner reviews limitations.

## Option A — GitHub browser

1. Unzip the v1.0.1 ZIP. Upload the **contents** (not just the ZIP as one opaque file) into a public repository you own.
2. Make sure `.gitignore` and `.env.example` are included. The repository name can be `eskelsen-nextjs-licensing-portal`.
3. Confirm the README renders and shows the verification limitations.
4. **Do not upload** `.env.local`, `.env`, service-role keys, JWTs, Playwright reports, `.next`, `node_modules`, caches, screenshot images with real users, or `evidence/`.
5. Keep the documentation status as `G3 HOLD` until the authenticated local tests have actually passed.

## Option B — Git CLI (Windows, from the extracted source root)

```powershell
git init
git add .
git status --short
# Carefully inspect staged paths for secrets or generated runtime data.
git commit -m "ESK-LAB-04: tighten membership visibility and add security checks"
git branch -M main
# Create an empty repository in your own account first; substitute its exact URL.
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_NEW_REPO>.git
git push -u origin main
```

GitHub publication is not performed by this archive. Do not run an automated deployment from this repository without separate operational/security review.
