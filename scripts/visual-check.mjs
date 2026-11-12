import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const suffix = Date.now();

// A brand new account, then the tester adds their own records through the API.
await page.goto('http://localhost:3000/login?mode=signup', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'artifacts/signup-desktop.png', fullPage: true });
await page.getByLabel('Full name', { exact: true }).fill('Visual Check');
await page.getByLabel('Email address', { exact: true }).fill(`qa.visual.${suffix}@folio.test`);
await page.getByLabel('Password', { exact: true }).fill('Folio-check-2026!');
await page.getByRole('button', { name: 'Create your free account' }).click();
await page.waitForURL('http://localhost:3000/');

await page.getByRole('button', { name: 'Create your first project', exact: true }).waitFor({ timeout: 15000 });
await page.screenshot({ path: 'artifacts/empty-workspace.png', fullPage: true });
console.log('Empty workspace heading:', await page.locator('main h1').innerText());
assert.equal(await page.getByRole('button', { name: 'Create your first project', exact: true }).isVisible(), true);

const api = (path, body) => page.evaluate(async ({ path, body }) => {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return response.json();
}, { path, body });
const seedNames = ['Website redesign', 'Mobile app launch', 'Q3 marketing campaign'];
for (const name of seedNames) {
  const project = await api('/api/projects', { name, description: 'Written by the account owner.', category: 'Design', color: name.includes('Mobile') ? 'mint' : name.includes('Q3') ? 'coral' : 'lilac', status: 'in_progress', dueDate: null });
  await api('/api/tasks', { title: `${name} — next step`, projectId: project.id, priority: 'high', status: 'in_progress', dueDate: null });
  await api('/api/tasks', { title: `${name} — review`, projectId: project.id, priority: 'medium', status: 'done', dueDate: null });
}
await api('/api/members', { name: 'Mia Chen', email: `mia.${suffix}@studio.test`, role: 'Designer' });

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'artifacts/dashboard-desktop.png', fullPage: true });
console.log('Desktop title:', await page.title());
console.log('Cards:', await page.locator('.project-card').count());
assert.equal(await page.locator('.project-card').count(), 3);

await page.getByRole('button', { name: 'New project', exact: true }).click();
assert.equal(await page.getByRole('dialog').count(), 1);
await page.screenshot({ path: 'artifacts/project-dialog.png' });
await page.getByRole('button', { name: 'Cancel', exact: true }).click();

for (const label of ['Projects', 'My tasks', 'Calendar', 'Team']) {
  await page.getByRole('navigation').getByRole('button', { name: new RegExp('^' + label) }).click();
  await page.waitForFunction(() => !document.querySelector('.loading-shell'), null, { timeout: 15000 });
  console.log('Navigation:', label, await page.locator('main h1').innerText());
}
await page.screenshot({ path: 'artifacts/projects-desktop.png', fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
for (const view of ['', '?view=projects', '?view=tasks', '?view=calendar', '?view=team', '?view=settings']) {
  await page.goto('http://localhost:3000/' + view, { waitUntil: 'networkidle' });
  const size = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }));
  assert.equal(size.page <= size.viewport, true, `No horizontal overflow on ${view || 'overview'} at 390px`);
}
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'artifacts/dashboard-mobile.png', fullPage: true });
await page.getByRole('button', { name: 'Open navigation' }).click();
await page.screenshot({ path: 'artifacts/sidebar-mobile.png' });
await page.getByRole('navigation').getByRole('button', { name: /^My tasks/ }).click();
assert.equal(await page.locator('main h1').innerText(), 'My tasks');

console.log('Browser errors:', errors);
assert.equal(errors.length, 0);
await browser.close();
console.log('Visual and navigation smoke tests passed.');
