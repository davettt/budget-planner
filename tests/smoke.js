import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { api, requestWithHost, startTestServer, stopTestServer } from './harness.js';

before(startTestServer);
after(stopTestServer);

async function json(response, status) {
  assert.equal(response.status, status);
  return response.json();
}

test('all production routes work against isolated data', async () => {
  const buildStatus = await api('/api/build-status');
  assert.equal(buildStatus.status, 200);
  assert.match(buildStatus.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(buildStatus.headers.get('x-content-type-options'), 'nosniff');

  assert.equal(await requestWithHost('/api/build-status', 'evil.example'), 403);

  const categories = await json(await api('/api/categories'), 200);
  assert.ok(categories.length > 0);
  const category = await json(
    await api('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test category', color: '#123456' }),
    }),
    201,
  );
  await json(
    await api(`/api/categories/${category.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated category' }),
    }),
    200,
  );

  const account = await json(
    await api('/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test account', type: 'savings', balance: 1000 }),
    }),
    201,
  );
  await json(await api('/api/accounts'), 200);
  await json(
    await api(`/api/accounts/${account.id}`, {
      method: 'PUT',
      body: JSON.stringify({ balance: 1100 }),
    }),
    200,
  );
  await json(await api('/api/networth/snapshot', { method: 'POST' }), 201);
  await json(await api('/api/networth'), 200);

  const income = await json(
    await api('/api/income', {
      method: 'POST',
      body: JSON.stringify({ name: 'Salary', amount: 5000, frequency: 'monthly' }),
    }),
    201,
  );
  await json(await api('/api/income'), 200);
  await json(
    await api(`/api/income/${income.id}`, {
      method: 'PUT',
      body: JSON.stringify({ amount: 5100 }),
    }),
    200,
  );

  const expense = await json(
    await api('/api/expenses', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rent',
        amount: 2000,
        categoryId: categories[0].id,
        frequency: 'monthly',
      }),
    }),
    201,
  );
  await json(await api('/api/expenses'), 200);
  await json(
    await api(`/api/expenses/${expense.id}`, {
      method: 'PUT',
      body: JSON.stringify({ amount: 2100 }),
    }),
    200,
  );

  const scenario = await json(
    await api('/api/scenarios', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test scenario',
        type: 'general',
        loanDetails: null,
        removedExpenseIds: [],
        removedIncomeIds: [],
        additionalExpenses: [],
      }),
    }),
    201,
  );
  await json(await api('/api/scenarios'), 200);
  await json(
    await api(`/api/scenarios/${scenario.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated scenario' }),
    }),
    200,
  );

  const settings = await json(await api('/api/settings'), 200);
  await json(
    await api('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ financialYearStartMonth: 1 }),
    }),
    200,
  );

  const backup = await json(await api('/api/backup'), 200);
  assert.equal(backup.settings.currency, settings.currency);
  await json(await api('/api/restore', { method: 'POST', body: JSON.stringify(backup) }), 200);

  await json(await api(`/api/scenarios/${scenario.id}`, { method: 'DELETE' }), 200);
  await json(await api(`/api/expenses/${expense.id}`, { method: 'DELETE' }), 200);
  await json(await api(`/api/income/${income.id}`, { method: 'DELETE' }), 200);
  await json(await api(`/api/accounts/${account.id}`, { method: 'DELETE' }), 200);
  await json(await api(`/api/categories/${category.id}`, { method: 'DELETE' }), 200);

  const frontend = await api('/');
  assert.equal(frontend.status, 200);
  assert.match(await frontend.text(), /<div id="root"><\/div>/);
});
