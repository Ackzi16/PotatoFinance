# Potato Finance — End-to-End Application Development Structure

## 1) Product Vision and Scope

### Vision
Build a **cross-platform personal finance Progressive Web App (PWA)** (iPhone, iPad, Android, desktop) that automatically captures payment events from phone notifications and converts them into high-quality, categorized financial records with rich analytics.

### Core outcomes
- **Fast capture** of transaction details from incoming payment notifications.
- **Accurate ledger** with date/time, amount, account/source, payee, category/subcategory.
- **Actionable analytics** across day/week/month/quarter/year and category breakdowns.
- **Secure-by-design** handling of sensitive personal financial data.
- **High reliability** with background sync and offline support.

### Non-goals for V1
- Direct bank integrations in all regions (can be phased in later).
- Shared family/multi-tenant accounting complexity (single user first).
- Tax optimization engine (future phase).

---

## 2) User Personas and Key Jobs-to-be-Done

### Persona A: Busy Individual
- Wants zero-effort tracking from payment alerts.
- Needs confidence that expenses are categorized correctly.

### Persona B: Budget-Conscious Planner
- Wants monthly/weekly trends and category caps.
- Needs proactive nudges when overspending.

### Persona C: Freelancer / Variable Income User
- Wants income vs expense seasonality insights.
- Needs quarter/year comparison and irregular cashflow understanding.

### Primary jobs-to-be-done
1. “When I pay for something, log it automatically from notification details.”
2. “Let me quickly correct category/account if the app guessed wrong.”
3. “Show me where my money goes by time period and category.”
4. “Tell me income/expense trends and whether I am improving.”

---

## 3) Functional Requirements

## 3.0 Phase 0 Outcome: Stakeholder-Validated Requirements
- Prioritize a **simple, beautiful, no-learning-curve UI** for first-time users.
- Onboarding should be profile-first, with most transaction logging handled automatically from notifications.
- Ingestion must filter out non-payment notifications and only process supported payment/bank transfer signals.
- Ledger must distinguish payment rails: **credit card vs bank transfer vs wallet** (not lumped totals).
- Background ingestion should be silent, with optional user-configured daily spend summary reminder time.
- Future-ready extension: support stock purchase capture for investment tracking (post-MVP).
- Permission burden is a top risk: avoid forcing users to indiscriminately unblock all notifications.
- Success criteria include both feature implementation and low-friction change-request turnaround.
- Security remains a release-gating priority due to sensitive personal asset data.

## 3.1 Transaction Capture and Ingestion
- Capture payment data from phone notifications (source app metadata + message parsing).
- Classify notification type before parsing (`payment`, `transfer`, `credit-card-payment`, `non-finance`) and drop non-finance events.
- Maintain allowlist/denylist for supported apps/senders to reduce noisy permission scope.
- Extract fields:
  - transaction timestamp
  - amount + currency
  - account/source instrument (card/bank/wallet)
  - payee/merchant
  - category/subcategory (predicted + editable)
- De-duplication logic for repeated notifications.
- Confidence score for parser output.
- Manual correction workflow for low-confidence records.

## 3.2 Ledger and Data Management
- Transaction list with search/filter/sort.
- Edit/merge/split transaction records.
- Category and subcategory management.
- Income/expense tagging.
- Payment rail tagging (credit card, bank transfer, debit card, wallet, cash).
- Recurring transaction detection and optional rules.

## 3.3 Analytics and Reporting
- Dashboard cards:
  - net cashflow
  - top categories
  - spending velocity
  - income trend
- Time windows: day, week, month, quarter, year, custom range.
- Visualizations:
  - line charts (trend)
  - bar charts (comparison)
  - donut/treemap (category mix)
- Comparative analysis:
  - period-over-period delta (%)
  - budget vs actual
- Drill-down from chart → transaction list.

## 3.4 PWA and Cross-Device Experience
- Installable on iOS/iPadOS, Android, desktop browsers.
- Offline-first data viewing and local capture queue.
- Background sync when connection returns.
- Push notifications for reminders/anomalies (phase dependent by platform constraints).
- User-configurable daily expenditure digest time (silent ingestion, scheduled summary notification).

## 3.5 Security and Privacy
- Authentication: passkeys or strong email+MFA.
- Encrypted data at rest and in transit.
- Device session controls and remote logout.
- PII minimization and retention controls.
- Export/delete account and data.

---

## 4) UX / UI Structure

## 4.1 Information Architecture
- **Onboarding**
  - account setup
  - permissions education (notifications, storage)
  - category preferences
- **Home / Dashboard**
  - summary KPIs
  - quick add/fix actions
  - anomaly alerts
- **Transactions**
  - feed + powerful filters
  - one-tap recategorization
- **Analytics**
  - tabs: Income, Expenses, Net Flow, Category Mix, Comparison
- **Budgets (V1.5/V2)**
  - monthly category budgets
- **Settings**
  - accounts, categories, security, export/import

## 4.2 Core UX Principles
- Minimize friction: default to best guess + easy correction.
- Explainability: show why category was inferred.
- Progressive disclosure: simple defaults, deep filters optional.
- Platform familiarity: respect native gestures and spacing across mobile/tablet/desktop.

## 4.3 Key User Flows
1. Notification received → parser extracts data → transaction created → user confirms/fixes.
2. User opens analytics tab → selects period (month vs quarter) → drills into category outlier.
3. User updates category rule (e.g., merchant X always = “Groceries”).

## 4.4 Design System Essentials
- Tokenized color, typography, spacing.
- Accessible contrast and touch targets.
- Reusable components: cards, chips, segmented controls, chart containers, data tables.
- Empty/loading/error states for each critical view.

---

## 5) Technical Architecture (Suggested)

## 5.1 High-Level Components
- **PWA Frontend** (web app + service worker).
- **API Backend** (auth, transactions, analytics endpoints).
- **Parser/Classification Service** (notification text extraction + categorization).
- **Data Store** (relational DB + optional analytics store).
- **Queue/Worker** (asynchronous parsing, enrichment, dedupe).

## 5.2 Suggested Stack
- Frontend: React + TypeScript + PWA tooling.
- UI: component library + charting framework.
- Backend: Node.js (or Python) REST/GraphQL API.
- DB: PostgreSQL.
- Cache/queue: Redis + worker runtime.
- Hosting: managed cloud with CI/CD.

## 5.3 Data Model (Core Entities)
- User
- Account (bank/card/wallet/source)
- Transaction
- Category / Subcategory
- Merchant
- ParsingEvent (raw notification + parse metadata)
- Rule (merchant/category mapping)
- Budget (optional early)

## 5.4 Notification Capture Reality Check
Because browser PWAs cannot directly read all native notifications on every OS, use a **companion strategy**:
- Primary: Mobile companion integration (lightweight helper app/service) captures supported notifications and forwards normalized payloads securely.
- Secondary fallback: Share-to-Potato workflow / quick input + OCR import.
- Permission minimization: request only notification access for explicitly user-selected finance/payment apps.
- Always preserve manual edit path for correctness.

---

## 6) Security, Privacy, and Compliance Plan

## 6.1 Threat Model Focus Areas
- Account takeover.
- Sensitive transaction leakage.
- Insecure notification ingestion endpoint.
- Cross-device token/session abuse.

## 6.2 Security Controls
- TLS everywhere.
- Row-level authorization checks for all transaction queries.
- Encryption at rest for DB and backups.
- Key management via cloud KMS.
- Audit logs for auth events and critical data changes.
- Rate limiting and abuse protection for ingest endpoints.
- Secure secret storage and rotation.

## 6.3 Privacy Controls
- Store only required notification fields.
- Separate raw notification text from normalized transaction data with retention policy.
- User controls for data export and deletion.

## 6.4 Compliance Readiness
- GDPR/CCPA-style controls (consent, deletion, portability).
- Explicit disclosures for notification access behavior.
- Incident response playbook.

---

## 7) Background Processing and Reliability

## 7.1 Background Jobs
- Parse incoming notification payloads.
- Deduplicate likely duplicates.
- Re-run categorization when user rule updates.
- Precompute analytics aggregates.

## 7.2 Offline and Sync Strategy
- Local queue for creates/edits while offline.
- Conflict resolution policy:
  - server-wins for immutable parser metadata
  - latest-edit-wins with audit trail for user fields
- Idempotency keys for ingest endpoints.

## 7.3 Observability
- Structured logs with correlation IDs.
- Metrics: ingestion latency, parse accuracy, sync failures, chart query latency.
- Alerts for processing backlog and error spikes.

---

## 8) Delivery Plan (Beginning to End)

## Phase 0 — Discovery (**Completed**)
- Stakeholder interviews, journey mapping, and risk capture completed.
- Key outcomes confirmed: simplicity-first UX, silent background ingestion, payment-type separation, security-first release criteria.

## Phase 1 — Product Definition (**Completed**)
- Initial PRD direction and architecture blueprint documented.
- Decision: proceed immediately with Foundation Build and review incrementally at each phase gate.

## Phase 2 — Foundation Build (**Start Now**, 2–4 weeks)
- Repo, CI/CD, environments (dev/stage/prod).
- Auth, user profile, base schema.
- PWA shell + navigation + design system foundations.
- Build parser contract and classifier service skeleton for notification-type filtering.
- Implement core domain model fields for payment rail separation (credit card vs transfer).
- Deliver daily digest scheduler framework (configuration only in this phase, not full analytics).
- Establish security baseline controls (MFA, encryption, audit logging, rate limiting).

## 8.1 Foundation Build Detailed Workplan (Execution Backlog)

### Sprint A — Platform and UX shell
- Create responsive layout system optimized for phone, tablet, and desktop.
- Implement onboarding: profile setup, selected-account setup, and permission rationale screens.
- Publish UI baseline: typography scale, color tokens, spacing, and component primitives.

### Sprint B — Security and identity baseline
- Implement passkey-ready auth abstraction and MFA fallback.
- Add secure session lifecycle (device list, revoke session, idle timeout).
- Add audit log events for authentication and data-modifying actions.

### Sprint C — Notification ingestion foundation
- Define normalized event schema: source app, raw text hash, detected type, amount, timestamp, rail type, parse confidence.
- Build ingestion API with idempotency keys and dedupe checks.
- Add notification-type classifier to block non-payment noise before parsing.

### Sprint D — Foundation acceptance gate
- Demo: end-to-end ingestion of sample payment notifications into staging ledger.
- Validate security controls and logging coverage.
- Sign off on readiness before expanding into full transaction engine and analytics.

## Phase 3 — Core Transaction Engine (3–5 weeks)
- Ingestion API + parser pipeline.
- Transaction feed + edit/correction UX.
- Category and rules management.
- Deduplication and confidence scoring.

## Phase 4 — Analytics and Reporting (2–4 weeks)
- Time-based aggregation services.
- Dashboard and analytics tab with drill-down.
- Comparison views (day/week/month/quarter/year).

## Phase 5 — Hardening and Scale (2–3 weeks)
- Security hardening, penetration test fixes.
- Performance optimization and caching.
- Reliability testing under burst ingestion.

## Phase 6 — UAT + Launch (2 weeks)
- Controlled beta with defined user cohort.
- UAT sign-off, bug burn-down.
- Production launch + post-launch monitoring.

## Phase 7 — Post-Launch Evolution (ongoing)
- Budgeting and alerts.
- Smart insights and anomaly detection.
- Optional bank integrations and shared accounts.

---

## 9) User Acceptance Testing (UAT) Framework

## 9.1 Entry Criteria
- Core features complete in staging.
- Critical defects < threshold.
- Test data and scripts ready.

## 9.2 UAT Test Themes
- Notification ingestion accuracy.
- Transaction correction speed/usability.
- Analytics correctness for each period.
- Cross-device continuity.
- Offline behavior and sync recovery.
- Security controls (session/logout/MFA).

## 9.3 Example Acceptance Criteria
- 95%+ correctly parsed amount/date in known notification formats.
- User can recategorize transaction in <= 2 actions.
- Dashboard loads in <= 2 seconds for 12 months of typical data.
- No data loss after offline edits and reconnect.

## 9.4 Exit Criteria
- All P0/P1 issues resolved.
- UAT sign-off from product + QA + security.
- Launch runbook approved.

---

## 10) Engineering Quality and DevOps

## 10.1 Environments
- Dev, staging, production with isolated secrets and databases.

## 10.2 CI/CD
- Linting, unit tests, integration tests on every PR.
- Security scans (SAST/dependency/container).
- Automated deploy with rollback strategy.

## 10.3 Testing Pyramid
- Unit: parser functions, classification rules, formatters.
- Integration: API + DB + worker flow.
- E2E: critical user journeys across mobile/desktop breakpoints.
- Performance: analytics endpoints and ingestion throughput.

## 10.4 Definition of Done
- Feature meets acceptance criteria.
- Telemetry added.
- Security checks pass.
- Documentation updated.

---

## 11) Metrics and Success Measurement

### Product metrics
- Daily/weekly active users.
- Transaction auto-capture rate.
- Manual correction rate.
- 7-day and 30-day retention.
- Change-request turnaround time (request → production release).

### Quality metrics
- Parse precision/recall by source format.
- Payment-notification classification precision (false-positive non-payment capture rate).
- Crash-free sessions.
- Sync error rate.

### Performance metrics
- P95 API latency.
- P95 dashboard render time.
- Worker queue delay.
- Security metrics: suspicious login detection rate, mean time to revoke compromised sessions.

---

## 12) Immediate Next Actions (Foundation Build Kickoff)

1. Lock Foundation Build sprint plan and owners (A/B/C/D workstreams above).
2. Define supported finance notification sources for V1 allowlist.
3. Finalize normalized event schema including rail type and classifier labels.
4. Build onboarding + permission rationale UX prototypes and run quick usability checks.
5. Implement auth/MFA/session baseline and security telemetry.
6. Stand up staging environment, CI pipeline, and feature-flag scaffolding.
7. Run first end-to-end ingestion test using anonymized sample notifications.
8. Hold phase-gate review before Phase 3 expansion.

---

## Appendix A — MVP Feature Cut Suggestion

Ship in MVP:
- Notification ingestion (limited supported formats).
- Transaction feed + edit.
- Core categories + rules.
- Dashboard + period comparison charts.
- PWA installability + offline read + queued edits.
- Basic account security (MFA, session management).

Defer post-MVP:
- Advanced ML categorization.
- Bank API integrations at scale.
- Household shared ledgers.
- Advanced forecasting.


## Appendix B — Notification Permission Risk Mitigation

- Ask users to select specific finance apps during onboarding instead of broad “all notifications” guidance.
- Provide transparent explanation of what data is read, stored, and ignored.
- Support manual fallback paths so users can still use the product with partial permissions.
- Re-prompt permissions contextually only when a blocked feature is invoked.

## Appendix C — Sprint A Implementation Artifact Map

- `web/index.html`: responsive shell + onboarding + permission rationale preview.
- `web/styles.css`: design tokens, mobile-first layout, responsive breakpoints.
- `web/app.js`: onboarding stepper behavior and install prompt handling.
- `web/manifest.webmanifest` and `web/sw.js`: baseline PWA install/offline scaffold.
