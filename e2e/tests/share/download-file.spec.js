const { test, expect } = require('@playwright/test');

test('download file', async ({ page }) => {

  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'test@gmail.com');
  await page.fill('#password', 'Password123');

  await page.click('button[type="submit"]');

  const downloadPromise = page.waitForEvent('download');

  await page.click('text=Download');

  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBeTruthy();

});