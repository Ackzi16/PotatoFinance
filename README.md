# Potato Finance

Potato Finance is being built as a cross-platform personal finance PWA.

## Planning docs
- `docs/potato-finance-development-structure.md` — End-to-end structure covering scope, UX/UI, security, background processing, UAT, delivery phases, and metrics.

## Sprint D demo preview (Foundation Build)
A runnable UI prototype lives in `web/` and includes:
- Sprint A: responsive shell + onboarding + permission rationale
- Sprint B: passkey/MFA toggles, active sessions, audit event feed
- Sprint C: notification ingest simulator with classifier + parser + dedupe
- Sprint D: acceptance gate checklist and staging-ledger preview

### Run locally
```bash
cd web
python3 -m http.server 4173
```
Then open `http://localhost:4173`.

## Deploy to GitHub Pages (for iPhone testing)
This repo now includes `.github/workflows/deploy-pages.yml` for automatic Pages deployment from `web/`.

### One-time GitHub setup
1. Push this repository to your GitHub account.
2. In GitHub: **Settings → Pages → Source**, choose **GitHub Actions**.
3. Ensure your default branch is `main` (or trigger the workflow manually from Actions).

### Deploy
- Push to `main`, or run **Actions → Deploy PWA to GitHub Pages → Run workflow**.
- After deploy, your demo URL will be shown in the workflow output and under Pages settings.

### Install on iPhone
1. Open the GitHub Pages URL in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. Launch from home screen to run in standalone PWA mode.

## Demo flow to try
1. Click through onboarding.
2. Toggle passkey and MFA states.
3. Ingest sample notifications and review accepted/ignored/duplicate counters.
4. Check ledger rows and Sprint D gate checklist for pass/fail status.
