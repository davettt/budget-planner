import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getAccounts,
  saveAccounts,
  getIncome,
  saveIncome,
  getExpenses,
  saveExpenses,
  getCategories,
  saveCategories,
  getScenarios,
  saveScenarios,
  getSettings,
  saveSettings,
  getNetWorthHistory,
  saveNetWorthHistory,
  readJSON,
  writeJSON,
  writeJSONBatch,
  withLock,
} from './data.js';

function pick(obj, fields) {
  const result = {};
  for (const f of fields) {
    if (f in obj) result[f] = obj[f];
  }
  return result;
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

const VALID_FREQUENCIES = new Set([
  'daily',
  'weekly',
  'fortnightly',
  'monthly',
  'quarterly',
  'annually',
  'one-off',
]);

const ACCOUNT_FIELDS = [
  'name',
  'type',
  'balance',
  'interestRate',
  'monthlyFee',
  'institution',
  'creditLimit',
];
const INCOME_FIELDS = [
  'name',
  'amount',
  'frequency',
  'isGross',
  'taxRate',
  'startDate',
  'endDate',
  'active',
];
const EXPENSE_FIELDS = [
  'name',
  'amount',
  'categoryId',
  'subcategory',
  'frequency',
  'entryMode',
  'statementPeriod',
  'startDate',
  'endDate',
  'active',
  'paused',
];
const CATEGORY_FIELDS = ['name', 'icon', 'color', 'subcategories'];
const SCENARIO_FIELDS = [
  'name',
  'type',
  'loanDetails',
  'removedExpenseIds',
  'removedIncomeIds',
  'additionalExpenses',
];
const SETTINGS_FIELDS = [
  'currency',
  'currencySymbol',
  'defaultPeriod',
  'theme',
  'financialYearStartMonth',
];

const BACKUP_VERSION = '1.0.0';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const VALID_ENTRY_MODES = new Set(['individual', 'category-total', 'quick-estimate']);
const VALID_THEMES = new Set(['light', 'dark', 'system']);
const VALID_PERIODS = new Set(['weekly', 'fortnightly', 'monthly', 'annually']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value, min = -Infinity, max = Infinity) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function isString(value, max = 200) {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}

function isLoanDetails(value) {
  return (
    value === null ||
    (isRecord(value) &&
      isFiniteNumber(value.purchasePrice, 0) &&
      isFiniteNumber(value.deposit, 0) &&
      isFiniteNumber(value.interestRate, 0, 100) &&
      isFiniteNumber(value.termYears, 0, 100) &&
      VALID_FREQUENCIES.has(value.repaymentFrequency) &&
      value.repaymentFrequency !== 'one-off')
  );
}

function isScenarioExpense(value) {
  return (
    isRecord(value) &&
    isString(value.name) &&
    isFiniteNumber(value.amount, 0) &&
    VALID_FREQUENCIES.has(value.frequency) &&
    isString(value.categoryId)
  );
}

function validateBackup(data) {
  if (!isRecord(data) || data.version !== BACKUP_VERSION) return 'Unsupported backup version';
  const collections = [
    'accounts',
    'income',
    'expenses',
    'categories',
    'scenarios',
    'networthHistory',
  ];
  if (collections.some((key) => !Array.isArray(data[key]))) return 'Backup collections are missing';
  if (!isRecord(data.settings)) return 'Backup settings are invalid';
  if (collections.some((key) => data[key].length > 10000))
    return 'Backup contains too many records';

  if (
    !data.accounts.every(
      (a) =>
        isRecord(a) &&
        isString(a.id) &&
        isString(a.name) &&
        VALID_ACCOUNT_TYPES.has(a.type) &&
        isFiniteNumber(a.balance) &&
        Array.isArray(a.balanceHistory) &&
        a.balanceHistory.every(
          (b) => isRecord(b) && ISO_DATE.test(b.date) && isFiniteNumber(b.balance),
        ),
    )
  )
    return 'Backup accounts are invalid';
  if (
    !data.income.every(
      (i) =>
        isRecord(i) &&
        isString(i.id) &&
        isString(i.name) &&
        isFiniteNumber(i.amount, 0) &&
        VALID_FREQUENCIES.has(i.frequency) &&
        ISO_DATE.test(i.startDate) &&
        (i.endDate === null || ISO_DATE.test(i.endDate)) &&
        typeof i.active === 'boolean' &&
        (i.taxRate === null || isFiniteNumber(i.taxRate, 0, 100)),
    )
  )
    return 'Backup income is invalid';
  if (
    !data.expenses.every(
      (e) =>
        isRecord(e) &&
        isString(e.id) &&
        isString(e.name) &&
        isFiniteNumber(e.amount, 0) &&
        isString(e.categoryId) &&
        VALID_FREQUENCIES.has(e.frequency) &&
        VALID_ENTRY_MODES.has(e.entryMode) &&
        ISO_DATE.test(e.startDate) &&
        (e.endDate === null || ISO_DATE.test(e.endDate)) &&
        typeof e.active === 'boolean' &&
        typeof e.paused === 'boolean',
    )
  )
    return 'Backup expenses are invalid';
  if (
    !data.categories.every(
      (c) =>
        isRecord(c) &&
        isString(c.id) &&
        isString(c.name) &&
        isString(c.icon) &&
        HEX_COLOR.test(c.color) &&
        Array.isArray(c.subcategories) &&
        c.subcategories.every((s) => isString(s)) &&
        typeof c.isDefault === 'boolean' &&
        Number.isInteger(c.sortOrder),
    )
  )
    return 'Backup categories are invalid';
  if (
    !data.scenarios.every(
      (s) =>
        isRecord(s) &&
        isString(s.id) &&
        isString(s.name) &&
        (s.type === 'loan' || s.type === 'general') &&
        isLoanDetails(s.loanDetails) &&
        Array.isArray(s.removedExpenseIds) &&
        s.removedExpenseIds.every((id) => isString(id)) &&
        Array.isArray(s.removedIncomeIds) &&
        s.removedIncomeIds.every((id) => isString(id)) &&
        Array.isArray(s.additionalExpenses) &&
        s.additionalExpenses.every(isScenarioExpense),
    )
  )
    return 'Backup scenarios are invalid';
  if (
    !isString(data.settings.currency, 5) ||
    !isString(data.settings.currencySymbol, 3) ||
    !VALID_PERIODS.has(data.settings.defaultPeriod) ||
    !VALID_THEMES.has(data.settings.theme) ||
    !Number.isInteger(data.settings.financialYearStartMonth) ||
    data.settings.financialYearStartMonth < 1 ||
    data.settings.financialYearStartMonth > 12
  )
    return 'Backup settings are invalid';
  if (
    !data.networthHistory.every(
      (n) =>
        isRecord(n) &&
        ISO_DATE.test(n.date) &&
        isFiniteNumber(n.totalAssets) &&
        isFiniteNumber(n.totalLiabilities) &&
        isFiniteNumber(n.netWorth) &&
        isRecord(n.breakdown) &&
        Object.values(n.breakdown).every((v) => isFiniteNumber(v)),
    )
  )
    return 'Backup net worth history is invalid';

  const categoryIds = new Set(data.categories.map((c) => c.id));
  if (data.expenses.some((e) => !categoryIds.has(e.categoryId))) {
    return 'Backup contains expenses with unknown categories';
  }
  return null;
}

const router = Router();

// ── Accounts ──────────────────────────────────────────────

router.get(
  '/api/accounts',
  asyncHandler(async (_req, res) => {
    res.json(await getAccounts());
  }),
);

const VALID_ACCOUNT_TYPES = new Set([
  'savings',
  'transaction',
  'investment',
  'cash',
  'credit-card',
  'loan',
  'mortgage',
]);

router.post(
  '/api/accounts',
  asyncHandler(async (req, res) => {
    if (!req.body.name || typeof req.body.name !== 'string' || !req.body.name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!req.body.type || !VALID_ACCOUNT_TYPES.has(req.body.type)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    return withLock('accounts.json', async () => {
      const accounts = await getAccounts();
      const now = new Date().toISOString();
      const account = {
        id: uuidv4(),
        name: req.body.name,
        type: req.body.type,
        balance: req.body.balance || 0,
        interestRate: req.body.interestRate ?? null,
        monthlyFee: req.body.monthlyFee ?? 0,
        institution: req.body.institution ?? null,
        creditLimit: req.body.creditLimit ?? null,
        balanceHistory: [{ date: now.split('T')[0], balance: req.body.balance || 0 }],
        createdAt: now,
        updatedAt: now,
      };
      accounts.push(account);
      await saveAccounts(accounts);
      res.status(201).json(account);
    });
  }),
);

router.put(
  '/api/accounts/:id',
  asyncHandler(async (req, res) => {
    return withLock('accounts.json', async () => {
      const accounts = await getAccounts();
      const idx = accounts.findIndex((a) => a.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Account not found' });
      const now = new Date().toISOString();
      const updated = { ...accounts[idx], ...pick(req.body, ACCOUNT_FIELDS), updatedAt: now };
      if (req.body.balance !== undefined && req.body.balance !== accounts[idx].balance) {
        updated.balanceHistory = [
          ...(updated.balanceHistory || []),
          { date: now.split('T')[0], balance: req.body.balance },
        ];
      }
      accounts[idx] = updated;
      await saveAccounts(accounts);
      res.json(updated);
    });
  }),
);

router.delete(
  '/api/accounts/:id',
  asyncHandler(async (req, res) => {
    return withLock('accounts.json', async () => {
      const accounts = await getAccounts();
      const filtered = accounts.filter((a) => a.id !== req.params.id);
      await saveAccounts(filtered);
      res.json({ success: true });
    });
  }),
);

// ── Income ────────────────────────────────────────────────

router.get(
  '/api/income',
  asyncHandler(async (_req, res) => {
    res.json(await getIncome());
  }),
);

router.post(
  '/api/income',
  asyncHandler(async (req, res) => {
    if (!req.body.name || typeof req.body.name !== 'string' || !req.body.name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (typeof req.body.amount !== 'number' || req.body.amount < 0) {
      return res.status(400).json({ error: 'Amount must be a non-negative number' });
    }
    if (req.body.frequency && !VALID_FREQUENCIES.has(req.body.frequency)) {
      return res.status(400).json({ error: 'Invalid frequency' });
    }
    return withLock('income.json', async () => {
      const income = await getIncome();
      const entry = {
        id: uuidv4(),
        name: req.body.name,
        amount: req.body.amount,
        frequency: req.body.frequency,
        isGross: req.body.isGross ?? false,
        taxRate: req.body.taxRate ?? null,
        startDate: req.body.startDate || new Date().toISOString().split('T')[0],
        endDate: req.body.endDate ?? null,
        active: true,
        createdAt: new Date().toISOString(),
      };
      income.push(entry);
      await saveIncome(income);
      res.status(201).json(entry);
    });
  }),
);

router.put(
  '/api/income/:id',
  asyncHandler(async (req, res) => {
    if (
      req.body.amount !== undefined &&
      (typeof req.body.amount !== 'number' || req.body.amount < 0)
    ) {
      return res.status(400).json({ error: 'Amount must be a non-negative number' });
    }
    if (req.body.frequency && !VALID_FREQUENCIES.has(req.body.frequency)) {
      return res.status(400).json({ error: 'Invalid frequency' });
    }
    return withLock('income.json', async () => {
      const income = await getIncome();
      const idx = income.findIndex((i) => i.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Income not found' });
      income[idx] = { ...income[idx], ...pick(req.body, INCOME_FIELDS) };
      await saveIncome(income);
      res.json(income[idx]);
    });
  }),
);

router.delete(
  '/api/income/:id',
  asyncHandler(async (req, res) => {
    return withLock('income.json', async () => {
      const income = await getIncome();
      const filtered = income.filter((i) => i.id !== req.params.id);
      await saveIncome(filtered);

      const scenarios = await getScenarios();
      let dirty = false;
      for (const s of scenarios) {
        if (s.removedIncomeIds && s.removedIncomeIds.includes(req.params.id)) {
          s.removedIncomeIds = s.removedIncomeIds.filter((id) => id !== req.params.id);
          dirty = true;
        }
      }
      if (dirty) await saveScenarios(scenarios);

      res.json({ success: true });
    });
  }),
);

// ── Expenses ──────────────────────────────────────────────

router.get(
  '/api/expenses',
  asyncHandler(async (_req, res) => {
    res.json(await getExpenses());
  }),
);

router.post(
  '/api/expenses',
  asyncHandler(async (req, res) => {
    if (!req.body.name || typeof req.body.name !== 'string' || !req.body.name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (typeof req.body.amount !== 'number' || req.body.amount < 0) {
      return res.status(400).json({ error: 'Amount must be a non-negative number' });
    }
    if (req.body.frequency && !VALID_FREQUENCIES.has(req.body.frequency)) {
      return res.status(400).json({ error: 'Invalid frequency' });
    }
    return withLock('expenses.json', async () => {
      const expenses = await getExpenses();
      const entry = {
        id: uuidv4(),
        name: req.body.name,
        amount: req.body.amount,
        categoryId: req.body.categoryId,
        subcategory: req.body.subcategory ?? null,
        frequency: req.body.frequency,
        entryMode: req.body.entryMode || 'individual',
        statementPeriod: req.body.statementPeriod ?? null,
        startDate: req.body.startDate || new Date().toISOString().split('T')[0],
        endDate: req.body.endDate ?? null,
        active: true,
        paused: false,
        createdAt: new Date().toISOString(),
      };
      expenses.push(entry);
      await saveExpenses(expenses);
      res.status(201).json(entry);
    });
  }),
);

router.put(
  '/api/expenses/:id',
  asyncHandler(async (req, res) => {
    if (
      req.body.amount !== undefined &&
      (typeof req.body.amount !== 'number' || req.body.amount < 0)
    ) {
      return res.status(400).json({ error: 'Amount must be a non-negative number' });
    }
    if (req.body.frequency && !VALID_FREQUENCIES.has(req.body.frequency)) {
      return res.status(400).json({ error: 'Invalid frequency' });
    }
    return withLock('expenses.json', async () => {
      const expenses = await getExpenses();
      const idx = expenses.findIndex((e) => e.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Expense not found' });
      expenses[idx] = { ...expenses[idx], ...pick(req.body, EXPENSE_FIELDS) };
      await saveExpenses(expenses);
      res.json(expenses[idx]);
    });
  }),
);

router.delete(
  '/api/expenses/:id',
  asyncHandler(async (req, res) => {
    return withLock('expenses.json', async () => {
      const expenses = await getExpenses();
      const filtered = expenses.filter((e) => e.id !== req.params.id);
      await saveExpenses(filtered);

      const scenarios = await getScenarios();
      let dirty = false;
      for (const s of scenarios) {
        if (s.removedExpenseIds && s.removedExpenseIds.includes(req.params.id)) {
          s.removedExpenseIds = s.removedExpenseIds.filter((id) => id !== req.params.id);
          dirty = true;
        }
      }
      if (dirty) await saveScenarios(scenarios);

      res.json({ success: true });
    });
  }),
);

// ── Categories ────────────────────────────────────────────

router.get(
  '/api/categories',
  asyncHandler(async (_req, res) => {
    res.json(await getCategories());
  }),
);

router.post(
  '/api/categories',
  asyncHandler(async (req, res) => {
    return withLock('categories.json', async () => {
      const categories = await getCategories();
      const category = {
        id: uuidv4(),
        name: req.body.name,
        icon: req.body.icon || 'tag',
        color: req.body.color || '#94A3B8',
        subcategories: req.body.subcategories || [],
        isDefault: false,
        sortOrder: categories.length,
      };
      categories.push(category);
      await saveCategories(categories);
      res.status(201).json(category);
    });
  }),
);

router.put(
  '/api/categories/:id',
  asyncHandler(async (req, res) => {
    return withLock('categories.json', async () => {
      const categories = await getCategories();
      const idx = categories.findIndex((c) => c.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Category not found' });
      categories[idx] = { ...categories[idx], ...pick(req.body, CATEGORY_FIELDS) };
      await saveCategories(categories);
      res.json(categories[idx]);
    });
  }),
);

router.delete(
  '/api/categories/:id',
  asyncHandler(async (req, res) => {
    return withLock('categories.json', async () => {
      const expenses = await getExpenses();
      const hasExpenses = expenses.some((e) => e.categoryId === req.params.id);
      if (hasExpenses) {
        return res.status(400).json({ error: 'Reassign expenses before deleting this category' });
      }
      const categories = await getCategories();
      const filtered = categories.filter((c) => c.id !== req.params.id);
      await saveCategories(filtered);
      res.json({ success: true });
    });
  }),
);

// ── Scenarios ─────────────────────────────────────────────

router.get(
  '/api/scenarios',
  asyncHandler(async (_req, res) => {
    res.json(await getScenarios());
  }),
);

router.post(
  '/api/scenarios',
  asyncHandler(async (req, res) => {
    return withLock('scenarios.json', async () => {
      const scenarios = await getScenarios();
      const scenario = {
        id: uuidv4(),
        ...pick(req.body, SCENARIO_FIELDS),
        createdAt: new Date().toISOString(),
      };
      scenarios.push(scenario);
      await saveScenarios(scenarios);
      res.status(201).json(scenario);
    });
  }),
);

router.put(
  '/api/scenarios/:id',
  asyncHandler(async (req, res) => {
    return withLock('scenarios.json', async () => {
      const scenarios = await getScenarios();
      const idx = scenarios.findIndex((s) => s.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Scenario not found' });
      scenarios[idx] = { ...scenarios[idx], ...pick(req.body, SCENARIO_FIELDS) };
      await saveScenarios(scenarios);
      res.json(scenarios[idx]);
    });
  }),
);

router.delete(
  '/api/scenarios/:id',
  asyncHandler(async (req, res) => {
    return withLock('scenarios.json', async () => {
      const scenarios = await getScenarios();
      const filtered = scenarios.filter((s) => s.id !== req.params.id);
      await saveScenarios(filtered);
      res.json({ success: true });
    });
  }),
);

// ── Net Worth ─────────────────────────────────────────────

router.get(
  '/api/networth',
  asyncHandler(async (_req, res) => {
    res.json(await getNetWorthHistory());
  }),
);

router.post(
  '/api/networth/snapshot',
  asyncHandler(async (_req, res) => {
    return withLock('networth-history.json', async () => {
      const accounts = await getAccounts();
      const history = await getNetWorthHistory();

      const assetTypes = new Set(['savings', 'transaction', 'investment', 'cash']);
      const liabilityTypes = new Set(['credit-card', 'loan', 'mortgage']);

      let totalAssets = 0;
      let totalLiabilities = 0;
      const breakdown = {};

      for (const account of accounts) {
        const bal = account.balance || 0;
        if (assetTypes.has(account.type)) {
          totalAssets += bal;
          breakdown[account.type] = (breakdown[account.type] || 0) + bal;
        } else if (liabilityTypes.has(account.type)) {
          totalLiabilities += Math.abs(bal);
          breakdown[account.type] = (breakdown[account.type] || 0) - Math.abs(bal);
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const snapshot = {
        date: today,
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        breakdown,
      };

      const existingIdx = history.findIndex((s) => s.date === today);
      if (existingIdx !== -1) {
        history[existingIdx] = snapshot;
      } else {
        history.push(snapshot);
      }
      await saveNetWorthHistory(history);
      res.status(201).json(snapshot);
    });
  }),
);

// ── Settings ──────────────────────────────────────────────

router.get(
  '/api/settings',
  asyncHandler(async (_req, res) => {
    res.json(await getSettings());
  }),
);

router.put(
  '/api/settings',
  asyncHandler(async (req, res) => {
    if (
      req.body.financialYearStartMonth !== undefined &&
      (typeof req.body.financialYearStartMonth !== 'number' ||
        req.body.financialYearStartMonth < 1 ||
        req.body.financialYearStartMonth > 12)
    ) {
      return res.status(400).json({ error: 'financialYearStartMonth must be 1-12' });
    }
    return withLock('settings.json', async () => {
      const current = await getSettings();
      const updated = { ...current, ...pick(req.body, SETTINGS_FIELDS) };
      await saveSettings(updated);
      res.json(updated);
    });
  }),
);

// ── Backup / Restore ──────────────────────────────────────

router.get(
  '/api/backup',
  asyncHandler(async (_req, res) => {
    const backup = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      accounts: (await readJSON('accounts.json')) || [],
      income: (await readJSON('income.json')) || [],
      expenses: (await readJSON('expenses.json')) || [],
      categories: (await readJSON('categories.json')) || [],
      scenarios: (await readJSON('scenarios.json')) || [],
      settings: (await readJSON('settings.json')) || {},
      networthHistory: (await readJSON('networth-history.json')) || [],
    };
    res.json(backup);
  }),
);

router.post(
  '/api/restore',
  asyncHandler(async (req, res) => {
    const data = req.body;
    const validationError = validateBackup(data);
    if (validationError) return res.status(400).json({ error: validationError });

    const sanitizeArray = (arr, allowedFields) => {
      if (!Array.isArray(arr)) return undefined;
      return arr.map((item) => {
        const clean = pick(item, ['id', 'createdAt', 'updatedAt', ...allowedFields]);
        if (!clean.id) clean.id = item.id || uuidv4();
        return clean;
      });
    };

    return withLock('restore', async () => {
      const NW_FIELDS = ['date', 'totalAssets', 'totalLiabilities', 'netWorth', 'breakdown'];
      const entries = [
        ['accounts.json', sanitizeArray(data.accounts, [...ACCOUNT_FIELDS, 'balanceHistory'])],
        ['income.json', sanitizeArray(data.income, INCOME_FIELDS)],
        ['expenses.json', sanitizeArray(data.expenses, EXPENSE_FIELDS)],
        [
          'categories.json',
          sanitizeArray(data.categories, [...CATEGORY_FIELDS, 'isDefault', 'sortOrder']),
        ],
        ['scenarios.json', sanitizeArray(data.scenarios, SCENARIO_FIELDS)],
        ['settings.json', pick(data.settings, SETTINGS_FIELDS)],
        ['networth-history.json', data.networthHistory.map((item) => pick(item, NW_FIELDS))],
      ];
      await writeJSONBatch(entries);
      res.json({ success: true });
    });
  }),
);

export default router;
