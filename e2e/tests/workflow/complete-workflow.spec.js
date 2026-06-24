const { test, expect } = require('@playwright/test');

test('complete file sharing workflow', async ({ page }) => {

  // Login
  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'test@gmail.com');
  await page.fill('#password', 'Password123');

  await page.click('button[type="submit"]');

  // Upload
  await page.locator('input[type="file"]').setInputFiles(
    'tests/files/sample.pdf'
  );

  await expect(
    page.getByText(/uploaded successfully/i)
  ).toBeVisible({ timeout: 20000 });

  // Generate Link
  await page.click('text=Generate URL');

  await page.click('text=Generate & Copy Link');

  await expect(
    page.getByText(/link copied/i)
  ).toBeVisible();

});