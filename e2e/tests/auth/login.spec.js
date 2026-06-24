const { test, expect } = require('@playwright/test');

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'test@gmail.com');
  await page.fill('#password', 'Password123');

  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);

  const token = await page.evaluate(() =>
    localStorage.getItem('token')
  );

  expect(token).not.toBeNull();
});