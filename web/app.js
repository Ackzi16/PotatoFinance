const STORAGE_KEY = 'potato_finance_mvp_v1';

const installBtn = document.getElementById('installBtn');
const tabButtons = Array.from(document.querySelectorAll('[data-tab]'));
const tabSections = Array.from(document.querySelectorAll('[data-section]'));

const kpiIncome = document.getElementById('kpiIncome');
const kpiExpense = document.getElementById('kpiExpense');
const kpiNet = document.getElementById('kpiNet');
const kpiUtilisation = document.getElementById('kpiUtilisation');

const csvFile = document.getElementById('csvFile');
const csvMapping = document.getElementById('csvMapping');
const mapDate = document.getElementById('mapDate');
const mapDescription = document.getElementById('mapDescription');
const mapAmount = document.getElementById('mapAmount');
const mapDebit = document.getElementById('mapDebit');
const mapCredit = document.getElementById('mapCredit');
const mapCurrency = document.getElementById('mapCurrency');
const mapAccountSource = document.getElementById('mapAccountSource');
const parseCsvBtn = document.getElementById('parseCsvBtn');
const importCsvBtn = document.getElementById('importCsvBtn');
const pdfFile = document.getElementById('pdfFile');
const parsePdfBtn = document.getElementById('parsePdfBtn');
const parsePdfCliBtn = document.getElementById('parsePdfCliBtn');
const downloadPdfCsvBtn = document.getElementById('downloadPdfCsvBtn');
const monopolyEndpoint = document.getElementById('monopolyEndpoint');
const monopolyApiKey = document.getElementById('monopolyApiKey');
const importPreviewBody = document.getElementById('importPreviewBody');
const importSummary = document.getElementById('importSummary');

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

const categoryRules = [
  { keywords: ['salary', 'payroll', 'giro salary'], category: 'Salary', direction: 'income' },
  { keywords: ['refund', 'reversal'], category: 'Refund', direction: 'income' },
  { keywords: ['dividend', 'interest received'], category: 'Investment Income', direction: 'income' },
  { keywords: ['grab', 'gojek', 'tada'], category: 'Transport' },
  { keywords: ['ntuc', 'don don donki', 'sheng siong'], category: 'Groceries' },
  { keywords: ['fast transfer out', 'paynow to'], category: 'Transfer' },
  { keywords: ['paynow received', 'fast in'], category: 'Transfer', direction: 'income' },
  { keywords: ['fee', 'charge', 'interest charged'], category: 'Fees' }
];

let importState = { headers: [], rows: [], parsedRows: [] };
let state = loadState();

function loadState() {
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
}

const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const money = (value) => `${state.profile.currency} ${Number(value).toFixed(2)}`;

const setActiveTab = (tab) => {
  tabButtons.forEach((btn) => btn.classList.toggle('tabbar__item--active', btn.dataset.tab === tab));
  tabSections.forEach((section) => section.classList.toggle('hidden', section.dataset.section !== tab));
};

const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
const yearKey = String(today.getFullYear());
const dayKey = formatDate(today);

const parseAmount = (value) => {
  if (value == null || value === '') {
    return null;
  }
  const normalized = String(value).replace(/,/g, '').replace(/[()]/g, '').trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized.replace(/[^0-9.-]/g, ''));
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeDate = (value) => {
  if (!value) {
    return formatDate(today);
  }

  const text = String(value).trim();
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDate(parsed);
  }

  const m = text.match(/(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
  if (!m) {
    return formatDate(today);
  }

  const year = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : String(today.getFullYear());
  return `${year}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
};

const cleanDescription = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const inferDirection = ({ debit, credit, amount, description }) => {
  const text = description.toLowerCase();
  const incomeWords = ['salary', 'refund', 'reversal', 'dividend', 'paynow received', 'fast in', 'interest received'];
  const expenseWords = ['card payment', 'payment', 'transfer out', 'paynow to', 'withdrawal', 'fee', 'charge', 'interest charged'];

  if (credit != null && credit > 0) {
    return 'income';
  }
  if (debit != null && debit > 0) {
    return 'expense';
  }
  if (incomeWords.some((keyword) => text.includes(keyword))) {
    return 'income';
  }
  if (expenseWords.some((keyword) => text.includes(keyword))) {
    return 'expense';
  }
  if (amount < 0) {
    return 'expense';
  }
  if (amount > 0) {
    return 'income';
  }
  return 'expense';
};

const inferCategory = (description, direction) => {
  const text = description.toLowerCase();
  for (const rule of categoryRules) {
    if (rule.direction && rule.direction !== direction) {
      continue;
    }

    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.category;
    }
  }

  return direction === 'income' ? 'Income' : 'General Expense';
};

const calculateConfidence = ({ description, amount, direction, date }) => {
  let score = 0.5;
  if (description) {
    score += 0.2;
  }
  if (amount > 0) {
    score += 0.2;
  }
  if (direction) {
    score += 0.05;
  }
  if (date) {
    score += 0.05;
  }
  return Math.min(0.99, score);
};

const fingerprint = (item) => {
  const desc = cleanDescription(item.description).toUpperCase();
  return `${item.posted_date}|${item.amount.toFixed(2)}|${desc}|${item.account_name}`;
};


const parsePdfTextLines = async (file) => {
  const buffer = await file.arrayBuffer();

  return new Promise((resolve, reject) => {
    const worker = new Worker('./pdf-worker.js');
    worker.onmessage = (event) => {
      const payload = event.data;
      worker.terminate();
      if (!payload.ok) {
        reject(new Error(payload.error || 'Failed to parse PDF content.'));
        return;
      }
      resolve(payload.lines || []);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('PDF worker failed to process the statement.'));
    };
    worker.postMessage({ buffer }, [buffer]);
  });
};

const parsePdfLinesToRows = (lines) => {
  const parsed = [];

  lines.forEach((line) => {
    const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/);
    const amountMatch = line.match(/([\(\-]?\d+[\d,]*\.\d{2}[\)]?)(?!.*\d)/);

    if (!dateMatch || !amountMatch) {
      return;
    }

    const date = normalizeDate(dateMatch[1]);
    const amountValue = parseAmount(amountMatch[1]);
    if (amountValue == null) {
      return;
    }

    const description = cleanDescription(
      line
        .replace(dateMatch[1], '')
        .replace(amountMatch[1], '')
        .replace(/\s+/g, ' ')
    );

    const direction = inferDirection({ debit: null, credit: null, amount: amountValue, description });
    const category = inferCategory(description, direction);
    const confidence = calculateConfidence({ description, amount: Math.abs(amountValue), direction, date }) - 0.07;

    parsed.push({
      source: 'pdf-statement',
      account_name: 'PDF Statement',
      posted_date: date,
      description,
      amount: Math.abs(amountValue),
      currency: state.profile.currency,
      direction,
      category,
      raw_text: line,
      confidence: Math.max(0.55, confidence),
      keep: true
    });
  });

  return parsed;
};

const aggregate = (predicate) => state.transactions.reduce((acc, tx) => {
  if (!predicate(tx)) {
    return acc;
  }
  if (tx.type === 'income') {
    acc.income += tx.amount;
  } else {
    acc.expense += tx.amount;
  }
  return acc;
}, { income: 0, expense: 0 });

const renderKpis = () => {
  const m = aggregate((tx) => tx.date.startsWith(monthKey));
  const net = m.income - m.expense;
  const util = m.income > 0 ? (m.expense / m.income) * 100 : 0;
  kpiIncome.textContent = money(m.income);
  kpiExpense.textContent = money(m.expense);
  kpiNet.textContent = money(net);
  kpiUtilisation.textContent = `${util.toFixed(1)}%`;
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
    row.innerHTML = '<td colspan="4">No transactions yet. Add your first transaction or import CSV.</td>';
    transactionsBody.appendChild(row);
    return;
  }

  [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).forEach((tx) => {
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

const renderImportPreview = () => {
  importPreviewBody.innerHTML = '';
  if (!importState.parsedRows.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="7">No parsed rows yet. Upload and parse a CSV first.</td>';
    importPreviewBody.appendChild(row);
    return;
  }

  importState.parsedRows.forEach((item, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="checkbox" data-keep-idx="${idx}" ${item.keep ? 'checked' : ''} /></td>
      <td>${item.posted_date}</td>
      <td>${item.description}</td>
      <td>${item.currency} ${item.amount.toFixed(2)}</td>
      <td>${item.direction}</td>
      <td>${item.category}</td>
      <td>${Math.round(item.confidence * 100)}%</td>
    `;
    importPreviewBody.appendChild(row);
  });

  const kept = importState.parsedRows.filter((item) => item.keep).length;
  importSummary.textContent = `${importState.parsedRows.length} parsed • ${kept} marked for import`;
};

const refreshAll = () => {
  profileName.value = state.profile.name;
  profileCurrency.value = state.profile.currency;
  renderAccountControls();
  renderTransactions();
  renderKpis();
  renderAnalytics();
  renderImportPreview();
};

const populateMappingOptions = (headers) => {
  const selects = [mapDate, mapDescription, mapAmount, mapDebit, mapCredit, mapCurrency, mapAccountSource];
  selects.forEach((sel) => {
    sel.innerHTML = '<option value="">-- none --</option>';
    headers.forEach((header) => {
      const option = document.createElement('option');
      option.value = header;
      option.textContent = header;
      sel.appendChild(option);
    });
  });

  const guess = (select, patterns) => {
    const found = headers.find((h) => patterns.some((p) => h.toLowerCase().includes(p)));
    if (found) {
      select.value = found;
    }
  };

  guess(mapDate, ['date', 'post']);
  guess(mapDescription, ['description', 'remark', 'merchant']);
  guess(mapAmount, ['amount']);
  guess(mapDebit, ['debit', 'withdrawal', 'dr']);
  guess(mapCredit, ['credit', 'deposit', 'cr']);
  guess(mapCurrency, ['currency', 'ccy']);
  guess(mapAccountSource, ['account', 'card', 'source']);
};

const ensureAccount = (name, type = 'bank') => {
  const normalized = (name || '').trim();
  if (!normalized) {
    return state.accounts[0]?.id || 'acc_cash';
  }

  const existing = state.accounts.find((acc) => acc.name.toLowerCase() === normalized.toLowerCase());
  if (existing) {
    return existing.id;
  }

  const id = `acc_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  state.accounts.push({ id, name: normalized, type });
  return id;
};

const parseCsvRows = () => {
  const getValue = (row, key) => (key ? row[key] : '');

  const parsed = importState.rows.map((row) => {
    const description = cleanDescription(getValue(row, mapDescription.value));
    const date = normalizeDate(getValue(row, mapDate.value));
    const debit = parseAmount(getValue(row, mapDebit.value));
    const credit = parseAmount(getValue(row, mapCredit.value));
    const amountCol = parseAmount(getValue(row, mapAmount.value));
    const amountRaw = credit ?? debit ?? amountCol ?? 0;
    const direction = inferDirection({ debit, credit, amount: amountRaw, description });
    const amount = Math.abs(amountRaw);
    const currency = cleanDescription(getValue(row, mapCurrency.value)) || state.profile.currency;
    const source = cleanDescription(getValue(row, mapAccountSource.value)) || 'CSV Import';
    const category = inferCategory(description, direction);
    const confidence = calculateConfidence({ description, amount, direction, date });

    return {
      source: source.toLowerCase().replace(/\s+/g, '-'),
      account_name: source,
      posted_date: date,
      description,
      amount,
      currency,
      direction,
      category,
      raw_text: Object.values(row).join(' | '),
      confidence,
      keep: true
    };
  });

  const existingFingerprints = new Set(state.transactions.map((tx) => fingerprint({
    posted_date: tx.date,
    amount: tx.amount,
    description: tx.note || tx.category,
    account_name: (state.accounts.find((acc) => acc.id === tx.accountId)?.name) || ''
  })));

  parsed.forEach((item) => {
    if (existingFingerprints.has(fingerprint(item))) {
      item.keep = false;
      item.confidence = Math.min(item.confidence, 0.6);
    }
  });

  importState.parsedRows = parsed;
  renderImportPreview();
};


const convertRowsToCsv = (rows) => {
  const headers = ['source', 'account_name', 'posted_date', 'description', 'amount', 'currency', 'direction', 'category', 'confidence'];
  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
  });
  return lines.join('\n');
};

const downloadTextFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

csvFile.addEventListener('change', async () => {
  const file = csvFile.files?.[0];
  if (!file) {
    return;
  }

  const text = await file.text();
  const rows = parseCsvText(text).filter((row) => row.length);
  if (rows.length < 2) {
    importSummary.textContent = 'CSV needs at least a header row and one data row.';
    return;
  }

  const headers = rows[0].map((h) => cleanDescription(h));
  const dataRows = rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] ?? '';
    });
    return record;
  });

  importState = { headers, rows: dataRows, parsedRows: [] };
  populateMappingOptions(headers);
  csvMapping.classList.remove('hidden');
  importSummary.textContent = `Loaded ${dataRows.length} CSV rows. Map columns and click Parse CSV.`;
});



const normalizeExternalRows = (rows) => {
  return rows
    .map((row) => {
      const date = normalizeDate(row.posted_date || row.date || row.transaction_date);
      const description = cleanDescription(row.description || row.merchant || row.raw_text || '');
      const amount = Math.abs(parseAmount(row.amount) || 0);
      const direction = row.direction || inferDirection({ debit: parseAmount(row.debit), credit: parseAmount(row.credit), amount: parseAmount(row.amount) || 0, description });
      const category = row.category || inferCategory(description, direction);
      const currency = cleanDescription(row.currency) || state.profile.currency;
      const confidence = Number(row.confidence) || calculateConfidence({ description, amount, direction, date });
      const accountName = cleanDescription(row.account_name || row.source || 'monopoly-core');

      return {
        source: row.source || 'monopoly-core',
        account_name: accountName,
        posted_date: date,
        description,
        amount,
        currency,
        direction,
        category,
        raw_text: row.raw_text || description,
        confidence,
        keep: true
      };
    })
    .filter((row) => row.amount > 0 && row.description);
};

parsePdfBtn.addEventListener('click', async () => {
  const file = pdfFile.files?.[0];
  if (!file) {
    importSummary.textContent = 'Select a PDF statement first.';
    return;
  }

  try {
    importSummary.textContent = 'Parsing PDF locally in your browser...';
    const lines = await parsePdfTextLines(file);
    const parsed = parsePdfLinesToRows(lines);

    if (!parsed.length) {
      importSummary.textContent = 'No transaction rows detected from PDF content. Try another statement or use CSV if available.';
      return;
    }

    const existingFingerprints = new Set(state.transactions.map((tx) => fingerprint({
      posted_date: tx.date,
      amount: tx.amount,
      description: tx.note || tx.category,
      account_name: (state.accounts.find((acc) => acc.id === tx.accountId)?.name) || ''
    })));

    parsed.forEach((item) => {
      if (existingFingerprints.has(fingerprint(item))) {
        item.keep = false;
        item.confidence = Math.min(item.confidence, 0.6);
      }
    });

    importState = { headers: [], rows: [], parsedRows: parsed };
    csvMapping.classList.add('hidden');
    renderImportPreview();
    importSummary.textContent = `Parsed ${parsed.length} rows from PDF (local parse). Review and confirm import.`;
  } catch (error) {
    importSummary.textContent = `Unable to parse PDF: ${error.message}`;
  }
});



parsePdfCliBtn.addEventListener('click', async () => {
  const file = pdfFile.files?.[0];
  if (!file) {
    importSummary.textContent = 'Select a PDF statement first.';
    return;
  }

  try {
    importSummary.textContent = 'Sending PDF to local monopoly-core parser...';
    const endpoint = monopolyEndpoint.value.trim() || 'http://127.0.0.1:8765/parse';
    const formData = new FormData();
    formData.append('file', file);

    const headers = monopolyApiKey.value.trim() ? { 'x-api-key': monopolyApiKey.value.trim() } : {};
    const response = await fetch(endpoint, { method: 'POST', body: formData, headers });
    if (!response.ok) {
      throw new Error(`Parser service error (${response.status})`);
    }

    const payload = await response.json();
    const normalized = normalizeExternalRows(payload.rows || []);

    if (!normalized.length) {
      importSummary.textContent = 'monopoly-core parser returned no rows.';
      return;
    }

    const existingFingerprints = new Set(state.transactions.map((tx) => fingerprint({
      posted_date: tx.date,
      amount: tx.amount,
      description: tx.note || tx.category,
      account_name: (state.accounts.find((acc) => acc.id === tx.accountId)?.name) || ''
    })));

    normalized.forEach((item) => {
      if (existingFingerprints.has(fingerprint(item))) {
        item.keep = false;
        item.confidence = Math.min(item.confidence, 0.6);
      }
    });

    importState = { headers: [], rows: [], parsedRows: normalized };
    csvMapping.classList.add('hidden');
    renderImportPreview();
    importSummary.textContent = `Parsed ${normalized.length} rows via monopoly-core. Review and confirm import.`;
  } catch (error) {
    importSummary.textContent = `Unable to parse using monopoly-core endpoint: ${error.message}`;
  }
});

downloadPdfCsvBtn.addEventListener('click', () => {
  if (!importState.parsedRows.length) {
    importSummary.textContent = 'Parse a PDF first before downloading CSV.';
    return;
  }

  const csvContent = convertRowsToCsv(importState.parsedRows);
  downloadTextFile(`potato-parsed-${Date.now()}.csv`, csvContent);
  importSummary.textContent = 'Parsed CSV downloaded securely (local device only).';
});

parseCsvBtn.addEventListener('click', () => {
  if (!importState.rows.length) {
    importSummary.textContent = 'Upload a CSV file first.';
    return;
  }

  if (!mapDate.value || !mapDescription.value || (!mapAmount.value && !mapDebit.value && !mapCredit.value)) {
    importSummary.textContent = 'Please map at least date, description, and one amount/debit/credit column.';
    return;
  }

  parseCsvRows();
});

importPreviewBody.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const idx = Number(target.dataset.keepIdx);
  if (Number.isNaN(idx) || !importState.parsedRows[idx]) {
    return;
  }

  importState.parsedRows[idx].keep = target.checked;
  renderImportPreview();
});

importCsvBtn.addEventListener('click', () => {
  const selected = importState.parsedRows.filter((row) => row.keep);
  if (!selected.length) {
    importSummary.textContent = 'No rows selected for import.';
    return;
  }

  selected.forEach((row) => {
    const accountId = ensureAccount(row.account_name, 'bank');
    state.transactions.push({
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
      date: row.posted_date,
      amount: row.amount,
      type: row.direction,
      accountId,
      category: row.category,
      note: row.description
    });
  });

  persist();
  refreshAll();
  importSummary.textContent = `Imported ${selected.length} transactions successfully.`;
  setActiveTab('transactions');
});

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
  state.accounts.push({ id: `acc_${Date.now()}`, name: accountName.value.trim(), type: accountType.value });
  accountName.value = '';
  accountType.value = 'bank';
  persist();
  refreshAll();
});

tabButtons.forEach((btn) => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));

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
