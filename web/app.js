let currentStep = 1;
const stepCount = 3;
const maxAuditEvents = 8;

const stepEls = Array.from(document.querySelectorAll('.step'));
const prevBtn = document.getElementById('prevStep');
const nextBtn = document.getElementById('nextStep');
const passkeyToggle = document.getElementById('passkeyToggle');
const mfaToggle = document.getElementById('mfaToggle');
const authStatus = document.getElementById('authStatus');
const sessionList = document.getElementById('sessionList');
const auditList = document.getElementById('auditList');

const state = {
  sessions: [
    { id: 's-1', device: 'iPhone 16', location: 'Singapore', current: true },
    { id: 's-2', device: 'iPad Pro', location: 'Singapore', current: false },
    { id: 's-3', device: 'Chrome Desktop', location: 'San Francisco', current: false }
  ],
  auditEvents: []
};

const nowIso = () => new Date().toISOString();

const addAuditEvent = (action) => {
  state.auditEvents = [{ action, timestamp: nowIso() }, ...state.auditEvents].slice(0, maxAuditEvents);
  renderAuditEvents();
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

setStep(1);
updateAuthStatus();
renderSessions();
addAuditEvent('Session list initialized');

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
  addAuditEvent('Install prompt is available');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) {
    return;
  }

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
  addAuditEvent('Install prompt accepted or dismissed');
});
