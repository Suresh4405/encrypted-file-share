const { test, expect } = require('@playwright/test');

test('generate share link', async ({ page }) => {

  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'test@gmail.com');
  await page.fill('#password', 'Password123');

  await page.click('button[type="submit"]');

  await page.click('text=Generate URL');

  await page.click('text=Generate & Copy Link');

  await expect(
    page.getByText(/link copied/i)
  ).toBeVisible();

});