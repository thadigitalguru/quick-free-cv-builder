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

  it('reorders visible sections by target index', async () => {
    const { storage } = createMockStorage();
    installMockWindow(storage);

    const { useCVStore } = await import('../src/store/cvStore');
    const state = useCVStore.getState();

    state.createNewCV();
    state.moveSectionToIndex('skills', 1);

    expect(useCVStore.getState().document.sectionOrder.slice(0, 4)).toEqual(['personalInfo', 'skills', 'projects', 'experience']);
  });
});

describe('section visibility', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('opens a section when it is shown and leaves it when it is hidden', async () => {
    installMockWindow(createMockStorage().storage);
    const { useCVStore } = await import('../src/store/cvStore');
    const store = useCVStore.getState();
    store.initFromStorage();

    store.toggleSectionVisibility('awards');
    expect(useCVStore.getState().activeSection).toBe('awards');
    expect(useCVStore.getState().document.sectionVisibility.awards).toBe(true);

    useCVStore.getState().setActiveSection('languages');
    useCVStore.getState().toggleSectionVisibility('languages');
    const state = useCVStore.getState();
    expect(state.document.sectionVisibility.languages).toBe(false);
    expect(state.activeSection).not.toBe('languages');
    expect(state.document.sectionVisibility[state.activeSection]).toBe(true);
  });
});

describe('profile photo', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('starts a newly uploaded photo centred instead of reusing the old crop', async () => {
    installMockWindow(createMockStorage().storage);
    const { useCVStore } = await import('../src/store/cvStore');
    useCVStore.getState().initFromStorage();
    useCVStore.getState().updateProfilePhoto('data:image/jpeg;base64,first');
    useCVStore.getState().updatePersonalInfo('photoZoom', 2.5);
    useCVStore.getState().updatePersonalInfo('photoX', 10);
    useCVStore.getState().updateProfilePhoto('data:image/jpeg;base64,second');
    const info = useCVStore.getState().document.personalInfo;
    expect([info.profilePhoto, info.photoZoom, info.photoX, info.photoY]).toEqual(['data:image/jpeg;base64,second', 1, 50, 50]);
  });
});

describe('undo for deletes and clears', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  const setup = async () => {
    installMockWindow(createMockStorage().storage);
    const module = await import('../src/store/cvStore');
    const { useCVStore } = module;
    useCVStore.getState().initFromStorage();
    useCVStore.getState().addExperience();
    useCVStore.getState().addExperience();
    const [first, second] = useCVStore.getState().document.experience;
    useCVStore.getState().updateExperience(first.id, { role: 'Data Analyst' });
    useCVStore.getState().updateExperience(second.id, { role: 'Junior Analyst' });
    return { ...module, first, second };
  };

  it('restores a deleted role in its original place', async () => {
    const { useCVStore, isUndoAvailable, first } = await setup();
    useCVStore.getState().deleteExperience(first.id);
    expect(useCVStore.getState().document.experience.map((item) => item.role)).toEqual(['Junior Analyst']);
    expect(isUndoAvailable(useCVStore.getState())).toBe(true);
    expect(useCVStore.getState().undo?.message).toBe('Deleted “Data Analyst” from Experience');
    useCVStore.getState().undoRemoval();
    expect(useCVStore.getState().document.experience.map((item) => item.role)).toEqual(['Data Analyst', 'Junior Analyst']);
    expect(isUndoAvailable(useCVStore.getState())).toBe(false);
  });

  it('restores a cleared section and a removed photo', async () => {
    const { useCVStore } = await setup();
    useCVStore.getState().clearSection('experience');
    expect(useCVStore.getState().document.experience).toHaveLength(0);
    expect(useCVStore.getState().undo?.message).toBe('Cleared Experience');
    useCVStore.getState().undoRemoval();
    expect(useCVStore.getState().document.experience).toHaveLength(2);

    useCVStore.getState().updateProfilePhoto('data:image/jpeg;base64,abc');
    useCVStore.getState().removeProfilePhoto();
    useCVStore.getState().undoRemoval();
    expect(useCVStore.getState().document.personalInfo.profilePhoto).toBe('data:image/jpeg;base64,abc');
  });

  it('never undoes over a newer edit, and offers nothing when nothing was removed', async () => {
    const { useCVStore, isUndoAvailable, first } = await setup();
    useCVStore.getState().deleteExperience(first.id);
    useCVStore.getState().updatePersonalInfo('fullName', 'Typed after delete');
    expect(isUndoAvailable(useCVStore.getState())).toBe(false);
    useCVStore.getState().undoRemoval();
    expect(useCVStore.getState().document.personalInfo.fullName).toBe('Typed after delete');
    expect(useCVStore.getState().document.experience).toHaveLength(1);

    useCVStore.getState().dismissUndo();
    useCVStore.getState().clearSection('awards');
    expect(useCVStore.getState().undo).toBeNull();
  });
});
