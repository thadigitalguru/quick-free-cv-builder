import { describe, expect, it } from 'vitest';
import { normalizeImportedDocument } from '../src/utils/importDocument';
import { getEssentialProgress, getSectionStatus } from '../src/utils/progress';
import { validateDocument } from '../src/utils/validation';

const doc = (raw: Record<string, unknown>) => normalizeImportedDocument(raw)!;

describe('section progress', () => {
  it('points a new CV at personal info first', () => {
    expect(getEssentialProgress(doc({}))).toEqual({ done: 0, total: 4, next: 'personalInfo' });
  });

  it('does not count empty placeholder entries as done', () => {
    const cv = doc({ experience: [{ role: '', company: '' }], education: [{ institution: '' }] });
    expect(getSectionStatus(cv, 'experience')).toBe('empty');
    expect(getSectionStatus(cv, 'education')).toBe('empty');
  });

  it('reports ready once the essentials are filled', () => {
    const cv = doc({
      personalInfo: { fullName: 'Jane', email: 'jane@example.com' },
      experience: [{ role: 'Analyst' }],
      education: [{ qualification: 'BSc' }],
      skills: ['Excel'],
    });
    expect(getEssentialProgress(cv)).toEqual({ done: 4, total: 4, next: null });
  });
});

describe('export checks', () => {
  it('does not require the optional interests section', () => {
    const issues = validateDocument(doc({ personalInfo: { fullName: 'Jane' } }));
    expect(issues.map((issue) => issue.field)).not.toContain('interests');
  });
});
