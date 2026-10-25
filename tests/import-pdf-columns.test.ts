import { describe, expect, it } from 'vitest';
import { jsPDF } from 'jspdf';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { pdfItemsToText } from '../src/utils/importFile';
import { parseImportedText } from '../src/utils/importText';

type Line = { text: string; x: number; y: number; size?: number };

const extract = async (lines: Line[]) => {
  const doc = new jsPDF();
  lines.forEach(({ text, x, y, size }) => {
    doc.setFontSize(size ?? 10);
    doc.text(text, x, y);
  });
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(doc.output('arraybuffer')) }).promise;
  const content = await (await pdf.getPage(1)).getTextContent();
  return pdfItemsToText(content.items as never);
};

const column = (texts: string[], x: number, top = 15, step = 7): Line[] =>
  texts.flatMap((text, i) => (text ? [{ text, x, y: top + i * step }] : []));

const sidebar = ['CONTACT', 'jane@example.com', '+44 7700 900123', 'London, UK', '', 'SKILLS', 'Figma', 'Accessibility', 'User research'];
const mainColumn = ['EXPERIENCE', 'Senior Product Designer', 'Acme Corp', 'Jan 2021 - Present', '- Led the checkout redesign.', '- Cut drop-off by 18%.', 'Product Designer', 'Beta Ltd', 'Mar 2018 - Dec 2020', '- Built the design system.', '', 'EDUCATION', 'University of Nairobi', 'BSc Computer Science', '2014 - 2018'];

const expectFullCv = (text: string) => {
  const parsed = parseImportedText(text);
  expect(parsed).toMatchObject({ fullName: 'Jane Doe', jobTitle: 'Senior Product Designer', email: 'jane@example.com', phone: '+44 7700 900123', location: 'London, UK' });
  expect(parsed.experience.map((item) => [item.role, item.company, item.achievements.length])).toEqual([
    ['Senior Product Designer', 'Acme Corp', 2],
    ['Product Designer', 'Beta Ltd', 1],
  ]);
  expect(parsed.education[0]).toMatchObject({ institution: 'University of Nairobi', qualification: 'BSc Computer Science' });
  expect(parsed.skills).toEqual(['Figma', 'Accessibility', 'User research']);
  expect(parsed.summary).toBe('');
  expect(parsed.unplaced).toEqual([]);
};

describe('two-column PDF import', () => {
  const nameLines: Line[] = [
    { text: 'Jane Doe', x: 75, y: 15, size: 20 },
    { text: 'Senior Product Designer', x: 75, y: 23, size: 12 },
  ];

  it('reads a left sidebar column by column when the PDF stores text row by row', async () => {
    const side = column(sidebar, 10, 15);
    const main = [...nameLines, ...column(mainColumn, 75, 33)];
    // Interleave by row, as many generators do.
    const rows = [...side, ...main].sort((a, b) => a.y - b.y || a.x - b.x);
    expectFullCv(await extract(rows));
  });

  it('reads a left sidebar when the PDF stores the sidebar first', async () => {
    expectFullCv(await extract([...column(sidebar, 10, 15), ...nameLines, ...column(mainColumn, 75, 33)]));
  });

  it('keeps a full-width header first when the sidebar is on the right', async () => {
    const header: Line[] = [
      { text: 'Jane Doe', x: 10, y: 15, size: 20 },
      { text: 'Senior Product Designer at heart, building calm and accessible products', x: 10, y: 23, size: 12 },
    ];
    const text = await extract([...header, ...column(mainColumn, 10, 35), ...column(sidebar, 145, 35)].sort((a, b) => a.y - b.y || a.x - b.x));
    const lines = text.split('\n').filter(Boolean);
    expect(lines.slice(0, 3)).toEqual(['Jane Doe', 'Senior Product Designer at heart, building calm and accessible products', 'EXPERIENCE']);
    const parsed = parseImportedText(text);
    expect(parsed.experience).toHaveLength(2);
    expect(parsed.email).toBe('jane@example.com');
    expect(parsed.skills).toEqual(['Figma', 'Accessibility', 'User research']);
  });

  it('does not split a one-column CV that right-aligns its dates', async () => {
    const lines: Line[] = [
      { text: 'Jane Doe', x: 10, y: 15, size: 20 },
      { text: 'jane@example.com | +44 7700 900123 | London, UK', x: 10, y: 23 },
      { text: 'EXPERIENCE', x: 10, y: 33 },
    ];
    ['Senior Product Designer, Acme Corp', 'Product Designer, Beta Ltd', 'Designer, Gamma Inc', 'Junior Designer, Delta Co'].forEach((role, i) => {
      const y = 40 + i * 16;
      lines.push({ text: role, x: 10, y }, { text: `${2020 - i * 2} - ${2022 - i * 2}`, x: 170, y }, { text: `- Shipped release ${i + 1}.`, x: 10, y: y + 7 });
    });
    const text = await extract(lines);
    expect(text).toContain('Senior Product Designer, Acme Corp 2020 - 2022');
    expect(parseImportedText(text).experience).toHaveLength(4);
  });
});
