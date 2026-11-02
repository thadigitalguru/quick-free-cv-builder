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
  await page.getByRole('heading', { level: 1, name: /A polished CV in minutes/ }).waitFor();
  await check('home');
  await openBuilder(page);
  await check('personal info editor');
  await page.locator('aside button:visible, nav[aria-label="CV sections"] button:visible', { hasText: /^Experience/ }).first().click();
  await check('experience editor');
  await showPreview(page);
  // Phones fold the design options into one line.
  const design = page.getByRole('button', { name: /^Design:/ });
  if (await design.isVisible()) await design.click();
  await page.getByRole('button', { name: /Font sizes/ }).click();
  await check('preview with advanced options');
});
