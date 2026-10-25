import { normalizeImportedDocument } from './importDocument';
import type { SavedCVPayload } from '../types/cv';
import { CORRUPT_BACKUP_KEY, STORAGE_KEY } from './storageKeys';

export { CORRUPT_BACKUP_KEY };
const STORAGE_VERSION = 3;

// Only the CV itself is required; the editor's position (active section and items) has safe defaults,
// so a draft missing it is still opened rather than set aside.
const isSavedCVPayload = (value: unknown): value is SavedCVPayload => {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;
  return typeof payload.document === 'object' && payload.document !== null && !Array.isArray(payload.document);
};

const normalizeSavedPayload = (payload: SavedCVPayload): SavedCVPayload | null => {
  const document = normalizeImportedDocument(payload.document);
  if (!document) return null;

  return {
    version: STORAGE_VERSION,
    document,
    activeSection: typeof payload.activeSection === 'string' ? payload.activeSection : 'personalInfo',
    activeItemIds: {
      experience: payload.activeItemIds?.experience ?? null,
      education: payload.activeItemIds?.education ?? null,
      projects: payload.activeItemIds?.projects ?? null,
      languages: payload.activeItemIds?.languages ?? null,
      simpleSection: payload.activeItemIds?.simpleSection ?? null,
    },
    templateId: payload.templateId ?? 'classic',
  };
};

/** Keeps an unreadable draft under a backup key instead of deleting the only copy of someone's CV. */
const quarantineDraft = (raw: string) => {
  try {
    window.localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // If the backup can't be written, leave the original in place rather than lose it.
  }
};

export const loadSavedCV = (): SavedCVPayload | null => {
  if (typeof window === 'undefined') return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage is blocked (private mode, site data disabled); there's nothing we can read or safely clear.
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isSavedCVPayload(parsed)) {
      quarantineDraft(raw);
      return null;
    }

    const normalized = normalizeSavedPayload({
      version: typeof parsed.version === 'number' ? parsed.version : STORAGE_VERSION,
      document: parsed.document,
      activeSection: parsed.activeSection,
      activeItemIds: typeof parsed.activeItemIds === 'object' && parsed.activeItemIds !== null ? parsed.activeItemIds : ({} as SavedCVPayload['activeItemIds']),
      templateId: parsed.templateId,
    });

    if (!normalized) {
      quarantineDraft(raw);
      return null;
    }

    return normalized;
  } catch {
    quarantineDraft(raw);
    return null;
  }
};

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable'; message: string };

const isQuotaError = (error: unknown) =>
  error instanceof Error &&
  (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || (error as { code?: number }).code === 22 || (error as { code?: number }).code === 1014);

export const saveCV = (payload: SavedCVPayload): SaveResult => {
  if (typeof window === 'undefined') return { ok: true };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, version: STORAGE_VERSION }));
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) {
      return {
        ok: false,
        reason: 'quota',
        message: 'Browser storage is full, so recent changes are not saved. Download a JSON backup now, or remove the profile photo to free space.',
      };
    }
    return {
      ok: false,
      reason: 'unavailable',
      message: 'This browser is blocking local storage, so changes will be lost when you close the tab. Download a JSON backup to keep your work.',
    };
  }
};

export const clearSavedCV = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored that we can reach.
  }
};

export const getSavedDraftMeta = () => {
  const saved = loadSavedCV();
  if (!saved) return null;
  return {
    savedAt: saved.document.lastUpdatedAt,
    activeSection: saved.activeSection,
  };
};

/** The raw text of a draft that was set aside because it couldn't be opened, if there is one. */
export const getUnreadableDraft = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(CORRUPT_BACKUP_KEY);
  } catch {
    return null;
  }
};

export const discardUnreadableDraft = () => {
  try {
    window.localStorage.removeItem(CORRUPT_BACKUP_KEY);
  } catch {
    // Nothing we can reach.
  }
};
