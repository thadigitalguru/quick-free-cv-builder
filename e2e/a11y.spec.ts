import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { openBuilder, roles, seedCv, showPreview } from './helpers';

// Reduced motion also keeps axe from sampling colours halfway through a transition.
test.use({ reducedMotion: 'reduce' });

test('home, editor and preview have no accessibility violations', async ({ page }) => {
  const check = async (where: string) => {
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${where}: ${v.id} (${v.nodes.length})`)).toEqual([]);
  };
  await seedCv(page, { personalInfo: { fullName: 'Access Person', email: 'a@example.com' }, experience: roles(2), skills: ['SQL'] }, 'modern');
  await page.goto('/');
  await page.getByRole('heading', { level: 1, name: 'Quick Free CV Builder' }).waitFor();
  await check('home');
  await openBuilder(page);
  await check('personal info editor');
  await page.locator('aside button:visible, nav[aria-label="CV sections"] button:visible', { hasText: /^Experience/ }).first().click();
  await check('experience editor');
  await showPreview(page);
  await page.getByRole('button', { name: /Advanced options/ }).click();
  await check('preview with advanced options');
});
