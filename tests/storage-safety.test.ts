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

describe('draft recovery', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('opens a draft that only lacks the editor position instead of setting it aside', async () => {
    const { storage } = createMockStorage();
    storage.setItem('quick-free-cv-builder:v3', JSON.stringify({ version: 3, document: { personalInfo: { fullName: 'Kept Name' }, skills: 'SQL, Excel' } }));
    installMockWindow(storage);
    const { loadSavedCV, getUnreadableDraft } = await import('../src/utils/storage');
    const saved = loadSavedCV();
    expect(saved?.document.personalInfo.fullName).toBe('Kept Name');
    expect(saved?.activeSection).toBe('personalInfo');
    expect(getUnreadableDraft()).toBeNull();
  });

  it('sets a garbled draft aside where it can still be read and discarded', async () => {
    const { storage } = createMockStorage();
    storage.setItem('quick-free-cv-builder:v3', '{"document": {"personalInfo": {"fullName": "Half');
    installMockWindow(storage);
    const { loadSavedCV, getUnreadableDraft, discardUnreadableDraft } = await import('../src/utils/storage');
    expect(loadSavedCV()).toBeNull();
    expect(getUnreadableDraft()).toContain('"fullName": "Half');
    discardUnreadableDraft();
    expect(getUnreadableDraft()).toBeNull();
  });
});

describe('shared or public computer mode', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('moves the CV off lasting storage into this tab, saves there, and moves it back when turned off', async () => {
    const local = createMockStorage();
    const session = createMockStorage();
    local.storage.setItem('quick-free-cv-builder:v3', JSON.stringify({ version: 3, document: { personalInfo: { fullName: 'Cafe User' } } }));
    installMockWindow(local.storage, session.storage);
    const storage = await import('../src/utils/storage');
    expect(storage.setPublicComputerMode(true)).toBe(true);
    expect(storage.isPublicComputerMode()).toBe(true);
    expect(local.data.has('quick-free-cv-builder:v3')).toBe(false);
    expect(storage.loadSavedCV()?.document.personalInfo.fullName).toBe('Cafe User');

    const { useCVStore } = await import('../src/store/cvStore');
    useCVStore.getState().initFromStorage();
    useCVStore.getState().updatePersonalInfo('fullName', 'Edited At Cafe');
    useCVStore.getState().persist();
    expect(local.data.size).toBe(0);
    expect(JSON.parse(session.data.get('quick-free-cv-builder:v3')!).document.personalInfo.fullName).toBe('Edited At Cafe');

    storage.setPublicComputerMode(false);
    expect(JSON.parse(local.data.get('quick-free-cv-builder:v3')!).document.personalInfo.fullName).toBe('Edited At Cafe');
    expect(session.data.has('quick-free-cv-builder:v3')).toBe(false);
  });

  it('deletes the CV and any set-aside copy from both kinds of storage', async () => {
    const local = createMockStorage({ 'quick-free-cv-builder:v3': '{}', 'quick-free-cv-builder:v3:unreadable-backup': 'x' });
    const session = createMockStorage({ 'quick-free-cv-builder:v3': '{}' });
    installMockWindow(local.storage, session.storage);
    const { deleteCvFromBrowser } = await import('../src/utils/storage');
    deleteCvFromBrowser();
    expect([...local.data.keys(), ...session.data.keys()]).toEqual([]);
  });
});
