import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockStorage, installMockWindow } from './helpers';

const quotaError = () => Object.assign(new Error('quota'), { name: 'QuotaExceededError' });

describe('storage safety', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('reports a full storage quota instead of throwing', async () => {
    const { storage } = createMockStorage();
    storage.setItem = () => {
      throw quotaError();
    };
    installMockWindow(storage);

    const { useCVStore } = await import('../src/store/cvStore');
    useCVStore.getState().initFromStorage();
    useCVStore.getState().updatePersonalInfo('fullName', 'Quota User');
    expect(() => useCVStore.getState().persist()).not.toThrow();
    expect(useCVStore.getState().saveStatus).toBe('error');
    expect(useCVStore.getState().saveError).toMatch(/storage is full/i);
    // The in-memory CV is untouched, so the user can still export it.
    expect(useCVStore.getState().document.personalInfo.fullName).toBe('Quota User');
  });

  it('clears the save error after a later successful save', async () => {
    const { storage } = createMockStorage();
    const realSet = storage.setItem;
    let full = true;
    storage.setItem = (key, value) => {
      if (full) throw quotaError();
      realSet(key, value);
    };
    installMockWindow(storage);

    const { useCVStore } = await import('../src/store/cvStore');
    useCVStore.getState().initFromStorage();
    useCVStore.getState().persist();
    full = false;
    useCVStore.getState().persist();
    expect(useCVStore.getState().saveStatus).toBe('saved');
    expect(useCVStore.getState().saveError).toBeNull();
  });

  it('keeps a backup of an unreadable draft rather than deleting it', async () => {
    const { storage } = createMockStorage({ 'quick-free-cv-builder:v3': '{not-json' });
    installMockWindow(storage);

    const { loadSavedCV, CORRUPT_BACKUP_KEY } = await import('../src/utils/storage');
    expect(loadSavedCV()).toBeNull();
    expect(storage.getItem(CORRUPT_BACKUP_KEY)).toBe('{not-json');
  });

  it('does not let the builder overwrite a fresh import with the old saved draft', async () => {
    const { storage } = createMockStorage();
    installMockWindow(storage);

    const { useCVStore } = await import('../src/store/cvStore');
    const { normalizeImportedDocument } = await import('../src/utils/importDocument');
    useCVStore.getState().initFromStorage();
    useCVStore.getState().updatePersonalInfo('fullName', 'Old Draft');
    useCVStore.getState().persist();

    useCVStore.getState().loadImportedDocument(normalizeImportedDocument({ personalInfo: { fullName: 'Imported Person' } })!);
    // BuilderPage calls this on mount after navigating from the landing page.
    useCVStore.getState().initFromStorage();

    expect(useCVStore.getState().document.personalInfo.fullName).toBe('Imported Person');
    expect(JSON.parse(storage.getItem('quick-free-cv-builder:v3')!).document.personalInfo.fullName).toBe('Imported Person');
  });
});
