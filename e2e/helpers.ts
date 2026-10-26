import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Page, TestInfo } from '@playwright/test';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export const STORAGE_KEY = 'quick-free-cv-builder:v3';
export const fixture = (name: string) => fileURLToPath(new URL(`../tests/fixtures/${name}`, import.meta.url));
export const isPhone = (testInfo: TestInfo) => testInfo.project.name === 'iphone';

export const roles = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `x${i}`, role: `Role ${i + 1}`, company: `Company ${i + 1}`, location: 'Nairobi', startDate: `${2010 + i}`, endDate: `${2011 + i}`, isCurrent: false,
    achievements: Array.from({ length: 5 }, (_, j) => `Achievement ${i + 1}.${j + 1} delivered measurable outcomes across teams and stakeholders in the region`),
    technologies: ['TypeScript'],
  }));

/** Puts a saved draft in place, as if the user had built it earlier. */
export const seedCv = async (page: Page, document: Record<string, unknown>, templateId = 'classic') => {
  await page.goto('/');
  await page.evaluate(([key, payload]) => {
    localStorage.clear();
    localStorage.setItem(key, payload);
  }, [STORAGE_KEY, JSON.stringify({ version: 3, templateId, document })] as const);
};

export const openBuilder = async (page: Page) => {
  await page.goto('/builder');
  await page.locator('#builder-workspace').waitFor();
};

export const showPreview = async (page: Page) => {
  await page.locator('button[aria-controls="builder-workspace"]').nth(1).click();
  await page.getByText(/PDF: \d+ A4 page/).waitFor({ timeout: 15_000 }).catch(() => undefined);
};

export const setPreviewMode = (page: Page, mode: 'Standard' | 'ATS') => page.getByRole('group', { name: 'Preview mode' }).getByRole('button', { name: mode }).click();

export const savedName = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.document?.personalInfo?.fullName ?? null, STORAGE_KEY);

/** Exports the PDF the way a user would; on iPhone that means tapping Save PDF once it's ready. */
export const exportPdf = async (page: Page, testInfo: TestInfo) => {
  const download = page.waitForEvent('download', { timeout: 60_000 });
  await page.locator('button:visible', { hasText: 'Export PDF' }).click();
  if (isPhone(testInfo)) await page.getByRole('button', { name: 'Save PDF' }).click({ timeout: 60_000 });
  const file = testInfo.outputPath(`export-${Date.now()}.pdf`);
  await (await download).saveAs(file);
  return file;
};

export const readPdf = async (file: string) => {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(file)), verbosity: 0 }).promise;
  let text = '';
  let images = 0;
  const links: string[] = [];
  for (let n = 1; n <= pdf.numPages; n += 1) {
    const page = await pdf.getPage(n);
    text += `${(await page.getTextContent()).items.map((item) => ('str' in item ? item.str : '')).join(' ')}\n`;
    images += (await page.getOperatorList()).fnArray.filter((fn) => fn === pdfjs.OPS.paintImageXObject).length;
    for (const annotation of await page.getAnnotations()) if (annotation.subtype === 'Link' && annotation.url) links.push(annotation.url);
  }
  return { pages: pdf.numPages, text: text.replace(/\s+/g, ' '), images, links };
};
