import { describe, expect, it } from 'vitest';
import { validateDocument, hasBlockingIssues } from '../src/utils/validation';
import type { CVDocument } from '../src/types/cv';

const baseDocument = (): CVDocument => ({
  personalInfo: {
    fullName: 'Jane Doe',
    jobTitle: '',
    email: 'jane@example.com',
    phone: '',
    location: '',
    linkedinUrl: '',
    websiteUrl: '',
    profilePhoto: '',
    photoZoom: 1,
    photoX: 50,
    photoY: 50,
    summary: '',
  },
  experience: [{ id: 'exp-1', role: 'Engineer', company: 'Acme', location: '', startDate: '2020', endDate: '2024', isCurrent: false, achievements: [], technologies: [] }],
  education: [{ id: 'edu-1', institution: 'Uni', qualification: 'BSc', fieldOfStudy: '', startDate: '2016', endDate: '2020', description: '' }],
  skills: ['TypeScript'],
  projects: [],
  languages: [],
  certifications: [],
  volunteer: [],
  awards: [],
  interests: ['Reading'],
  references: [],
  sectionOrder: ['personalInfo', 'summary', 'experience', 'skills', 'projects', 'education', 'languages', 'certifications', 'volunteer', 'awards', 'interests', 'references'],
  sectionVisibility: {
    personalInfo: true,
    summary: true,
    experience: true,
    skills: true,
    projects: true,
    education: true,
    languages: true,
    certifications: false,
    volunteer: false,
    awards: false,
    interests: true,
    references: false,
  },
  lastUpdatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
});

describe('validateDocument', () => {
  it('flags required export fields', () => {
    const issues = validateDocument({
      ...baseDocument(),
      personalInfo: { ...baseDocument().personalInfo, fullName: '' },
      experience: [],
      education: [],
      skills: [],
      interests: [],
    });

    expect(issues.map((issue) => issue.field)).toEqual(expect.arrayContaining(['fullName', 'experience', 'education', 'skills', 'interests']));
    expect(hasBlockingIssues(issues)).toBe(true);
  });

  it('flags malformed URLs and dates', () => {
    const issues = validateDocument({
      ...baseDocument(),
      personalInfo: {
        ...baseDocument().personalInfo,
        linkedinUrl: 'not-a-url',
        websiteUrl: 'bad url',
      },
      experience: [{ id: 'exp-1', role: 'Engineer', company: 'Acme', location: '', startDate: '20xx', endDate: '2024-13', isCurrent: false, achievements: [], technologies: [] }],
      education: [{ id: 'edu-1', institution: 'Uni', qualification: 'BSc', fieldOfStudy: '', startDate: '20x1', endDate: '2024-00', description: '' }],
      projects: [{ id: 'proj-1', name: 'App', role: '', date: '20-24', description: '', link: '', technologies: [] }],
    });

    expect(issues.map((issue) => issue.field)).toEqual(expect.arrayContaining(['linkedinUrl', 'websiteUrl']));
    expect(issues.some((issue) => issue.field.includes('experience:exp-1:startDate'))).toBe(true);
    expect(issues.some((issue) => issue.field.includes('education:edu-1:endDate'))).toBe(true);
    expect(issues.some((issue) => issue.field.includes('projects:proj-1:date'))).toBe(true);
  });
});
