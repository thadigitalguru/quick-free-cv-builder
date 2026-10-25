import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_UPDATED_MESSAGE, describeError, isChunkLoadError, reloadForUpdate } from '../src/utils/appUpdate';

describe('stale deploy handling', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('recognises missing-chunk errors from Chrome, Safari and Firefox', () => {
    for (const message of [
      'Failed to fetch dynamically imported module: https://example.com/assets/BuilderPage-abc.js',
      'Importing a module script failed.',
      'error loading dynamically imported module: https://example.com/assets/pdf-1.js',
      "'text/html' is not a valid JavaScript MIME type.",
    ]) {
      expect(isChunkLoadError(new Error(message))).toBe(true);
    }
    expect(isChunkLoadError(new Error('Name is required'))).toBe(false);
  });

  it('explains a stale deploy and passes other errors through', () => {
    expect(describeError(new Error('Importing a module script failed.'), 'PDF export failed.')).toBe(APP_UPDATED_MESSAGE);
    expect(describeError(new Error('Disk full'), 'PDF export failed.')).toBe('Disk full');
    expect(describeError('weird', 'PDF export failed.')).toBe('PDF export failed.');
  });

  it('reloads once, then refuses to loop', () => {
    const store = new Map<string, string>();
    const reload = vi.fn();
    vi.stubGlobal('window', {
      sessionStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) },
      location: { reload },
    });
    expect(reloadForUpdate()).toBe(true);
    expect(reloadForUpdate()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
