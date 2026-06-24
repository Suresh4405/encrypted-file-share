const { test, expect } = require('@playwright/test');

test('user can register', async ({ page }) => {
  const email = `user${Date.now()}@test.com`;

  await page.goto('http://localhost:5173/register');

  await page.fill('#name', 'Suresh');
  await page.fill('#email', email);
  await page.fill('#password', 'Password123');
  await page.fill('#confirmPassword', 'Password123');

  await page.click('button[type="submit"]');

  await expect(
    page.getByText('Registration successful')
  ).toBeVisible();
});