# Potato Finance

Potato Finance is being built as a cross-platform personal finance PWA.

## Planning docs
- `docs/potato-finance-development-structure.md` — End-to-end structure covering scope, UX/UI, security, background processing, UAT, delivery phases, and metrics.

## Sprint B preview (Foundation Build)
A runnable UI prototype lives in `web/` and includes:
- responsive application shell for phone/tablet/desktop
- profile-first onboarding stepper
- permission rationale panel for notification access
- Sprint B security baseline preview:
  - passkey-ready and MFA fallback toggles
  - active session list with revoke controls
  - audit event feed for identity/security actions
- basic PWA installability/service worker setup

### Run locally
```bash
cd web
python3 -m http.server 4173
```
Then open `http://localhost:4173`.
