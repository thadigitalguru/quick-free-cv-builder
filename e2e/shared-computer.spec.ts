import { expect, test } from '@playwright/test';
import { seedCv, STORAGE_KEY } from './helpers';

test('on a shared computer the CV stays in the tab and is gone for the next person', async ({ context, page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByLabel(/Using a shared or public computer/).check();
  await page.getByRole('button', { name: 'Start building' }).click();
  await page.locator('input[autocomplete="name"]').fill('Cafe User');
  await expect(page.getByText('Saved in this tab only')).toBeVisible();
  const stored = await page.evaluate((key) => ({ local: localStorage.getItem(key), session: sessionStorage.getItem(key) }), STORAGE_KEY);
  expect(stored.local).toBeNull();
  expect(stored.session).toContain('Cafe User');

  // Closing the tab asks first, because the CV goes with it.
  const dialog = page.waitForEvent('dialog');
  await page.close({ runBeforeUnload: true });
  const unload = await dialog;
  expect(unload.type()).toBe('beforeunload');
  await unload.accept();

  const next = await context.newPage();
  await next.goto('/');
  await expect(next.getByRole('button', { name: 'Start building' })).toBeVisible();
  await expect(next.getByRole('button', { name: 'Resume saved draft' })).toHaveCount(0);
});

test('"Delete my CV from this browser" removes it everywhere, including the open builder', async ({ page }) => {
  await seedCv(page, { personalInfo: { fullName: 'Leaving Person' } });
  await page.goto('/builder');
  await expect(page.locator('input[autocomplete="name"]')).toHaveValue('Leaving Person');
  await page.getByRole('link', { name: 'Home' }).click();
  await page.getByRole('button', { name: 'Delete my CV from this browser' }).click();
  await page.getByRole('button', { name: 'Delete it' }).click();
  await expect(page.getByRole('button', { name: 'Resume saved draft' })).toHaveCount(0);
  await page.goto('/builder');
  await expect(page.locator('input[autocomplete="name"]')).toHaveValue('');
  expect(await page.evaluate((key) => localStorage.getItem(key)?.includes('Leaving Person') ?? false, STORAGE_KEY)).toBe(false);
});
