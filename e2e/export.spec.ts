import { expect, test } from '@playwright/test';
import { exportPdf, fixture, openBuilder, readPdf, roles, seedCv, setPreviewMode, showPreview } from './helpers';

const person = {
  fullName: 'Łukasz Żółć-Nguyễn', jobTitle: 'Data Engineer', email: 'lukasz@example.com', phone: '+254 711 222333', location: 'Kraków',
  linkedinUrl: 'linkedin.com/in/lukasz', websiteUrl: 'https://lukasz.dev', summary: 'I build **reliable** platforms.\n- Led migrations',
};

test('the PDF keeps accented names, real links, one copy of skills and no Markdown symbols', async ({ page }, testInfo) => {
  await seedCv(page, { personalInfo: person, experience: roles(2), skills: ['SQL', 'Spark'] });
  await openBuilder(page);
  await showPreview(page);
  const pdf = await readPdf(await exportPdf(page, testInfo));
  expect(pdf.text).toContain('Łukasz Żółć-Nguyễn');
  expect(pdf.text).toContain('Kraków');
  expect(pdf.text).not.toContain('**');
  expect(pdf.text.match(/Spark/g)).toHaveLength(1);
  expect(pdf.links).toEqual(expect.arrayContaining(['mailto:lukasz@example.com', 'tel:+254711222333', 'https://linkedin.com/in/lukasz', 'https://lukasz.dev/']));
});

for (const [label, count, template] of [['one page', 3, 'classic'], ['two pages', 7, 'modern'], ['compact', 10, 'compact']] as const) {
  test(`the page count matches the exported PDF (${label})`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'iphone' && label !== 'two pages', 'one phone case is enough');
    await seedCv(page, { personalInfo: { fullName: 'Page Count', email: 'p@example.com' }, experience: roles(count) }, template);
    await openBuilder(page);
    await showPreview(page);
    const shown = Number((await page.getByText(/PDF: \d+ A4 page/).textContent())!.match(/\d+/)![0]);
    const pdf = await readPdf(await exportPdf(page, testInfo));
    expect(pdf.pages).toBe(shown);
    expect(pdf.text).toContain(`Achievement ${count}.5`);
  });
}

test('the photo is in the Standard PDF and left out of the ATS PDF', async ({ page }, testInfo) => {
  await seedCv(page, { personalInfo: { fullName: 'Photo Person' } });
  await openBuilder(page);
  await page.locator('#profile-photo-upload').setInputFiles(fixture('photo-quadrants.png'));
  await expect(page.getByAltText('Profile photo as it appears on your CV')).toBeVisible();
  await showPreview(page);
  expect((await readPdf(await exportPdf(page, testInfo))).images).toBe(1);
  await setPreviewMode(page, 'ATS');
  expect((await readPdf(await exportPdf(page, testInfo))).images).toBe(0);
});

test('characters the PDF font cannot draw are listed before export', async ({ page }) => {
  await seedCv(page, { personalInfo: { fullName: 'Ana', summary: 'Growth → 2x 🚀' } });
  await openBuilder(page);
  await showPreview(page);
  await expect(page.getByText("These characters can't be shown in the PDF")).toContainText('→ 🚀');
});

test('dates read as words in the PDF, and the PDF re-imports with the same dates', async ({ page }, testInfo) => {
  await seedCv(page, {
    personalInfo: { fullName: 'Round Trip', email: 'round@example.com' },
    experience: [
      { id: 'a', role: 'Senior Data Analyst', company: 'Safaricom', startDate: '2021-03', endDate: '', isCurrent: true, achievements: ['Built churn dashboards'] },
      { id: 'b', role: 'Data Analyst', company: 'Equity Bank', startDate: '2018-01', endDate: '2021-02', isCurrent: false, achievements: ['Modelled loan risk'] },
    ],
  });
  await openBuilder(page);
  await showPreview(page);
  const file = await exportPdf(page, testInfo);
  const pdf = await readPdf(file);
  expect(pdf.text).toContain('Mar 2021 – Present');
  expect(pdf.text).toContain('Jan 2018 – Feb 2021');
  await page.locator('input[type=file][accept*=pdf]').setInputFiles(file);
  await page.getByRole('button', { name: 'Replace current CV' }).click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('quick-free-cv-builder:v3')!).document.experience.map((e: { startDate: string; endDate: string; isCurrent: boolean }) => [e.startDate, e.endDate, e.isCurrent]));
  expect(stored).toEqual([['2021-03', '', true], ['2018-01', '2021-02', false]]);
});
