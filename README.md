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


## monopoly-core secure parser bridge (optional, recommended)
If your bank PDF parsing works better with `monopoly-core`, run the local bridge service:

```bash
pip install monopoly-core fastapi uvicorn python-multipart
uvicorn tools.monopoly_bridge:app --host 127.0.0.1 --port 8765
```

Then in the app Import tab:
1. select your PDF,
2. click **Parse with monopoly-core**,
3. review and confirm import.

This keeps parsing local to your machine (PWA -> localhost bridge).


### Host the parser bridge (internet-access for phone)
You can host the bridge so iPhone clients can parse PDFs over HTTPS.

```bash
# from repo root
docker build -f tools/Dockerfile.bridge -t potato-bridge .
docker run -p 8765:8765   -e BRIDGE_API_KEY=change-me   -e BRIDGE_ALLOWED_ORIGINS=https://<your-pages-domain>   potato-bridge
```

Then set in PWA Import tab:
- Parser endpoint: `https://<your-bridge-domain>/parse`
- Parser API key: same `BRIDGE_API_KEY`
