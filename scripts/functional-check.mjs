import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const suffix = Date.now();
const errors = [];

// --- Account A: the workspace under test ---
const context = await browser.newContext({ baseURL: 'http://localhost:3000', viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('pageerror', e => errors.push(e.message));
const email = `qa.a.${suffix}@folio.test`, password = 'Folio-check-2026!';
const projectName = `QA project ${suffix}`, taskName = `QA task ${suffix}`;
const api = (path, options = {}) => page.evaluate(async ({ path, options }) => {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json' }, body: options.body ? JSON.stringify(options.body) : undefined });
  return { status: response.status, data: await response.json() };
}, { path, options });

// --- Account B: proves data isolation between accounts ---
const otherContext = await browser.newContext({ baseURL: 'http://localhost:3000' });
const otherPage = await otherContext.newPage();
const otherEmail = `qa.b.${suffix}@folio.test`;
const otherApi = (path, options = {}) => otherPage.evaluate(async ({ path, options }) => {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json' }, body: options.body ? JSON.stringify(options.body) : undefined });
  return { status: response.status, data: await response.json() };
}, { path, options });

const navigate = label => page.getByRole('navigation').getByRole('button', { name: new RegExp('^' + label) }).click();

// 1. A new account starts completely empty — no sample data.
await page.goto('/login?mode=signup');
await page.getByLabel('Full name', { exact: true }).fill('Taylor Parker');
await page.getByLabel('Email address', { exact: true }).fill(email);
await page.getByLabel('Password', { exact: true }).fill(password);
await page.getByRole('button', { name: 'Create your free account' }).click();
await page.waitForURL('http://localhost:3000/');
let workspace = (await api('/api/workspace')).data;
assert.equal(workspace.user.name, 'Taylor Parker');
assert.equal(workspace.projects.length, 0, 'No sample projects');
assert.equal(workspace.tasks.length, 0, 'No sample tasks');
assert.equal(workspace.activities.length, 0, 'No sample activity');
assert.equal(workspace.members.length, 1, 'Only the account owner exists');
assert.equal(workspace.members[0].role, 'Owner');
await expect(page.getByRole('heading', { name: /A fresh start for your next big idea/ })).toBeVisible();
console.log('PASS: new account starts empty with only its owner');

// 2. Create your own project.
await page.getByRole('button', { name: 'Create your first project', exact: true }).click();
await page.getByLabel('Project name', { exact: true }).fill(projectName);
await page.getByLabel('Description', { exact: true }).fill('A project created through the UI, not seeded.');
await page.getByLabel('Category', { exact: true }).selectOption('Engineering');
await page.getByRole('button', { name: 'Use blue color' }).click();
await page.getByRole('button', { name: 'Create project', exact: true }).click();
await expect(page.getByRole('dialog')).toHaveCount(0);
await page.getByRole('button', { name: `Open ${projectName}`, exact: true }).click();
await page.getByRole('button', { name: 'Add task', exact: true }).click();
await page.getByLabel('Task title', { exact: true }).fill(taskName);
await page.getByLabel('Description', { exact: true }).fill('Verifies create, update, completion, persistence and delete.');
await page.getByLabel('Priority', { exact: true }).selectOption('high');
await page.getByLabel('Status', { exact: true }).selectOption('in_progress');
await page.getByRole('button', { name: 'Create task', exact: true }).click();
await expect(page.getByRole('dialog')).toHaveCount(0);
workspace = (await api('/api/workspace')).data;
const project = workspace.projects.find(p => p.name === projectName);
const task = workspace.tasks.find(t => t.title === taskName);
assert.ok(project && task, 'Created records are persisted');
assert.equal(task.projectId, project.id);
console.log('PASS: creating your own project and task through the UI');

// 3. Another account cannot see or touch these records.
await otherPage.goto('/login?mode=signup');
await otherPage.getByLabel('Full name', { exact: true }).fill('Other Person');
await otherPage.getByLabel('Email address', { exact: true }).fill(otherEmail);
await otherPage.getByLabel('Password', { exact: true }).fill(password);
await otherPage.getByRole('button', { name: 'Create your free account' }).click();
await otherPage.waitForURL('http://localhost:3000/');
assert.equal((await otherApi('/api/workspace')).data.projects.length, 0, 'Second account sees none of the first account data');
assert.equal((await otherApi(`/api/projects/${project.id}`, { method: 'PATCH', body: { name: 'Hijacked' } })).status, 404);
assert.equal((await otherApi(`/api/tasks/${task.id}`, { method: 'DELETE' })).status, 404);
assert.equal((await otherApi('/api/tasks', { method: 'POST', body: { title: 'Cross link', projectId: project.id } })).status, 400);
console.log('PASS: accounts are fully isolated from each other');

// 4. Optimistic completion, persistence across reload, editing.
await navigate('My tasks');
await page.getByRole('button', { name: `Complete ${taskName}`, exact: true }).click();
await expect(page.getByRole('button', { name: `Reopen ${taskName}`, exact: true })).toBeVisible();
await expect.poll(async () => (await api('/api/workspace')).data.tasks.find(t => t.id === task.id).status).toBe('done');
await page.reload();
await expect(page.getByRole('button', { name: `Reopen ${taskName}`, exact: true })).toBeVisible();
await page.getByRole('button', { name: taskName, exact: true }).click();
await page.getByLabel('Task title', { exact: true }).fill(taskName + ' updated');
await page.getByLabel('Status', { exact: true }).selectOption('todo');
await page.getByRole('button', { name: 'Save changes', exact: true }).click();
await expect(page.getByRole('dialog')).toHaveCount(0);
await expect(page.getByRole('button', { name: taskName + ' updated', exact: true })).toBeVisible();
console.log('PASS: optimistic completion, reload persistence and editing');

// 5. A failed save rolls the optimistic change back.
await page.route('**/api/tasks/*', async route => {
  if (route.request().method() === 'PATCH') {
    await new Promise(r => setTimeout(r, 400));
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Test failure: your change has been safely rolled back.' }) });
  } else await route.continue();
});
await page.getByRole('button', { name: `Complete ${taskName} updated`, exact: true }).click();
await expect(page.getByRole('button', { name: `Reopen ${taskName} updated`, exact: true })).toBeVisible();
await expect(page.getByRole('button', { name: `Complete ${taskName} updated`, exact: true })).toBeVisible();
await expect(page.getByRole('status')).toContainText('safely rolled back');
await page.unroute('**/api/tasks/*');
console.log('PASS: failed saves roll back with a clear message');

// 6. Task deletion and project update / deletion.
await page.getByRole('button', { name: `Actions for ${taskName} updated`, exact: true }).click();
await page.getByRole('button', { name: 'Delete', exact: true }).click();
await page.getByRole('button', { name: 'Delete task', exact: true }).click();
await expect(page.getByRole('button', { name: taskName + ' updated', exact: true })).toHaveCount(0);
await navigate('Projects');
await page.getByRole('button', { name: `Actions for ${projectName}`, exact: true }).click();
await page.getByRole('button', { name: 'Edit details', exact: true }).click();
await page.getByLabel('Project name', { exact: true }).fill(projectName + ' updated');
await page.getByLabel('Status', { exact: true }).selectOption('completed');
await page.getByRole('button', { name: 'Save changes', exact: true }).click();
await expect(page.getByRole('dialog')).toHaveCount(0);
await page.getByRole('button', { name: `Actions for ${projectName} updated`, exact: true }).click();
await page.getByRole('button', { name: 'Delete', exact: true }).click();
await page.getByRole('button', { name: 'Delete project', exact: true }).click();
await expect(page.getByRole('button', { name: `Open ${projectName} updated`, exact: true })).toHaveCount(0);
console.log('PASS: task delete and project edit/complete/delete');

// 7. Teammate directory CRUD.
await navigate('Team');
await page.getByRole('button', { name: 'Add teammate', exact: true }).click();
await page.getByLabel('Full name', { exact: true }).fill('Jordan Rivers');
await page.getByLabel('Email address', { exact: true }).fill(`jordan.${suffix}@studio.test`);
await page.getByLabel('Role', { exact: true }).selectOption('Designer');
await page.getByRole('dialog').getByRole('button', { name: 'Add teammate', exact: true }).click();
await expect(page.getByRole('dialog')).toHaveCount(0);
await page.getByRole('button', { name: 'Actions for Jordan Rivers', exact: true }).click();
await page.getByRole('button', { name: 'Edit details', exact: true }).click();
await page.getByLabel('Role', { exact: true }).selectOption('Admin');
await page.getByRole('button', { name: 'Save changes', exact: true }).click();
await expect(page.getByRole('dialog')).toHaveCount(0);
await expect(page.getByRole('row').filter({ hasText: 'Jordan Rivers' })).toContainText('Admin');
await page.getByRole('button', { name: 'Actions for Jordan Rivers', exact: true }).click();
await page.getByRole('button', { name: 'Delete', exact: true }).click();
await page.getByRole('button', { name: 'Delete teammate', exact: true }).click();
await expect(page.getByRole('row').filter({ hasText: 'Jordan Rivers' })).toHaveCount(0);
console.log('PASS: teammate create, edit and delete');

// 8. Search over your own data, calendar entry, board view.
const searchName = `QA searchable ${suffix}`;
await api('/api/tasks', { method: 'POST', body: { title: searchName, priority: 'low', status: 'todo', dueDate: null } });
await page.reload();
await page.getByRole('navigation').getByRole('button', { name: /^Team/ }).waitFor({ timeout: 15000 });
await page.keyboard.press('Control+k');
await page.getByLabel('Search workspace').fill('QA searchable');
await expect(page.locator('.search-result').filter({ hasText: searchName })).toBeVisible();
await page.keyboard.press('Escape');
await navigate('Calendar');
await page.locator('.calendar-day.today .calendar-day-number').click();
assert.ok(await page.getByLabel('Due date', { exact: true }).inputValue());
await page.getByRole('button', { name: 'Cancel', exact: true }).click();
await navigate('My tasks');
await page.getByRole('button', { name: 'Task board view' }).click();
await expect(page.locator('.kanban-column')).toHaveCount(3);
console.log('PASS: search, calendar entry and board view');

// 9. Profile persistence, sign out, wrong and correct password.
await page.getByRole('button', { name: 'Settings', exact: true }).click();
await page.waitForFunction(() => !document.querySelector('.loading-shell'), null, { timeout: 15000 });
await page.getByLabel('Full name', { exact: true }).fill('Taylor Parker Updated');
await page.getByRole('button', { name: 'Save changes', exact: true }).click();
await expect.poll(async () => (await api('/api/workspace')).data.user.name).toBe('Taylor Parker Updated');
await page.locator('.sidebar-profile').click();
await page.getByRole('button', { name: 'Sign out', exact: true }).click();
await page.waitForURL('**/login');
assert.equal((await api('/api/workspace')).status, 401, 'Signed-out requests are rejected');
await page.getByLabel('Email address', { exact: true }).fill(email);
await page.getByLabel('Password', { exact: true }).fill('Wrong-password-123');
await page.getByRole('button', { name: 'Sign in to your workspace' }).click();
await expect(page.locator('.auth-error')).toContainText('don’t match');
await page.getByLabel('Password', { exact: true }).fill(password);
await page.getByRole('button', { name: 'Sign in to your workspace' }).click();
await page.waitForURL('http://localhost:3000/');
assert.equal((await api('/api/workspace')).data.user.name, 'Taylor Parker Updated');
console.log('PASS: profile persistence, sign out, invalid and valid login');

assert.equal(errors.length, 0, `No browser errors: ${errors.join(', ')}`);
await browser.close();
console.log('ALL FUNCTIONAL CHECKS PASSED');
