import { lazy, type ComponentType } from 'react';

/**
 * A deploy replaces the hashed JS files, so a tab opened before it asks for files that no longer
 * exist. Chrome, Safari and Firefox word that failure differently.
 */
export const isChunkLoadError = (error: unknown) =>
  error instanceof Error &&
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|is not a valid JavaScript MIME type|Loading chunk \S+ failed/i.test(error.message);

export const APP_UPDATED_MESSAGE = 'This app was just updated. Reload the page to continue; your CV is saved in this browser.';

/** User-facing text for a failed action, with stale-deploy failures explained instead of shown raw. */
export const describeError = (error: unknown, fallback: string) => {
  if (isChunkLoadError(error)) return APP_UPDATED_MESSAGE;
  return error instanceof Error && error.message ? error.message : fallback;
};

const RELOAD_FLAG = 'quick-free-cv-builder:reloaded-for-update';

/** Reloads once to pick up the new version; returns false if we already tried in the last minute. */
export const reloadForUpdate = () => {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_FLAG) ?? 0);
    if (Date.now() - last < 60_000) return false;
    window.sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
  } catch {
    // Without sessionStorage we can't guard against a reload loop, so don't reload automatically.
    return false;
  }
  window.location.reload();
  return true;
};

/** React.lazy that reloads once when the page's chunk is gone after a deploy. */
export const lazyWithReload = <T extends ComponentType<object>>(factory: () => Promise<{ default: T }>) =>
  lazy(() =>
    factory().catch((error: unknown) => {
      // The reload replaces this page; never settle so nothing renders in the meantime.
      if (isChunkLoadError(error) && reloadForUpdate()) return new Promise<never>(() => {});
      throw error;
    }),
  );
