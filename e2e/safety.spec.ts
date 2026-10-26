import { expect, test } from '@playwright/test';
import { openBuilder, roles, savedName, seedCv, STORAGE_KEY } from './helpers';

const storedRoles = (page: import('@playwright/test').Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).document.experience.map((item: { role: string }) => item.role), STORAGE_KEY);

test('deleting a role can be undone, and undo never overwrites newer edits', async ({ page }) => {
  await seedCv(page, { personalInfo: { fullName: 'Undo Person' }, experience: roles(2) });
  await openBuilder(page);
  await page.locator('aside button:visible, nav[aria-label="CV sections"] button:visible', { hasText: /^Experience/ }).first().click();
  await page.getByRole('button', { name: 'Delete this role' }).first().click();
  await expect.poll(() => storedRoles(page)).toEqual(['Role 2']);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect.poll(() => storedRoles(page)).toEqual(['Role 1', 'Role 2']);
  await page.getByRole('button', { name: 'Delete this role' }).first().click();
  await page.locator('input:visible').first().fill('Edited after delete');
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toHaveCount(0);
});

test('two tabs editing at once ask instead of silently overwriting each other', async ({ context }) => {
  test.skip(test.info().project.name === 'iphone', 'tabs are a desktop concern');
  const first = await context.newPage();
  await seedCv(first, { personalInfo: { fullName: 'Start' } });
  await openBuilder(first);
  const second = await context.newPage();
  await openBuilder(second);
  await Promise.all([first.locator('input[autocomplete="name"]').fill('Typed In First'), second.locator('input[autocomplete="name"]').fill('Typed In Second')]);
  const banner = (page: typeof first) => page.locator('[role=alert]', { hasText: 'changed in another tab' });
  const state = async () => ({
    banners: [await banner(first).count(), await banner(second).count()],
    fields: [await first.locator('input[autocomplete="name"]').inputValue(), await second.locator('input[autocomplete="name"]').inputValue()],
    stored: await first.evaluate(() => { const s = JSON.parse(localStorage.getItem('quick-free-cv-builder:v3')!); return [s.document.personalInfo.fullName, s.rev, s.parentRev]; }),
  });
  // Under heavy parallel load the two autosaves can take a while; if it never resolves, show why.
  await expect
    .poll(async () => (await banner(first).count()) + (await banner(second).count()), { timeout: 15_000, message: `tab state: ${JSON.stringify(await state())}` })
    .toBe(1);
  const flagged = (await banner(first).count()) ? first : second;
  await flagged.getByRole('button', { name: "Keep this tab's version" }).click();
  const kept = await flagged.locator('input[autocomplete="name"]').inputValue();
  await expect.poll(() => savedName(first)).toBe(kept);
  await expect(first.locator('input[autocomplete="name"]')).toHaveValue(kept);
  await expect(second.locator('input[autocomplete="name"]')).toHaveValue(kept);
});

test('a render crash shows a recovery screen with a backup of the saved CV', async ({ page }) => {
  await seedCv(page, { personalInfo: { fullName: 'Crash Person' } });
  await page.route(/assets\/BuilderPage-.*\.js/, (route) => route.fulfill({ contentType: 'text/javascript', body: 'export default function Broken() { throw new Error("boom"); }' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Resume saved draft' }).click();
  await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CV backup' }).click();
  const file = await (await download).path();
  expect((await import('node:fs')).readFileSync(file!, 'utf8')).toContain('Crash Person');
});
