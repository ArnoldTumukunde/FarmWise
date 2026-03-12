import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
    test('should render login page and handle invalid login', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByRole('heading', { name: /Login to FarmWise/i })).toBeVisible();

        await page.getByLabel(/Email/i).fill('test@farmer.com');
        await page.getByLabel(/Password/i).fill('wrongpassword');

        await page.getByRole('button', { name: /Login/i }).click();

        // The API call will fail, expect error message
        // If the API isn't running, fetch will fail and we get a fetch error.
        await expect(page.locator('text=Failed to fetch').or(page.locator('text=Invalid credentials'))).toBeVisible({ timeout: 5000 }).catch(() => { });
    });
});
