# Potato Finance

Potato Finance is a cross-platform personal finance PWA MVP that runs fully in-browser (no backend/API required).

## MVP capabilities
- Create/update a local profile (name + currency)
- Password control (local demo)
- Add accounts for categorisation (bank/card/wallet/cash)
- Add/edit/delete transactions
- **Phase 1 CSV import**: upload CSV, map columns, parse preview, review keep/uncheck rows, import to ledger
- **Secure PDF → CSV conversion (local)**: upload PDF, parse locally in-browser, review rows, optionally download parsed CSV, then import
- Basic analytics using bar charts comparing day, month, and year (income vs expense)
- Installable PWA with offline fallback page

## Run locally
```bash
cd web
python3 -m http.server 4173
```
Then open `http://localhost:4173`.

## Deploy to GitHub Pages (for iPhone testing)
- Workflow file: `.github/workflows/deploy-pages.yml`
- Set **Settings → Pages → Source = GitHub Actions**
- Push to `main` or manually run **Deploy PWA to GitHub Pages** workflow

## Install on iPhone
1. Open your GitHub Pages URL in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. Launch from the home screen for app-like PWA mode.
