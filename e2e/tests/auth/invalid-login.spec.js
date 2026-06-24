const { test, expect } = require('@playwright/test');

test('invalid login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'wrong@test.com');
  await page.fill('#password', 'WrongPassword');

  await page.click('button[type="submit"]');

  await expect(
    page.getByText('Invalid email or password')
  ).toBeVisible();
});