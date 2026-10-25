import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { pdfItemsToText } from '../src/utils/importFile';
import { parseImportedText } from '../src/utils/importText';

// CVs laid out like common online builders (CSS grid/flex/table sidebars, letter-spaced headings,
// right-aligned dates), printed to PDF by Chrome, as many of those builders do.
const dir = new URL('./fixtures/chrome-printed/', import.meta.url);

const importPdf = async (name: string) => {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(new URL(name, dir))), verbosity: 0 }).promise;
  let text = '';
  for (let page = 1; page <= pdf.numPages; page += 1) {
    text += `${pdfItemsToText((await (await pdf.getPage(page)).getTextContent()).items as never)}\n`;
  }
  return parseImportedText(text);
};

const roles = [
  ['Senior Data Analyst', 'Safaricom PLC', '2021-03', '', true, 3],
  ['Data Analyst', 'Equity Bank', '2018-01', '2021-02', false, 2],
  ['Junior Analyst', 'KCB Group', '2016-06', '2017-12', false, 1],
];

describe.each([
  ['A_left_sidebar_name_in_sidebar.pdf', 3, true],
  ['B_header_band_right_sidebar.pdf', 3, true],
  ['C_two_pages_sidebar_ends_early.pdf', 12, true],
  ['D_single_column_right_dates.pdf', 3, false],
  ['E_table_layout.pdf', 3, true],
])('%s', (file, roleCount, hasSidebar) => {
  it('imports every field into the right section', async () => {
    const parsed = await importPdf(file);
    expect(parsed).toMatchObject({ fullName: 'Amina Wanjiru', jobTitle: 'Senior Data Analyst', email: 'amina.wanjiru@example.com', phone: '+254 712 345678', location: 'Nairobi, Kenya' });
    expect(parsed.experience).toHaveLength(roleCount);
    expect(parsed.experience.slice(0, 3).map((item) => [item.role, item.company, item.startDate, item.endDate, item.isCurrent, item.achievements.length])).toEqual(roles);
    expect(parsed.education[0]).toMatchObject({ qualification: 'BSc Statistics', institution: 'University of Nairobi' });
    expect(parsed.skills).toEqual(['SQL', 'Power BI', 'Python', 'Stakeholder management']);
    if (hasSidebar) {
      expect(parsed.linkedinUrl).toBe('linkedin.com/in/aminaw');
      expect(parsed.summary).toBe('Analyst who turns messy operational data into decisions that managers actually use.');
      expect(parsed.languages.map((item) => `${item.name}/${item.proficiency}`)).toEqual(['English/Fluent', 'Swahili/Native']);
    }
    expect(parsed.unplaced).toEqual([]);
  });
});
