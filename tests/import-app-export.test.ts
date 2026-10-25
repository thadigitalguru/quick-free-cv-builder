import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeExtractedText, parseImportedText } from '../src/utils/importText';

// Text pdf.js extracted from a PDF this app exported (Modern template), spacing artifacts included.
const fixture = fs.readFileSync(new URL('./fixtures/app-export-pdf.txt', import.meta.url), 'utf8');

describe('re-importing a PDF exported by this app', () => {
  const parsed = parseImportedText(fixture);

  it('recovers contact details even though the PDF stores them last', () => {
    expect(parsed).toMatchObject({
      fullName: 'Amina Wanjiru',
      jobTitle: 'Data Analyst',
      email: 'amina@example.com',
      phone: '+254 712 345678',
      location: 'Nairobi, Kenya',
      linkedinUrl: 'https://linkedin.com/in/amina',
      summary: 'Analyst who turns messy data into decisions.',
    });
    expect(parsed.interests).toEqual(['Chess']);
  });

  it('splits experience into roles with dates, location and technologies', () => {
    expect(parsed.experience).toEqual([
      {
        role: 'Data Analyst', company: 'Safaricom', location: 'Nairobi', startDate: '2021-03', endDate: '', isCurrent: true,
        achievements: ['Built churn dashboards used by 40 managers', 'Cut weekly reporting time by 60%'], technologies: ['SQL', 'POWER BI'],
      },
      {
        role: 'Junior Analyst', company: 'KCB Bank', location: 'Nairobi', startDate: '2019-01', endDate: '2021-02', isCurrent: false,
        achievements: ['Automated loan reports in Python'], technologies: [],
      },
    ]);
  });

  it('keeps education, skills and certification details together', () => {
    expect(parsed.education[0]).toMatchObject({ institution: 'University of Nairobi', qualification: 'BSc Statistics', startDate: '2014', endDate: '2018' });
    expect(parsed.skills).toEqual(['SQL', 'Python', 'Power BI', 'Excel']);
    expect(parsed.certifications).toEqual([{ title: 'Google Data Analytics', details: 'Coursera, 2022' }]);
    expect(parsed.unplaced).toEqual([]);
  });
});

describe('normalizeExtractedText', () => {
  it('undoes PDF glyph spacing without merging real ranges', () => {
    expect(normalizeExtractedText('amina@example .com https ://linkedin .com /in/amina 60 % 2021 - 03 — Present 2019 - 2021')).toBe(
      'amina@example.com https://linkedin.com/in/amina 60% 2021-03 — Present 2019 - 2021',
    );
  });
});

// A 7-role, 2-page export where each role has a single technology, printed as "TYPESCRIPT".
const multiRole = fs.readFileSync(new URL('./fixtures/app-export-multi-role.txt', import.meta.url), 'utf8');

describe('re-importing a multi-page export with one technology per role', () => {
  const parsed = parseImportedText(multiRole);

  it('keeps every role, achievement and technology instead of treating "TYPESCRIPT" as a heading', () => {
    expect(parsed.experience).toHaveLength(7);
    parsed.experience.forEach((role, index) => {
      expect(role).toMatchObject({ role: `Role ${index + 1}`, company: `Company ${index + 1}`, location: 'Nairobi', technologies: ['TYPESCRIPT'] });
      expect(role.achievements).toHaveLength(5);
    });
    expect(parsed.education).toHaveLength(1);
    expect(parsed.unplaced).toEqual([]);
  });
});

describe('all-caps lines inside experience', () => {
  it('still treats an unknown all-caps heading after a role body as a new, unplaced section', () => {
    const parsed = parseImportedText(['Jane Doe', 'EXPERIENCE', 'Designer at Acme', '2020 - 2022', '- Shipped the app.', 'SPEAKING', 'Config 2023 keynote'].join('\n'));
    expect(parsed.experience).toHaveLength(1);
    expect(parsed.experience[0].achievements).toEqual(['Shipped the app.']);
    expect(parsed.unplaced).toEqual(['SPEAKING', 'Config 2023 keynote']);
  });
});
