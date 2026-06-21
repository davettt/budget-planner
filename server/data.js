import fs from 'fs/promises';
import path from 'path';
import { DATA_DIR } from './config.js';

const DEFAULT_CATEGORIES = [
  {
    id: 'housing',
    name: 'Housing',
    icon: 'home',
    color: '#3B82F6',
    subcategories: [
      'Rent',
      'Mortgage',
      'Rates',
      'Insurance',
      'Repairs & Maintenance',
      'Furniture',
      'Renovations',
      'Body Corp',
      'Other',
    ],
    isDefault: true,
    sortOrder: 0,
  },
  {
    id: 'food',
    name: 'Food',
    icon: 'utensils',
    color: '#F97316',
    subcategories: ['Groceries', 'Eating Out', 'Other'],
    isDefault: true,
    sortOrder: 1,
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: 'car',
    color: '#8B5CF6',
    subcategories: [
      'Fuel',
      'Public Transport',
      'Registration',
      'Insurance',
      'Service',
      'Tolls',
      'Parking',
      'Tyres',
      'Car Purchase',
      'Uber',
      'Other',
    ],
    isDefault: true,
    sortOrder: 2,
  },
  {
    id: 'utilities',
    name: 'Utilities',
    icon: 'zap',
    color: '#EAB308',
    subcategories: ['Electricity', 'Gas', 'Water', 'Internet', 'Phone', 'Other'],
    isDefault: true,
    sortOrder: 3,
  },
  {
    id: 'health',
    name: 'Health',
    icon: 'heart',
    color: '#EF4444',
    subcategories: ['Gym', 'Insurance', 'Medical', 'Dental', 'Pharmaceutical', 'Vitamins', 'Other'],
    isDefault: true,
    sortOrder: 4,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'film',
    color: '#EC4899',
    subcategories: ['Streaming', 'Hobbies', 'Events', 'Games', 'Other'],
    isDefault: true,
    sortOrder: 5,
  },
  {
    id: 'personal',
    name: 'Personal',
    icon: 'user',
    color: '#14B8A6',
    subcategories: [
      'Clothing',
      'Haircuts',
      'Gifts',
      'Subscriptions',
      'Skincare',
      'Toiletries',
      'Other',
    ],
    isDefault: true,
    sortOrder: 6,
  },
  {
    id: 'education',
    name: 'Education',
    icon: 'book',
    color: '#6366F1',
    subcategories: ['Courses', 'Books', 'Audible', 'Seminars', 'Other'],
    isDefault: true,
    sortOrder: 7,
  },
  {
    id: 'savings',
    name: 'Savings & Investments',
    icon: 'piggy-bank',
    color: '#10B981',
    subcategories: ['Contributions', 'Transfers to Savings', 'Crypto Purchase', 'Shares Purchase'],
    isDefault: true,
    sortOrder: 8,
  },
  {
    id: 'debt',
    name: 'Debt Repayments',
    icon: 'credit-card',
    color: '#DC2626',
    subcategories: ['Credit Card', 'Personal Loan', 'HECS/HELP', 'Other'],
    isDefault: true,
    sortOrder: 9,
  },
  {
    id: 'children',
    name: 'Children',
    icon: 'baby',
    color: '#F472B6',
    subcategories: ['Childcare', 'School', 'Activities', 'Allowances', 'Bonus', 'Larger Gifts'],
    isDefault: true,
    sortOrder: 10,
  },
  {
    id: 'pets',
    name: 'Pets',
    icon: 'paw',
    color: '#A78BFA',
    subcategories: ['Food', 'Vet', 'Insurance', 'Purchase'],
    isDefault: true,
    sortOrder: 11,
  },
  {
    id: 'travel',
    name: 'Travel & Holidays',
    icon: 'plane',
    color: '#0EA5E9',
    subcategories: [
      'Accommodation',
      'Flights',
      'Tours',
      'Car Rental',
      'Activities',
      'Travel Insurance',
      'Other',
    ],
    isDefault: true,
    sortOrder: 12,
  },
  {
    id: 'donations',
    name: 'Donations & Charity',
    icon: 'heart-handshake',
    color: '#D946EF',
    subcategories: ['Charitable Donations', 'Sponsorships', 'Religious', 'Other'],
    isDefault: true,
    sortOrder: 13,
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'more-horizontal',
    color: '#94A3B8',
    subcategories: [],
    isDefault: true,
    sortOrder: 14,
  },
];

const DEFAULT_SETTINGS = {
  currency: 'AUD',
  currencySymbol: '$',
  defaultPeriod: 'monthly',
  theme: 'system',
  lastVersionCheck: null,
  financialYearStartMonth: 7,
};

const fileLocks = new Map();

function withLock(filename, fn) {
  const prev = fileLocks.get(filename) || Promise.resolve();
  const next = prev.then(fn, fn);
  fileLocks.set(filename, next);
  return next;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJSON(filename) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    if (err instanceof SyntaxError) {
      console.error(`Corrupted JSON in ${filename}, backing up and resetting`);
      const backupPath = filePath + '.corrupt.' + Date.now();
      await fs.rename(filePath, backupPath).catch(() => {});
      return null;
    }
    throw err;
  }
}

export async function writeJSON(filename, data) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = filePath + '.tmp';
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpPath, filePath);
}

export async function getAccounts() {
  return (await readJSON('accounts.json')) || [];
}

export async function saveAccounts(accounts) {
  await writeJSON('accounts.json', accounts);
}

export async function getIncome() {
  return (await readJSON('income.json')) || [];
}

export async function saveIncome(income) {
  await writeJSON('income.json', income);
}

export async function getExpenses() {
  return (await readJSON('expenses.json')) || [];
}

export async function saveExpenses(expenses) {
  await writeJSON('expenses.json', expenses);
}

export async function getCategories() {
  const cats = await readJSON('categories.json');
  if (!cats) {
    await writeJSON('categories.json', DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  return cats;
}

export async function saveCategories(categories) {
  await writeJSON('categories.json', categories);
}

export async function getScenarios() {
  return (await readJSON('scenarios.json')) || [];
}

export async function saveScenarios(scenarios) {
  await writeJSON('scenarios.json', scenarios);
}

export async function getSettings() {
  const settings = await readJSON('settings.json');
  if (!settings) {
    await writeJSON('settings.json', DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function saveSettings(settings) {
  await writeJSON('settings.json', settings);
}

export async function getNetWorthHistory() {
  return (await readJSON('networth-history.json')) || [];
}

export async function saveNetWorthHistory(history) {
  await writeJSON('networth-history.json', history);
}

export { withLock };
