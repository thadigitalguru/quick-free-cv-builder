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
