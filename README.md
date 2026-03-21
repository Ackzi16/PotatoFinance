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

### Demo flow to try
1. Click through onboarding.
2. Toggle passkey and MFA states.
3. Ingest sample notifications (pre-filled) and review accepted/ignored/duplicate counters.
4. Check ledger rows and Sprint D gate checklist for pass/fail status.
