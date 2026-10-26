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

// Leaving the page cancels in-flight downloads, which fail exactly like a chunk removed by a deploy.
// Reloading then would hijack the navigation the user just asked for.
let leavingPage = false;
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeunload', () => (leavingPage = true));
  window.addEventListener('pagehide', () => (leavingPage = true));
  window.addEventListener('pageshow', () => (leavingPage = false));
}

/** Whether a failed chunk load should be answered with a reload (not while leaving or offline). */
export const shouldReloadForUpdate = () => !leavingPage && (typeof navigator === 'undefined' || navigator.onLine !== false);

/** Reloads once to pick up the new version; returns false if we already tried in the last minute. */
export const reloadForUpdate = () => {
  // Offline, a reload would only show the browser's offline page; the error screen explains instead.
  if (!shouldReloadForUpdate()) return false;
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
      // The page is going away anyway (the user navigated): render nothing rather than an error.
      if (isChunkLoadError(error) && leavingPage) return new Promise<never>(() => {});
      // The reload replaces this page; never settle so nothing renders in the meantime.
      if (isChunkLoadError(error) && reloadForUpdate()) return new Promise<never>(() => {});
      throw error;
    }),
  );
