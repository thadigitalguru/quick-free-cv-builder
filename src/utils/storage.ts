import { normalizeImportedDocument } from './importDocument';
import type { SavedCVPayload } from '../types/cv';

const STORAGE_KEY = 'quick-free-cv-builder:v3';
const STORAGE_VERSION = 3;

const isSavedCVPayload = (value: unknown): value is SavedCVPayload => {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;
  const document = payload.document as Record<string, unknown> | undefined;
  const activeItemIds = payload.activeItemIds as Record<string, unknown> | undefined;
  const version = payload.version;
  return !!document && !!activeItemIds && typeof payload.activeSection === 'string' && (typeof version === 'number' || typeof version === 'undefined');
};

const normalizeSavedPayload = (payload: SavedCVPayload): SavedCVPayload | null => {
  const document = normalizeImportedDocument(payload.document);
  if (!document) return null;

  return {
    version: STORAGE_VERSION,
    document,
    activeSection: payload.activeSection,
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

export const loadSavedCV = (): SavedCVPayload | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isSavedCVPayload(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const normalized = normalizeSavedPayload({
      version: parsed.version ?? STORAGE_VERSION,
      document: parsed.document,
      activeSection: parsed.activeSection,
      activeItemIds: parsed.activeItemIds,
      templateId: parsed.templateId,
    });

    if (!normalized) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return normalized;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveCV = (payload: SavedCVPayload) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, version: STORAGE_VERSION }));
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
