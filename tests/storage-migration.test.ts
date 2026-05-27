import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockStorage, installMockWindow } from './helpers';

describe('storage migration and recovery', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('clears corrupt payloads instead of reusing them', async () => {
    const { storage } = createMockStorage({ 'quick-free-cv-builder:v3': '{not-json' });
    installMockWindow(storage);

    const { loadSavedCV } = await import('../src/utils/storage');
    expect(loadSavedCV()).toBeNull();
    expect(storage.getItem('quick-free-cv-builder:v3')).toBeNull();
  });

  it('normalizes older payloads to the current storage shape', async () => {
    const { storage } = createMockStorage();
    installMockWindow(storage);

    storage.setItem(
      'quick-free-cv-builder:v3',
      JSON.stringify({
        version: 1,
        document: {
          personalInfo: { fullName: 'Legacy User' },
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
          sectionOrder: ['personalInfo', 'experience'],
          sectionVisibility: { personalInfo: true },
          lastUpdatedAt: '2026-01-01T00:00:00.000Z',
        },
        activeSection: 'experience',
        activeItemIds: {},
      }),
    );

    const { loadSavedCV, saveCV } = await import('../src/utils/storage');
    const loaded = loadSavedCV();

    expect(loaded?.version).toBe(3);
    expect(loaded?.document.personalInfo.fullName).toBe('Legacy User');
    expect(loaded?.document.sectionVisibility.education).toBe(true);

    if (loaded) saveCV(loaded);
    expect(JSON.parse(storage.getItem('quick-free-cv-builder:v3') ?? '{}').version).toBe(3);
  });
});
