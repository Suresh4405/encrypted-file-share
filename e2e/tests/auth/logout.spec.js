const { test, expect } = require('@playwright/test');

test('logout user', async ({ page }) => {

  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'test@gmail.com');
  await page.fill('#password', 'Password123');

  await page.click('button[type="submit"]');

  await page.click('text=Logout');

  await expect(page).toHaveURL(/login/);

});