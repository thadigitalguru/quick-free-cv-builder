import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockStorage, installMockWindow } from './helpers';

describe('CV store smoke tests', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('hydrates saved drafts from localStorage', async () => {
    const { storage } = createMockStorage();
    installMockWindow(storage);

    const saved = {
      version: 2,
      document: {
        personalInfo: {
          fullName: 'Hydrated User',
          jobTitle: 'Developer',
          email: 'hydrate@example.com',
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
        experience: [{ id: 'exp-1', role: 'Engineer', company: 'Acme', location: '', startDate: '', endDate: '', isCurrent: false, achievements: [], technologies: [] }],
        education: [],
        skills: ['TypeScript'],
        projects: [],
        languages: [],
        certifications: [],
        volunteer: [],
        awards: [],
        interests: ['Reading'],
        references: [],
        sectionOrder: ['personalInfo', 'experience', 'summary', 'skills', 'projects', 'education', 'languages', 'certifications', 'volunteer', 'awards', 'interests', 'references'],
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
        lastUpdatedAt: '2026-01-01T00:00:00.000Z',
      },
      activeSection: 'experience',
      activeItemIds: { experience: 'exp-1', education: null, projects: null, languages: null, simpleSection: null },
      templateId: 'modern',
    };

    storage.setItem('quick-free-cv-builder:v3', JSON.stringify(saved));

    const { useCVStore } = await import('../src/store/cvStore');
    useCVStore.getState().initFromStorage();

    const state = useCVStore.getState();
    expect(state.document.personalInfo.fullName).toBe('Hydrated User');
    expect(state.activeSection).toBe('experience');
    expect(state.activeExperienceId).toBe('exp-1');
    expect(state.templateId).toBe('modern');
  });

  it('persists and clears drafts', async () => {
    const { storage } = createMockStorage();
    installMockWindow(storage);

    const { useCVStore } = await import('../src/store/cvStore');
    const state = useCVStore.getState();

    state.updatePersonalInfo('fullName', 'Persisted User');
    state.addExperience();
    state.persist();

    const savedRaw = storage.getItem('quick-free-cv-builder:v3');
    expect(savedRaw).not.toBeNull();
    expect(savedRaw ?? '').toContain('Persisted User');

    state.createNewCV();
    expect(storage.getItem('quick-free-cv-builder:v3')).toBeNull();
    expect(useCVStore.getState().document.personalInfo.fullName).toBe('');
  });
});
