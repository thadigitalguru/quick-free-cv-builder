import { expect, test } from '@playwright/test';
import { openBuilder, readPdf, seedCv } from './helpers';

test('Print / Save as PDF keeps every script, and prints only the CV', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chrome', 'printing to PDF is only scriptable in Chromium');
  await seedCv(page, {
    personalInfo: { fullName: 'Wei Zhang 张伟', email: 'wei@example.com', summary: 'Growth → 2x 🚀' },
    experience: [{ id: 'a', role: '数据工程师', company: 'مرحبا Ltd', startDate: '2021-03', isCurrent: true, achievements: ['Built dashboards ✓'] }],
  });
  // From the editor view, as with Ctrl/Cmd+P: the hidden preview must still be what prints.
  await openBuilder(page);
  const file = testInfo.outputPath('printed.pdf');
  await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
  const pdf = await readPdf(file);
  expect(pdf.text).toContain('张伟');
  // System CJK fonts can map 工 to the identical-looking Kangxi radical ⼯ on extraction; NFKC folds it back.
  expect(pdf.text.normalize('NFKC').replace(/\s/g, '')).toContain('数据工程师');
  for (const symbol of ['→', '🚀', '✓']) expect(pdf.text).toContain(symbol);
  expect(pdf.text).toMatch(/[؀-ۿ]/);
  expect(pdf.text).toContain('Mar 2021 – Present');
  for (const interfaceText of ['Export PDF', 'Live preview', 'Personal Info', 'Job title or professional headline']) expect(pdf.text).not.toContain(interfaceText);
  expect(pdf.pages).toBe(1);
});
