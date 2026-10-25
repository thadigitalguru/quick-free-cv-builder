import { it, expect } from 'vitest';
import { jsPDF } from 'jspdf';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { pdfItemsToText } from '../src/utils/importFile';
import { parseImportedText } from '../src/utils/importText';

it('extracts a real text PDF text PDF into structured sections', async () => {
  const doc = new jsPDF();
  const lines = ['Jane Doe', 'Senior Product Designer', 'jane@example.com | +44 7700 900123 | London, UK', '', 'Experience', 'Senior Product Designer at Acme Corp', 'Jan 2021 - Present', '- Led the checkout redesign.', 'Education', 'University of Nairobi', 'BSc Computer Science', '2014 - 2018', 'Skills', 'Figma, Accessibility', 'Interests', 'Hiking'];
  lines.forEach((l, i) => doc.text(l, 10, 15 + i * 8));
  const data = new Uint8Array(doc.output('arraybuffer'));
  const pdf = await pdfjs.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  const text = pdfItemsToText(content.items as any);
  const parsed = parseImportedText(text);
  expect(parsed.experience[0]).toMatchObject({ role: 'Senior Product Designer', company: 'Acme Corp', isCurrent: true });
  expect(parsed.education[0].institution).toBe('University of Nairobi');
  expect(parsed.skills).toEqual(['Figma', 'Accessibility']);
  expect(parsed.interests).toEqual(['Hiking']);
});
