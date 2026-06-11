import { test, expect } from '@playwright/test';

test('renders the sample homepage and template vars', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Template App' })).toBeVisible();
    await expect(page.locator('#template-vars')).toHaveCount(0);
    await expect(page.locator('#item-form')).toBeVisible();
});

test('creates a sample item through the browser flow', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Name').fill('Browser item');
    await page.getByLabel('Description').fill('Created by Playwright');
    await page.getByRole('button', { name: 'Save item' }).click();

    await expect(page.locator('.item-row').filter({ hasText: 'Browser item' })).toBeVisible();
});
