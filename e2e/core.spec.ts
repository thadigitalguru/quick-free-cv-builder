import { expect, test } from '@playwright/test';
import { fixture, openBuilder, savedName, seedCv } from './helpers';

test('a new CV autosaves and survives a reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Start building' }).click();
  await page.locator('input[autocomplete="name"]').fill('Autosave Person');
  await expect.poll(() => savedName(page)).toBe('Autosave Person');
  await page.reload();
  await expect(page.locator('input[autocomplete="name"]')).toHaveValue('Autosave Person');
});

test('importing a PDF shows a review before anything is saved', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('input[type=file]').setInputFiles(fixture('chrome-printed/A_left_sidebar_name_in_sidebar.pdf'));
  const review = page.locator('section[aria-labelledby="import-review-heading"]');
  await expect(review.getByRole('list', { name: 'Imported sections' })).toContainText('Experience · 3');
  await expect(review).not.toContainText("couldn't be placed");
  expect(await savedName(page)).toBeNull();
  await review.getByRole('button', { name: 'Open in builder' }).click();
  await expect.poll(() => savedName(page)).toBe('Amina Wanjiru');
});

test('a password-protected PDF is explained, not shown as a library error', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a real pdf') });
  await expect(page.getByRole('alert')).toContainText("couldn't be read as a PDF");
});

test('importing inside the builder warns before replacing a CV with content', async ({ page }) => {
  await seedCv(page, { personalInfo: { fullName: 'Existing Person' } });
  await openBuilder(page);
  await page.locator('input[type=file][accept*=pdf]').setInputFiles(fixture('chrome-printed/B_header_band_right_sidebar.pdf'));
  await expect(page.getByText('Opening this import replaces the CV you are editing now.')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel import' }).click();
  expect(await savedName(page)).toBe('Existing Person');
});

test('import details can be copied for a bug report and contain no CV text', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles(fixture('chrome-printed/C_two_pages_sidebar_ends_early.pdf'));
  const review = page.locator('section[aria-labelledby="import-review-heading"]');
  await review.getByText("Import didn't go right? Copy details to report it").click();
  const details = await review.locator('pre').last().textContent();
  expect(details).toContain('"twoColumnPages": 1');
  expect(details).toContain('"pages": 2');
  for (const word of ['Amina', 'Wanjiru', 'amina.wanjiru', 'Safaricom']) expect(details).not.toContain(word);
});
