import type { SavedCVPayload } from '../types/cv';

const STORAGE_KEY = 'quick-free-cv-builder:v3';

const isSavedCVPayload = (value: unknown): value is SavedCVPayload => {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;
  const document = payload.document as Record<string, unknown> | undefined;
  const activeItemIds = payload.activeItemIds as Record<string, unknown> | undefined;
  return !!document && !!activeItemIds && typeof payload.activeSection === 'string';
};

export const loadSavedCV = (): SavedCVPayload | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isSavedCVPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveCV = (payload: SavedCVPayload) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const clearSavedCV = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const getSavedDraftMeta = () => {
  const saved = loadSavedCV();
  if (!saved) return null;
  return {
    savedAt: saved.document.lastUpdatedAt,
    activeSection: saved.activeSection,
  };
};
