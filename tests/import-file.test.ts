import { describe, expect, it } from 'vitest';
import { buildImportedDocument, ImportError, pdfItemsToText } from '../src/utils/importFile';
import { parseImportedText } from '../src/utils/importText';

const sampleCv = `Jane Doe
Senior Product Designer
jane@example.com | +44 7700 900123 | London, UK
https://linkedin.com/in/janedoe

Summary
Designer focused on accessible products
that improve conversion and trust.

Experience
Senior Product Designer at Acme Corp
Jan 2021 – Present
• Led the redesign of checkout, lifting conversion
by 12%.
• Built the design system.
Product Designer, Beta Labs
2018 - 2020
- Shipped the onboarding flow.

Education
University of Nairobi
BSc Computer Science
2014 – 2018

Skills
Figma, Accessibility, Design Systems

Interests
Hiking, Chess

Languages
English (Native)
Swahili

Publications
Designing for Trust, UX Journal 2022`;

const textFile = (content: string, name = 'cv.txt', type = 'text/plain') => new File([content], name, { type });

describe('parseImportedText', () => {
  it('keeps experience and education entries with the dates the source stated', () => {
    const parsed = parseImportedText(sampleCv);

    expect(parsed.fullName).toBe('Jane Doe');
    expect(parsed.jobTitle).toBe('Senior Product Designer');
    expect(parsed.location).toBe('London, UK');
    expect(parsed.phone).toBe('+44 7700 900123');
    expect(parsed.summary).toBe('Designer focused on accessible products that improve conversion and trust.');

    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience[0]).toMatchObject({ role: 'Senior Product Designer', company: 'Acme Corp', startDate: '2021-01', endDate: '', isCurrent: true });
    expect(parsed.experience[0].achievements).toEqual(['Led the redesign of checkout, lifting conversion by 12%.', 'Built the design system.']);
    expect(parsed.experience[1]).toMatchObject({ role: 'Product Designer', company: 'Beta Labs', startDate: '2018', endDate: '2020', isCurrent: false });

    expect(parsed.education).toHaveLength(1);
    expect(parsed.education[0]).toMatchObject({ institution: 'University of Nairobi', qualification: 'BSc Computer Science', startDate: '2014', endDate: '2018' });
  });

  it('keeps skills and interests separate', () => {
    const parsed = parseImportedText(sampleCv);
    expect(parsed.skills).toEqual(['Figma', 'Accessibility', 'Design Systems']);
    expect(parsed.interests).toEqual(['Hiking', 'Chess']);
  });

  it('reports text it could not place instead of dropping it or guessing', () => {
    const parsed = parseImportedText(sampleCv);
    expect(parsed.languages).toEqual([{ name: 'English', proficiency: 'Native' }]);
    expect(parsed.unplaced).toEqual(expect.arrayContaining(['Language: Swahili', 'Publications', 'Designing for Trust, UX Journal 2022']));
  });

  it('never reads a date range as a phone number', () => {
    const parsed = parseImportedText('Sam Lee\n\nExperience\nEngineer at Foo\n2019 - 2022');
    expect(parsed.phone).toBe('');
  });

  it('keeps undated experience as one entry and says so', () => {
    const parsed = parseImportedText('Sam Lee\n\nExperience\nEngineer at Foo\nBuilt things');
    expect(parsed.experience).toHaveLength(1);
    expect(parsed.experience[0].achievements).toContain('Built things');
    expect(parsed.notes.join(' ')).toMatch(/one entry/);
  });
});

describe('buildImportedDocument', () => {
  it('imports a text CV with a review report and shows optional sections that have content', async () => {
    const result = await buildImportedDocument(textFile(sampleCv));
    expect(result).not.toBeNull();
    const { document, report } = result!;

    expect(document.experience).toHaveLength(2);
    expect(document.education).toHaveLength(1);
    expect(document.interests).toEqual(['Hiking', 'Chess']);
    expect(document.skills).not.toContain('Hiking');
    expect(document.sectionVisibility.interests).toBe(true);
    expect(report.found).toEqual(expect.arrayContaining([{ label: 'Experience', count: 2 }, { label: 'Education', count: 1 }]));
    expect(report.unplaced.length).toBeGreaterThan(0);
  });

  it('round-trips a JSON export without loss', async () => {
    const first = await buildImportedDocument(textFile(sampleCv));
    const exported = JSON.stringify(first!.document);
    const result = await buildImportedDocument(textFile(exported, 'Jane Doe.json', 'application/json'));
    expect(result!.document).toEqual(first!.document);
    expect(result!.report.sourceKind).toBe('json');
    expect(result!.report.unplaced).toEqual([]);
  });

  it('rejects JSON that is not a CV instead of importing an empty one', async () => {
    await expect(buildImportedDocument(textFile('{"foo": 1}', 'data.json', 'application/json'))).rejects.toBeInstanceOf(ImportError);
  });

  it('rejects malformed JSON files', async () => {
    await expect(buildImportedDocument(textFile('{not json', 'cv.json', 'application/json'))).rejects.toThrow(/valid JSON/);
  });
});

describe('pdfItemsToText', () => {
  it('rebuilds lines and word gaps from positioned text items', () => {
    const text = pdfItemsToText([
      { str: 'Experience', transform: [1, 0, 0, 1, 10, 700], width: 60 },
      { str: 'Engineer', transform: [1, 0, 0, 1, 10, 680], width: 50 },
      { str: 'at Foo', transform: [1, 0, 0, 1, 64, 680], width: 30, hasEOL: true },
      { str: '2019 - 2022', transform: [1, 0, 0, 1, 10, 660], width: 60 },
    ]);
    expect(text.split('\n')).toEqual(['Experience', 'Engineer at Foo', '2019 - 2022']);
  });
});
