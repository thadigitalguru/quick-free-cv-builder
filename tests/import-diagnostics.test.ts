import { describe, expect, it } from 'vitest';
import { buildImportedDocument } from '../src/utils/importFile';

const cv = `AMINA WANJIRU
Senior Data Analyst
amina.private@example.com\t+254 712 345678\tNairobi, Kenya

Where I Have Worked
Kenya Secret Projects Ltd
Mar 2021 – Present

Experience
Data Analyst, Equity Bank
Since March 2019
• Built churn dashboards for 40 managers

S K I L L S
SQL, Power BI`;

describe('import diagnostics', () => {
  it('describe how the file was read without containing any of its text', async () => {
    const result = await buildImportedDocument(new File([cv], 'amina-cv.txt', { type: 'text/plain' }));
    const json = JSON.stringify(result!.report.diagnostics);
    // Nothing a person typed: not the name, contact details, employers, headings or achievements.
    for (const word of ['Amina', 'AMINA', 'Wanjiru', 'amina.private', '712', 'Nairobi', 'Secret', 'Where I Have', 'Equity', 'churn', 'SQL', 'amina-cv']) {
      expect(json).not.toContain(word);
    }
    const diagnostics = result!.report.diagnostics!;
    expect(diagnostics).toMatchObject({ format: 1, source: 'text', sizeKb: expect.any(Number) });
    // "Where I Have Worked" isn't a known heading; its dated lines are caught by the history rule instead.
    expect(diagnostics.text.headings).toEqual(['experience', 'skills']);
    expect(diagnostics.text.rules).toMatchObject({ capitalisedName: 1, sinceLines: 1, tabSeparated: 1, letterSpacedHeadings: 1, datedTextBeforeHeadings: true });
    expect(diagnostics.text.dateStyles).toEqual({ 'Mon YYYY – present-word': 2 });
    expect(diagnostics.unplacedLines).toBeGreaterThan(0);
  });
});
