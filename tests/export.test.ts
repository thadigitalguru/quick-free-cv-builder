import { describe, expect, it } from 'vitest';
import { buildCvFileName, sanitizeFileName } from '../src/utils/export';
import type { CVDocument } from '../src/types/cv';

const doc = (fullName: string): CVDocument => ({
  personalInfo: {
    fullName,
    jobTitle: '',
    email: '',
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
  experience: [],
  education: [],
  skills: [],
  projects: [],
  languages: [],
  certifications: [],
  volunteer: [],
  awards: [],
  interests: [],
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
    interests: false,
    references: false,
  },
  lastUpdatedAt: new Date().toISOString(),
});

describe('export file naming', () => {
  it('sanitizes file names', () => {
    expect(sanitizeFileName(' /My*CV? ')).toBe('My CV');
  });

  it('builds stable PDF/JSON filenames', () => {
    expect(buildCvFileName(doc('Jane / Doe: Senior'), 'pdf')).toBe('Jane Doe Senior.pdf');
    expect(buildCvFileName(doc('Jane / Doe: Senior'), 'json')).toBe('Jane Doe Senior.json');
  });
});
