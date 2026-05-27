import { describe, expect, it } from 'vitest';
import { normalizeImportedDocument } from '../src/utils/importDocument';

describe('normalizeImportedDocument', () => {
  it('normalizes nested drafts and fills defaults', () => {
    const normalized = normalizeImportedDocument({
      document: {
        personalInfo: {
          fullName: 'Jane Doe',
          profilePhoto: 'data:image/png;base64,abc',
          photoZoom: 1.4,
          photoX: 60,
          photoY: 40,
        },
        experience: [{ id: 'one', role: 'Engineer', company: 'Acme', achievements: ['Built stuff'], technologies: ['React'] }],
        education: [],
        skills: ['TypeScript'],
        projects: [],
        languages: [{ id: 'lang-1', name: 'English', proficiency: 'Fluent' }],
        certifications: [],
        volunteer: [],
        awards: [],
        interests: ['Reading'],
        references: [],
        sectionOrder: ['experience', 'summary', 'bogus', 'personalInfo'],
        sectionVisibility: { experience: true, summary: true, languages: true },
        lastUpdatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    expect(normalized?.personalInfo.fullName).toBe('Jane Doe');
    expect(normalized?.personalInfo.photoZoom).toBe(1.4);
    expect(normalized?.sectionOrder).toEqual(expect.arrayContaining(['personalInfo', 'experience', 'projects']));
    expect(normalized?.sectionOrder).not.toContain('bogus');
    expect(normalized?.sectionVisibility.experience).toBe(true);
    expect(normalized?.sectionVisibility.certifications).toBe(false);
    expect(normalized?.languages[0]?.proficiency).toBe('Fluent');
  });
});
