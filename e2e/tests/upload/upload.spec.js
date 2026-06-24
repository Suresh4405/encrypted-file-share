const { test, expect } = require('@playwright/test');

test('user uploads file', async ({ page }) => {

  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'test@gmail.com');
  await page.fill('#password', 'Password123');

  await page.click('button[type="submit"]');

  await page.locator('input[type="file"]').setInputFiles(
    'tests/files/sample.pdf'
  );

  await expect(
    page.getByText(/uploaded successfully/i)
  ).toBeVisible({ timeout: 20000 });

});