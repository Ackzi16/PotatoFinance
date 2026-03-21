let currentStep = 1;
const stepCount = 3;
const maxAuditEvents = 10;

const stepEls = Array.from(document.querySelectorAll('.step'));
const prevBtn = document.getElementById('prevStep');
const nextBtn = document.getElementById('nextStep');
const passkeyToggle = document.getElementById('passkeyToggle');
const mfaToggle = document.getElementById('mfaToggle');
const authStatus = document.getElementById('authStatus');
const sessionList = document.getElementById('sessionList');
const auditList = document.getElementById('auditList');
const ledgerBody = document.getElementById('ledgerBody');
const ingestBtn = document.getElementById('ingestBtn');
const clearLedgerBtn = document.getElementById('clearLedgerBtn');
const notificationInput = document.getElementById('notificationInput');
const acceptedCount = document.getElementById('acceptedCount');
const ignoredCount = document.getElementById('ignoredCount');
const duplicateCount = document.getElementById('duplicateCount');
const gateChecklist = document.getElementById('gateChecklist');

const state = {
  sessions: [
    { id: 's-1', device: 'iPhone 16', location: 'Singapore', current: true },
    { id: 's-2', device: 'iPad Pro', location: 'Singapore', current: false },
    { id: 's-3', device: 'Chrome Desktop', location: 'San Francisco', current: false }
  ],
  auditEvents: [],
  transactions: [],
  seenHashes: new Set(),
  stats: { accepted: 0, ignored: 0, duplicates: 0 }
};

const nowIso = () => new Date().toISOString();
const simpleHash = (value) => Array.from(value).reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0).toString();

const addAuditEvent = (action) => {
  state.auditEvents = [{ action, timestamp: nowIso() }, ...state.auditEvents].slice(0, maxAuditEvents);
  renderAuditEvents();
};

const classifyNotification = (text) => {
  const normalized = text.toLowerCase();
  if (normalized.includes('card payment')) {
    return 'credit-card-payment';
  }
  if (normalized.includes('transfer')) {
    return 'transfer';
  }
  if (normalized.includes('payment')) {
    return 'payment';
  }
  return 'non-finance';
};

const parseNotification = (rawText) => {
  const type = classifyNotification(rawText);
  const sourceMatch = rawText.match(/^\[([^\]]+)\]/);
  const amountMatch = rawText.match(/(?:sgd|\$)\s?([0-9]+(?:\.[0-9]{1,2})?)/i);
  const atMatch = rawText.match(/(?:at|to)\s([A-Za-z0-9\s]+?)(?:\s\d{1,2}:\d{2}|$)/i);
  const timeMatch = rawText.match(/(\d{1,2}:\d{2})$/);

  const amount = amountMatch ? Number(amountMatch[1]) : null;
  const payee = atMatch ? atMatch[1].trim() : 'Unknown';
  const source = sourceMatch ? sourceMatch[1] : 'Unknown App';
  const confidence = type === 'non-finance' ? 0.2 : amount && payee !== 'Unknown' ? 0.95 : 0.7;
  const rail = type === 'credit-card-payment' ? 'Credit Card' : type === 'transfer' ? 'Transfer' : 'Other';

  return {
    source,
    rawText,
    type,
    amount,
    payee,
    rail,
    confidence,
    timestamp: timeMatch ? `${new Date().toISOString().slice(0, 10)} ${timeMatch[1]}` : nowIso(),
    rawHash: simpleHash(rawText)
  };
};

const renderAuditEvents = () => {
  auditList.innerHTML = '';
  if (!state.auditEvents.length) {
    const item = document.createElement('li');
    item.className = 'audit-item';
    item.textContent = 'No events yet.';
    auditList.appendChild(item);
    return;
  }

  state.auditEvents.forEach((event) => {
    const item = document.createElement('li');
    item.className = 'audit-item';
    item.innerHTML = `<span>${event.action}</span><span class="audit-item__time">${event.timestamp}</span>`;
    auditList.appendChild(item);
  });
};

const updateAuthStatus = () => {
  const passkeyEnabled = passkeyToggle.checked;
  const mfaEnabled = mfaToggle.checked;

  if (passkeyEnabled && mfaEnabled) {
    authStatus.textContent = 'Passkey + MFA fallback active';
  } else if (passkeyEnabled) {
    authStatus.textContent = 'Passkey only active';
  } else if (mfaEnabled) {
    authStatus.textContent = 'Password + MFA fallback active';
  } else {
    authStatus.textContent = 'Password only (not recommended)';
  }

  updateGateChecklist();
};

const renderSessions = () => {
  sessionList.innerHTML = '';
  state.sessions.forEach((session) => {
    const item = document.createElement('li');
    item.className = 'session-item';

    const meta = document.createElement('span');
    meta.className = 'session-meta';
    meta.textContent = `${session.device} • ${session.location}${session.current ? ' • Current session' : ''}`;

    const revokeBtn = document.createElement('button');
    revokeBtn.className = 'btn';
    revokeBtn.textContent = session.current ? 'Current' : 'Revoke';
    revokeBtn.disabled = session.current;

    revokeBtn.addEventListener('click', () => {
      state.sessions = state.sessions.filter((entry) => entry.id !== session.id);
      addAuditEvent(`Session revoked: ${session.device}`);
      renderSessions();
    });

    item.append(meta, revokeBtn);
    sessionList.appendChild(item);
  });
};

const renderLedger = () => {
  ledgerBody.innerHTML = '';
  if (!state.transactions.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="7">No transactions ingested yet.</td>';
    ledgerBody.appendChild(row);
    return;
  }

  state.transactions.forEach((txn) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${txn.timestamp}</td><td>${txn.amount ? `SGD ${txn.amount.toFixed(2)}` : 'N/A'}</td><td>${txn.payee}</td><td>${txn.rail}</td><td>${txn.type}</td><td>${Math.round(txn.confidence * 100)}%</td><td>${txn.source}</td>`;
    ledgerBody.appendChild(row);
  });
};

const renderStats = () => {
  acceptedCount.textContent = String(state.stats.accepted);
  ignoredCount.textContent = String(state.stats.ignored);
  duplicateCount.textContent = String(state.stats.duplicates);
};

const updateGateChecklist = () => {
  const gates = {
    hasTransactions: state.transactions.length > 0,
    hasTransfer: state.transactions.some((txn) => txn.type === 'transfer'),
    hasDedup: state.stats.duplicates > 0,
    hasSecurity: passkeyToggle.checked || mfaToggle.checked
  };

  Array.from(gateChecklist.querySelectorAll('li')).forEach((item) => {
    const gateKey = item.dataset.gate;
    const isPass = gates[gateKey];
    const text = item.textContent.replace(/^✅|^❌/, '').trim();
    item.textContent = `${isPass ? '✅' : '❌'} ${text}`;
  });
};

const processNotifications = () => {
  const lines = notificationInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line) => {
    const parsed = parseNotification(line);

    if (parsed.type === 'non-finance') {
      state.stats.ignored += 1;
      addAuditEvent(`Ignored non-finance notification from ${parsed.source}`);
      return;
    }

    if (state.seenHashes.has(parsed.rawHash)) {
      state.stats.duplicates += 1;
      addAuditEvent(`Duplicate blocked (${parsed.source})`);
      return;
    }

    state.seenHashes.add(parsed.rawHash);
    state.transactions.unshift(parsed);
    state.stats.accepted += 1;
    addAuditEvent(`Transaction ingested: ${parsed.type} ${parsed.amount ? `SGD ${parsed.amount.toFixed(2)}` : ''}`.trim());
  });

  renderStats();
  renderLedger();
  updateGateChecklist();
};

const resetDemoData = () => {
  state.transactions = [];
  state.seenHashes = new Set();
  state.stats = { accepted: 0, ignored: 0, duplicates: 0 };
  addAuditEvent('Demo ledger reset');
  renderStats();
  renderLedger();
  updateGateChecklist();
};

const setStep = (step) => {
  currentStep = Math.max(1, Math.min(step, stepCount));
  stepEls.forEach((el) => {
    const isActive = Number(el.dataset.step) === currentStep;
    el.classList.toggle('step--active', isActive);
  });
  prevBtn.disabled = currentStep === 1;
  nextBtn.textContent = currentStep === stepCount ? 'Done' : 'Next';
};

prevBtn.addEventListener('click', () => {
  setStep(currentStep - 1);
  addAuditEvent(`Onboarding step changed to ${currentStep}`);
});

nextBtn.addEventListener('click', () => {
  if (currentStep === stepCount) {
    setStep(1);
    addAuditEvent('Onboarding stepper completed and reset');
    return;
  }
  setStep(currentStep + 1);
  addAuditEvent(`Onboarding step changed to ${currentStep}`);
});

passkeyToggle.addEventListener('change', () => {
  updateAuthStatus();
  addAuditEvent(`Passkey setting ${passkeyToggle.checked ? 'enabled' : 'disabled'}`);
});

mfaToggle.addEventListener('change', () => {
  updateAuthStatus();
  addAuditEvent(`MFA fallback ${mfaToggle.checked ? 'enabled' : 'disabled'}`);
});

ingestBtn.addEventListener('click', processNotifications);
clearLedgerBtn.addEventListener('click', resetDemoData);

setStep(1);
updateAuthStatus();
renderSessions();
renderLedger();
renderStats();
updateGateChecklist();
addAuditEvent('Sprint D demo initialized');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(
    () => addAuditEvent('Service worker registered'),
    () => addAuditEvent('Service worker registration failed')
  );
}

let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
  addAuditEvent('Install prompt available');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) {
    return;
  }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
  addAuditEvent('Install prompt handled');
});
