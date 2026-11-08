import { test, expect } from '@playwright/test';
test('landing page provides transparent demo labeling',async({page})=>{await page.goto('/');await expect(page.getByRole('heading',{name:/Manage licenses/})).toBeVisible();await expect(page.getByText(/Independent engineering demo/)).toBeVisible();});
test('unauthenticated users cannot access dashboard',async({page})=>{await page.goto('/dashboard');await expect(page).toHaveURL(/\/login/);});
