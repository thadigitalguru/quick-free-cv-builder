import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockStorage, installMockWindow } from './helpers';
import { accentSwatches, contrastWithWhite } from '../src/utils/templateConfig';

const KEY = 'quick-free-cv-builder:v3';
const saved = (extra: Record<string, unknown>) => JSON.stringify({ version: 3, templateId: 'banner', document: { personalInfo: { fullName: 'Colour Person' } }, ...extra });

describe('CV accent colour', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('is saved and restored with the draft, along with the Banner template', async () => {
    const { storage } = createMockStorage({ [KEY]: saved({ accentColor: '#0f766e' }) });
    installMockWindow(storage);
    const { useCVStore } = await import('../src/store/cvStore');
    useCVStore.getState().initFromStorage();
    expect(useCVStore.getState()).toMatchObject({ templateId: 'banner', accentColor: '#0f766e' });

    useCVStore.getState().setAccentColor('#b91c1c');
    useCVStore.getState().persist();
    expect(JSON.parse(storage.getItem(KEY)!).accentColor).toBe('#b91c1c');
  });

  it('falls back to the default when the stored value is not a colour', async () => {
    const { storage } = createMockStorage({ [KEY]: saved({ accentColor: 'url(javascript:alert(1))' }) });
    installMockWindow(storage);
    const { loadSavedCV } = await import('../src/utils/storage');
    expect(loadSavedCV()?.accentColor).toBeNull();
  });

  it('offers only swatches readable as text on white and behind white text', () => {
    for (const swatch of accentSwatches) expect(contrastWithWhite(swatch.value), swatch.name).toBeGreaterThanOrEqual(4.5);
  });
});
