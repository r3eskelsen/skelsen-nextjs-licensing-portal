import { test, expect } from '@playwright/test';
import { createLocalFixtures, hasLocalCredentials } from '../helpers/local-fixtures.mjs';

// Skipped in public-only CI; required for authenticated local security review.
test.describe('synthetic authenticated role-aware UI', () => {
  test.skip(!hasLocalCredentials(), 'Local disposable Supabase credentials required');
  let fixture;
  test.beforeAll(async () => { fixture = await createLocalFixtures(); });
  test.afterAll(async () => { if (fixture) await fixture.cleanup(); });
  async function signIn(page, account) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(fixture.credentials[account].email);
    await page.getByLabel('Password').fill(fixture.credentials[account].password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  }
  test('client sees own role and read-only UI (not admin buttons)', async ({ page }) => {
    await signIn(page, 'aClient');
    await expect(page.getByRole('heading', { name: 'Read-only access' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create license' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'CSV import' })).toHaveCount(0);
    await expect(page.getByText(fixture.A, { exact: true })).toBeVisible();
    await expect(page.getByText(fixture.B, { exact: true })).toHaveCount(0);
  });
  test('admin A can create license only in A', async ({ page }) => {
    await signIn(page, 'aAdmin');
    await expect(page.getByRole('heading', { name: /Create license/ })).toBeVisible();
    await page.locator('select#org').selectOption(fixture.A);
    await page.getByLabel('License name').fill('Synthetic UI License A');
    await page.getByLabel('Expires on').fill('2028-06-15');
    await page.getByRole('button', { name: 'Add license' }).click();
    await expect(page.getByRole('status')).toContainText('License created.');
    await expect(page.getByText('Synthetic UI License A')).toBeVisible();
    await expect(page.locator('select#org option[value="' + fixture.B + '"]')).toHaveCount(0);
  });
  test('owner B has no access to A records', async ({ page }) => {
    await signIn(page, 'bOwner');
    await expect(page.getByRole('heading', { name: /Create license/ })).toBeVisible();
    await expect(page.locator('select#org option[value="' + fixture.A + '"]')).toHaveCount(0);
    await expect(page.getByText(fixture.A, { exact: true })).toHaveCount(0);
  });
});
