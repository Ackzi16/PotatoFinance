const STORAGE_KEY = 'potato_finance_mvp_v1';

const installBtn = document.getElementById('installBtn');
const tabButtons = Array.from(document.querySelectorAll('[data-tab]'));
const tabSections = Array.from(document.querySelectorAll('[data-section]'));

const kpiIncome = document.getElementById('kpiIncome');
const kpiExpense = document.getElementById('kpiExpense');
const kpiNet = document.getElementById('kpiNet');
const kpiUtilisation = document.getElementById('kpiUtilisation');

const transactionForm = document.getElementById('transactionForm');
const transactionId = document.getElementById('transactionId');
const txDate = document.getElementById('txDate');
const txAmount = document.getElementById('txAmount');
const txType = document.getElementById('txType');
const txAccount = document.getElementById('txAccount');
const txCategory = document.getElementById('txCategory');
const txNote = document.getElementById('txNote');
const resetTxBtn = document.getElementById('resetTxBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveTxBtn = document.getElementById('saveTxBtn');
const txModeIndicator = document.getElementById('txModeIndicator');
const transactionsBody = document.getElementById('transactionsBody');

const analyticsBars = document.getElementById('analyticsBars');

const profileForm = document.getElementById('profileForm');
const profileName = document.getElementById('profileName');
const profileCurrency = document.getElementById('profileCurrency');
const passwordForm = document.getElementById('passwordForm');
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const accountForm = document.getElementById('accountForm');
const accountName = document.getElementById('accountName');
const accountType = document.getElementById('accountType');
const accountsList = document.getElementById('accountsList');

const today = new Date();
const formatDate = (date) => date.toISOString().slice(0, 10);

const defaultState = {
  profile: { name: 'Potato User', currency: 'SGD' },
  password: 'potato123',
  accounts: [{ id: 'acc_cash', name: 'Cash Wallet', type: 'cash' }],
  transactions: []
};

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return structuredClone(defaultState);
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      profile: { ...defaultState.profile, ...(parsed.profile || {}) },
      accounts: parsed.accounts?.length ? parsed.accounts : structuredClone(defaultState.accounts),
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
    };
  } catch {
    return structuredClone(defaultState);
  }
};

let state = loadState();

const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const money = (value) => `${state.profile.currency} ${Number(value).toFixed(2)}`;

const setActiveTab = (tab) => {
  tabButtons.forEach((btn) => btn.classList.toggle('tabbar__item--active', btn.dataset.tab === tab));
  tabSections.forEach((section) => section.classList.toggle('hidden', section.dataset.section !== tab));
};

const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
const yearKey = String(today.getFullYear());
const dayKey = formatDate(today);

const aggregate = (predicate) => {
  return state.transactions.reduce(
    (acc, tx) => {
      if (!predicate(tx)) {
        return acc;
      }
      if (tx.type === 'income') {
        acc.income += tx.amount;
      } else {
        acc.expense += tx.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );
};

const renderKpis = () => {
  const m = aggregate((tx) => tx.date.startsWith(monthKey));
  const net = m.income - m.expense;
  const util = m.income > 0 ? (m.expense / m.income) * 100 : 0;

  kpiIncome.textContent = money(m.income);
  kpiExpense.textContent = money(m.expense);
  kpiNet.textContent = money(net);
  kpiUtilisation.textContent = `${util.toFixed(1)}%`;
};


const setTransactionMode = (mode, tx = null) => {
  const isEdit = mode === 'edit';
  transactionForm.dataset.mode = isEdit ? 'edit' : 'create';
  txModeIndicator.classList.toggle('hidden', !isEdit);
  cancelEditBtn.classList.toggle('hidden', !isEdit);
  saveTxBtn.textContent = isEdit ? 'Update transaction' : 'Save transaction';

  if (isEdit && tx) {
    txModeIndicator.textContent = `Editing ${tx.type} on ${tx.date}`;
  }
};

const renderAccountControls = () => {
  txAccount.innerHTML = '';
  accountsList.innerHTML = '';

  state.accounts.forEach((account) => {
    const option = document.createElement('option');
    option.value = account.id;
    option.textContent = `${account.name} (${account.type})`;
    txAccount.appendChild(option);

    const li = document.createElement('li');
    li.textContent = `${account.name} • ${account.type}`;
    accountsList.appendChild(li);
  });
};

const clearTransactionForm = () => {
  transactionId.value = '';
  setTransactionMode('create');
  txDate.value = formatDate(today);
  txAmount.value = '';
  txType.value = 'expense';
  txCategory.value = '';
  txNote.value = '';
  if (state.accounts[0]) {
    txAccount.value = state.accounts[0].id;
  }
};

const renderTransactions = () => {
  transactionsBody.innerHTML = '';

  if (!state.transactions.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4">No transactions yet. Add your first transaction above.</td>';
    transactionsBody.appendChild(row);
    return;
  }

  [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((tx) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${tx.date}</td>
        <td>${money(tx.amount)}</td>
        <td>${tx.type}</td>
        <td>
          <button class="btn" data-action="edit" data-id="${tx.id}">Edit</button>
          <button class="btn" data-action="delete" data-id="${tx.id}">Del</button>
        </td>
      `;

      transactionsBody.appendChild(row);
    });
};

const renderAnalytics = () => {
  const periods = [
    { label: 'Today', data: aggregate((tx) => tx.date === dayKey) },
    { label: 'This Month', data: aggregate((tx) => tx.date.startsWith(monthKey)) },
    { label: 'This Year', data: aggregate((tx) => tx.date.startsWith(yearKey)) }
  ];

  const maxValue = Math.max(...periods.flatMap((period) => [period.data.income, period.data.expense]), 1);

  analyticsBars.innerHTML = '';
  periods.forEach((period) => {
    const incomeWidth = (period.data.income / maxValue) * 100;
    const expenseWidth = (period.data.expense / maxValue) * 100;

    const card = document.createElement('article');
    card.className = 'chart-row';
    card.innerHTML = `
      <h4>${period.label}</h4>
      <div class="bar-group">
        <span class="bar-label">Income — ${money(period.data.income)}</span>
        <div class="bar-track"><div class="bar-fill bar-fill--income" style="width:${incomeWidth}%"></div></div>
        <span class="bar-label">Expense — ${money(period.data.expense)}</span>
        <div class="bar-track"><div class="bar-fill bar-fill--expense" style="width:${expenseWidth}%"></div></div>
      </div>
    `;
    analyticsBars.appendChild(card);
  });
};

const refreshAll = () => {
  profileName.value = state.profile.name;
  profileCurrency.value = state.profile.currency;
  renderAccountControls();
  renderTransactions();
  renderKpis();
  renderAnalytics();
};

transactionForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const payload = {
    id: transactionId.value || `tx_${Date.now()}`,
    date: txDate.value,
    amount: Number(txAmount.value),
    type: txType.value,
    accountId: txAccount.value,
    category: txCategory.value.trim(),
    note: txNote.value.trim()
  };

  const existingIndex = state.transactions.findIndex((tx) => tx.id === payload.id);
  if (existingIndex >= 0) {
    state.transactions[existingIndex] = payload;
  } else {
    state.transactions.push(payload);
  }

  persist();
  refreshAll();
  clearTransactionForm();
  setActiveTab('transactions');
});

resetTxBtn.addEventListener('click', clearTransactionForm);
cancelEditBtn.addEventListener('click', clearTransactionForm);

transactionsBody.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const id = target.dataset.id;
  const action = target.dataset.action;
  const tx = state.transactions.find((item) => item.id === id);
  if (!tx) {
    return;
  }

  if (action === 'delete') {
    state.transactions = state.transactions.filter((item) => item.id !== id);
    persist();
    refreshAll();
    return;
  }

  transactionId.value = tx.id;
  txDate.value = tx.date;
  txAmount.value = String(tx.amount);
  txType.value = tx.type;
  txAccount.value = tx.accountId;
  txCategory.value = tx.category;
  txNote.value = tx.note;
  setTransactionMode('edit', tx);
});

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.profile = { name: profileName.value.trim(), currency: profileCurrency.value.trim().toUpperCase() || 'SGD' };
  persist();
  refreshAll();
});

passwordForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (currentPassword.value !== state.password) {
    alert('Current password is incorrect.');
    return;
  }

  state.password = newPassword.value;
  currentPassword.value = '';
  newPassword.value = '';
  persist();
  alert('Password updated successfully.');
});

accountForm.addEventListener('submit', (event) => {
  event.preventDefault();

  state.accounts.push({
    id: `acc_${Date.now()}`,
    name: accountName.value.trim(),
    type: accountType.value
  });

  accountName.value = '';
  accountType.value = 'bank';
  persist();
  refreshAll();
});

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) {
    return;
  }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

setActiveTab('home');
refreshAll();
clearTransactionForm();
