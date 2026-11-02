import { describe, expect, it } from 'vitest';
import { parseImportedText } from '../src/utils/importText';

// A one-page marketing CV: pipe-separated role lines, then headings that aren't exact aliases.
const cv = [
  'JANE MWANGI',
  'Growth Marketer',
  'jane@example.com | +254 700 000 000 | Nairobi, Kenya',
  'SUMMARY',
  'Growth marketer focused on SEO, paid acquisition and lifecycle email.',
  'EXPERIENCE',
  'Acme Ltd | Growth Marketing Manager | Mar 2021 – Present',
  '• Grew organic traffic 3x in 18 months.',
  'FREELANCE EXPERIENCE',
  'Upwork | Freelance SEO Writer | Jan 2019 – Jan 2020 – Delivered website, social,',
  'and sales copy for multiple clients.',
  'TOOLS & PLATFORMS',
  'Google Analytics 4 | Google Ads | HubSpot',
  'Mailchimp | TikTok | Perplexity',
  'PROFESSIONAL DEVELOPMENT',
  'Technical SEO – Semrush Academy (2022) | Social Media Strategy – Alison (2020) |',
  'Digital Marketing – Ajira Digital / eMobilis',
  '(2020)',
  'EDUCATION & CERTIFICATIONS',
  'University of Nairobi',
  'BCom Marketing',
  '2014 - 2018',
].join('\n');

describe('section headings without an exact alias', () => {
  const parsed = parseImportedText(cv);

  it('places every line', () => {
    expect(parsed.unplaced).toEqual([]);
  });

  it('reads "FREELANCE EXPERIENCE" as experience, keeping the description with the role', () => {
    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience[1]).toMatchObject({ role: 'Freelance SEO Writer', company: 'Upwork', startDate: '2019-01', endDate: '2020-01' });
    expect(parsed.experience[1].achievements.join(' ')).toBe('Delivered website, social, and sales copy for multiple clients.');
  });

  it('reads "TOOLS & PLATFORMS" as skills', () => {
    expect(parsed.skills).toEqual(['Google Analytics 4', 'Google Ads', 'HubSpot', 'Mailchimp', 'TikTok', 'Perplexity']);
  });

  it('reads "PROFESSIONAL DEVELOPMENT" as certifications, one per course, with wrapped years rejoined', () => {
    expect(parsed.certifications).toEqual([
      { title: 'Technical SEO', details: 'Semrush Academy (2022)' },
      { title: 'Social Media Strategy', details: 'Alison (2020)' },
      { title: 'Digital Marketing', details: 'Ajira Digital / eMobilis (2020)' },
    ]);
  });

  it('sends a combined heading to the section named first', () => {
    expect(parsed.education).toHaveLength(1);
    expect(parsed.education[0].institution).toBe('University of Nairobi');
    expect(parsed.diagnostics.rules.inferredHeadings).toBe(2);
  });

  it('still treats an all-caps line under a role\'s dates as its technologies, and unsupported headings as unplaced', () => {
    const roles = parseImportedText(['Jane Doe', 'EXPERIENCE', 'Designer at Acme', '2020 - 2022', 'SEO TOOLS', '- Shipped the app.', 'PUBLICATIONS', 'A paper'].join('\n'));
    expect(roles.experience[0].technologies).toEqual(['SEO TOOLS']);
    expect(roles.unplaced).toEqual(['PUBLICATIONS', 'A paper']);
  });
});
