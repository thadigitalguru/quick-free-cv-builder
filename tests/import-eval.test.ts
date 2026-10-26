import { describe, expect, it } from 'vitest';
import { parseImportedText } from '../src/utils/importText';

/**
 * Field-level evaluation of the text importer: one CV written the ways real CVs differ (headings,
 * date formats, layouts, contact styles). Each case must recover every field; a failure lists the
 * fields that broke. Add a case here whenever a real CV imports badly.
 */
const truth = {
  name: 'Amina Wanjiru',
  email: 'amina@example.com',
  roles: [
    { role: 'Senior Data Analyst', company: 'Safaricom', start: '2021', current: true },
    { role: 'Data Analyst', company: 'Equity Bank', start: '2018', current: false },
  ],
  achievements: 4,
  school: 'University of Nairobi',
  skills: ['SQL', 'Power BI', 'Python'],
};

type Format = (role: string, company: string, dates: string) => string;
const stacked: Format = (r, c, d) => `${r}\n${c}\n${d}`;
const jobs = (format: Format, current = 'Mar 2021 – Present', past = 'Jan 2018 – Feb 2021', bullet = '•') =>
  [format('Senior Data Analyst', 'Safaricom', current), `${bullet} Built churn dashboards`, `${bullet} Cut reporting time by 60%`, format('Data Analyst', 'Equity Bank', past), `${bullet} Modelled loan risk`, `${bullet} Presented to execs`]
    .map((line) => line.replace(/^ /, ''))
    .join('\n');

type Parts = { head: string; contact: string; expHead: string; exp: string; edu: string; skillHead: string; skills: string };
const cv = (overrides: Partial<Parts> = {}) => {
  const p: Parts = { head: 'Amina Wanjiru\nSenior Data Analyst', contact: 'amina@example.com | +254 712 345678 | Nairobi, Kenya', expHead: 'Experience', exp: jobs(stacked), edu: 'BSc Statistics\nUniversity of Nairobi\n2012 – 2016', skillHead: 'Skills', skills: 'SQL, Power BI, Python', ...overrides };
  return [p.head, p.contact, '', p.expHead, p.exp, '', 'Education', p.edu, '', p.skillHead, p.skills].join('\n');
};

const cases: [string, string][] = [
  ['baseline', cv()],
  ['heading: Work History', cv({ expHead: 'Work History' })],
  ['heading: PROFESSIONAL EXPERIENCE', cv({ expHead: 'PROFESSIONAL EXPERIENCE' })],
  ['heading: Employment', cv({ expHead: 'Employment' })],
  ['heading: Career', cv({ expHead: 'Career' })],
  ['heading: Internships', cv({ expHead: 'Internships' })],
  ['dates 03/2021 – Present', cv({ exp: jobs(stacked, '03/2021 – Present', '01/2018 – 02/2021') })],
  ['dates Mar. 2021 – Current', cv({ exp: jobs(stacked, 'Mar. 2021 – Current', 'Jan. 2018 – Feb. 2021') })],
  ['dates March 2021 - to date', cv({ exp: jobs(stacked, 'March 2021 - to date', 'January 2018 - February 2021') })],
  ['dates 2021 to date', cv({ exp: jobs(stacked, '2021 to date', '2018 – 2021') })],
  ['dates 2021 – Now, years only', cv({ exp: jobs(stacked, '2021 – Now', '2018 – 2021') })],
  ['dates Since March 2021', cv({ exp: jobs(stacked, 'Since March 2021') })],
  ['role at company', cv({ exp: jobs((r, c, d) => `${r} at ${c}\n${d}`) })],
  ['company above role', cv({ exp: jobs((r, c, d) => `${c}\n${r}\n${d}`) })],
  ['role | company | dates', cv({ exp: jobs((r, c, d) => `${r} | ${c} | ${d}`) })],
  ['role, company (dates)', cv({ exp: jobs((r, c, d) => `${r}, ${c} (${d})`) })],
  ['dash bullets', cv({ exp: jobs(stacked, undefined, undefined, '-') })],
  ['no bullet markers', cv({ exp: jobs(stacked, undefined, undefined, '') })],
  ['name in capitals', cv({ head: 'AMINA WANJIRU\nSenior Data Analyst' })],
  ['CURRICULUM VITAE above the name', cv({ head: 'CURRICULUM VITAE\nAmina Wanjiru\nSenior Data Analyst' })],
  ['labelled contacts', cv({ contact: 'Email: amina@example.com\nPhone: +254 712 345678\nLocation: Nairobi, Kenya' })],
  ['local phone format', cv({ contact: 'amina@example.com · 0712 345 678 · Nairobi' })],
  ['skills as bullets', cv({ skills: '• SQL\n• Power BI\n• Python' })],
  ['skills heading: Technical Skills', cv({ skillHead: 'Technical Skills' })],
  ['skills heading: Areas of Expertise', cv({ skillHead: 'Areas of Expertise' })],
  ['skills grouped by category', cv({ skills: 'Tools: SQL, Power BI\nLanguages: Python' })],
  ['education on one line', cv({ edu: 'BSc Statistics, University of Nairobi, 2012 – 2016' })],
  ['Windows line endings and tabs', cv().replace(/\n/g, '\r\n').replace(/ \| /g, '\t')],
];

const score = (text: string) => {
  const p = parseImportedText(text);
  const exp = p.experience;
  const checks: Record<string, boolean> = {
    // Case is kept as written: "AMINA WANJIRU" stays in capitals (title-casing would mangle "McDonald").
    name: p.fullName.toLowerCase() === truth.name.toLowerCase(),
    email: p.email === truth.email,
    phone: p.phone.replace(/\D/g, '').endsWith('712345678'),
    roleCount: exp.length === 2,
    titles: exp.length === 2 && exp.every((e, i) => e.role === truth.roles[i].role),
    companies: exp.length === 2 && exp.every((e, i) => e.company === truth.roles[i].company),
    dates: exp.length === 2 && exp.every((e, i) => e.startDate.startsWith(truth.roles[i].start) && e.isCurrent === truth.roles[i].current),
    achievements: exp.reduce((sum, e) => sum + e.achievements.length, 0) === truth.achievements,
    school: p.education[0]?.institution === truth.school,
    skills: JSON.stringify(p.skills) === JSON.stringify(truth.skills),
    nothingUnplaced: p.unplaced.length === 0,
  };
  return Object.entries(checks).filter(([, ok]) => !ok).map(([field]) => field);
};

describe('importer evaluation', () => {
  it.each(cases)('%s', (_label, text) => {
    expect(score(text)).toEqual([]);
  });
});

describe('import never hides content', () => {
  it('keeps dated text under an unknown heading out of the summary and says why', () => {
    const p = parseImportedText('Amina Wanjiru\namina@example.com\n\nWhere I have worked\nSafaricom\nMar 2021 – Present\n• Built dashboards');
    expect(p.summary).toBe('');
    expect(p.unplaced.join('\n')).toContain('Safaricom');
    expect(p.notes.join(' ')).toMatch(/looks like job history/);
  });

  it('still uses undated text before the first heading as the summary', () => {
    const p = parseImportedText('Amina Wanjiru\nData Analyst\namina@example.com\nAnalyst who turns messy data into decisions.\n\nExperience\nData Analyst\nSafaricom\n2021 – 2023');
    expect(p.summary).toBe('Analyst who turns messy data into decisions.');
  });

  it('does not turn "since" inside a sentence into a date range', () => {
    const p = parseImportedText('Amina Wanjiru\n\nSummary\nI have worked in data since 2015 across two banks.');
    expect(p.summary).toBe('I have worked in data since 2015 across two banks.');
  });
});
