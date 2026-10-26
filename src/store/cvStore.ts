import { create } from 'zustand';
import type {
  CVDocument,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  PersonalInfo,
  ProjectItem,
  ResumeTemplateId,
  SavedCVPayload,
  SectionId,
  SimpleSectionItem,
} from '../types/cv';
import { clearSavedCV, loadSavedCV, saveCV } from '../utils/storage';
import { createId } from '../utils/cvUtils';
import { defaultOrder, sectionDefaults, sectionLabelMap } from '../data/sectionMeta';
import { normalizeImportedDocument } from '../utils/importDocument';

const nowIso = () => new Date().toISOString();

const createExperienceItem = (): ExperienceItem => ({
  id: createId(),
  role: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  achievements: [],
  technologies: [],
});

const createEducationItem = (): EducationItem => ({
  id: createId(),
  institution: '',
  qualification: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  description: '',
});

const createProjectItem = (): ProjectItem => ({
  id: createId(),
  name: '',
  role: '',
  date: '',
  description: '',
  link: '',
  technologies: [],
});

const createLanguageItem = (): LanguageItem => ({
  id: createId(),
  name: '',
  proficiency: 'Fluent',
});

const createSimpleItem = (): SimpleSectionItem => ({
  id: createId(),
  title: '',
  details: '',
});

const createEmptyDocument = (): CVDocument => ({
  personalInfo: {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    websiteUrl: '',
    profilePhoto: '',
    photoZoom: 1,
    photoX: 50,
    photoY: 50,
    summary: '',
  },
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
  sectionOrder: defaultOrder,
  sectionVisibility: sectionDefaults.reduce((acc, section) => {
    acc[section.id] = section.visible;
    return acc;
  }, {} as Record<SectionId, boolean>),
  lastUpdatedAt: nowIso(),
});

type SaveStatus = 'idle' | 'saved' | 'saving' | 'loaded' | 'error';

interface CVState {
  document: CVDocument;
  activeSection: SectionId;
  activeExperienceId: string | null;
  activeEducationId: string | null;
  activeProjectId: string | null;
  activeLanguageId: string | null;
  activeSimpleSection: 'certifications' | 'volunteer' | 'awards' | 'references' | null;
  saveStatus: SaveStatus;
  /** User-facing reason the last autosave failed, if it did. */
  saveError: string | null;
  savedAt: string | null;
  hydrated: boolean;
  templateId: ResumeTemplateId;
  initFromStorage: () => void;
  createNewCV: () => void;
  resetCV: () => void;
  setActiveSection: (section: SectionId) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setTemplateId: (templateId: ResumeTemplateId) => void;
  updatePersonalInfo: (field: keyof PersonalInfo, value: string | number) => void;
  updateSummary: (value: string) => void;
  updateProfilePhoto: (value: string) => void;
  removeProfilePhoto: () => void;
  setSkills: (skills: string[]) => void;
  setInterests: (interests: string[]) => void;
  addExperience: () => void;
  duplicateExperience: (id: string) => void;
  updateExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  deleteExperience: (id: string) => void;
  moveExperience: (id: string, direction: 'up' | 'down') => void;
  addEducation: () => void;
  duplicateEducation: (id: string) => void;
  updateEducation: (id: string, patch: Partial<EducationItem>) => void;
  deleteEducation: (id: string) => void;
  moveEducation: (id: string, direction: 'up' | 'down') => void;
  addProject: () => void;
  duplicateProject: (id: string) => void;
  updateProject: (id: string, patch: Partial<ProjectItem>) => void;
  deleteProject: (id: string) => void;
  moveProject: (id: string, direction: 'up' | 'down') => void;
  addLanguage: () => void;
  duplicateLanguage: (id: string) => void;
  updateLanguage: (id: string, patch: Partial<LanguageItem>) => void;
  deleteLanguage: (id: string) => void;
  moveLanguage: (id: string, direction: 'up' | 'down') => void;
  addSimpleItem: (section: 'certifications' | 'volunteer' | 'awards' | 'references') => void;
  duplicateSimpleItem: (section: 'certifications' | 'volunteer' | 'awards' | 'references', id: string) => void;
  updateSimpleItem: (section: 'certifications' | 'volunteer' | 'awards' | 'references', id: string, patch: Partial<SimpleSectionItem>) => void;
  deleteSimpleItem: (section: 'certifications' | 'volunteer' | 'awards' | 'references', id: string) => void;
  moveSection: (sectionId: SectionId, direction: 'up' | 'down') => void;
  moveSectionToIndex: (sectionId: SectionId, targetIndex: number) => void;
  toggleSectionVisibility: (sectionId: SectionId) => void;
  addOptionalSection: (sectionId: 'certifications' | 'volunteer' | 'awards' | 'references') => void;
  removeOptionalSection: (sectionId: 'certifications' | 'volunteer' | 'awards' | 'references') => void;
  loadImportedDocument: (document: CVDocument, templateId?: ResumeTemplateId) => void;
  clearSection: (sectionId: SectionId) => void;
  persist: () => void;
  /** The last delete or clear, undoable until the CV changes again. */
  undo: UndoEntry | null;
  undoRemoval: () => void;
  dismissUndo: () => void;
  /** Another tab saved ('changed') or deleted ('deleted') this CV; autosave pauses until resolved. */
  conflict: 'changed' | 'deleted' | null;
  /** Call when another tab wrote the saved CV; syncs quietly when safe, otherwise flags a conflict. */
  syncFromOtherTab: () => void;
  /** 'theirs' loads what the other tab saved; 'mine' saves this tab's CV over it. */
  resolveConflict: (keep: 'theirs' | 'mine') => void;
}

type EditorPosition = Pick<CVState, 'document' | 'activeSection' | 'activeExperienceId' | 'activeEducationId' | 'activeProjectId' | 'activeLanguageId' | 'activeSimpleSection'>;

export interface UndoEntry {
  message: string;
  before: EditorPosition;
  /** The document the removal produced; once the CV moves on from it, undo would discard newer work. */
  after: CVDocument;
}

export const isUndoAvailable = (state: Pick<CVState, 'undo' | 'document'>) => Boolean(state.undo && state.undo.after === state.document);

const quoted = (value: string | undefined) => (value?.trim() ? `“${value.trim()}”` : '');

const updateItem = <T extends { id: string }>(items: T[], id: string, patch: Partial<T>) =>
  items.map((item) => (item.id === id ? { ...item, ...patch } : item));

const duplicateAfter = <T extends { id: string }>(items: T[], id: string, clone: (item: T) => T) => {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return { items, insertedId: null as string | null };
  const nextItem = clone(items[index]);
  const next = [...items];
  next.splice(index + 1, 0, nextItem);
  return { items: next, insertedId: nextItem.id };
};

const applyVisibility = (document: CVDocument, sectionId: SectionId, visible: boolean): CVDocument => ({
  ...document,
  sectionVisibility: {
    ...document.sectionVisibility,
    [sectionId]: visible,
  },
});

const nearestVisibleSection = (document: CVDocument, fromSectionId: SectionId): SectionId => {
  const order = document.sectionOrder.filter((sectionId) => sectionId !== 'summary');
  const index = (order as SectionId[]).indexOf(fromSectionId);
  const candidates = [...order.slice(index + 1), ...order.slice(0, Math.max(index, 0)).reverse()];
  return candidates.find((sectionId) => document.sectionVisibility[sectionId]) ?? 'personalInfo';
};

const withUpdatedTimestamp = (document: CVDocument): CVDocument => ({
  ...document,
  lastUpdatedAt: nowIso(),
});

const hydrateDocument = (saved?: SavedCVPayload | null) => {
  if (!saved?.document) return createEmptyDocument();
  const normalized = normalizeImportedDocument(saved.document);
  if (!normalized) return createEmptyDocument();

  return {
    ...normalized,
    sectionOrder: normalized.sectionOrder.filter((sectionId) => sectionId !== 'summary'),
  };
};

const sectionKeyMap: Record<string, keyof CVDocument> = {
  certifications: 'certifications',
  volunteer: 'volunteer',
  awards: 'awards',
  references: 'references',
};


const firstMatchingId = <T extends { id: string }>(items: T[], candidate: string | null | undefined) =>
  candidate && items.some((item) => item.id === candidate) ? candidate : items[0]?.id ?? null;

const resolveSimpleSection = (document: CVDocument, candidate: CVState['activeSimpleSection']) => {
  if (candidate && document[candidate].length > 0) return candidate;
  return document.certifications.length > 0
    ? 'certifications'
    : document.volunteer.length > 0
      ? 'volunteer'
      : document.awards.length > 0
        ? 'awards'
        : document.references.length > 0
          ? 'references'
          : null;
};

export const useCVStore = create<CVState>((set, get) => {
  /** Runs a delete or clear and keeps what it removed, so one mis-tap can't cost a whole section. */
  const removeWithUndo = (message: string, apply: () => void) => {
    const state = get();
    const before: EditorPosition = {
      document: state.document,
      activeSection: state.activeSection,
      activeExperienceId: state.activeExperienceId,
      activeEducationId: state.activeEducationId,
      activeProjectId: state.activeProjectId,
      activeLanguageId: state.activeLanguageId,
      activeSimpleSection: state.activeSimpleSection,
    };
    apply();
    const after = get().document;
    // Clearing an already-empty section only bumps the timestamp; there is nothing to undo.
    const content = (document: CVDocument) => JSON.stringify({ ...document, lastUpdatedAt: '' });
    if (content(after) !== content(before.document)) set({ undo: { message, before, after } });
  };

  // The document and save id this tab last loaded from or wrote to storage. The document reference
  // changes as soon as the user edits here; the id says which save this tab has seen.
  let lastSyncedDocument: CVDocument | null = null;
  let lastSyncedRev: string | null = null;
  const contentKey = (document: CVDocument) => JSON.stringify({ ...document, lastUpdatedAt: '' });

  const loadFromStorage = () => {
    const saved = loadSavedCV();
    if (saved?.document) {
      const document = hydrateDocument(saved);
      set({
        document,
        activeSection: saved.activeSection === 'summary' ? 'personalInfo' : (saved.activeSection ?? 'personalInfo'),
        activeExperienceId: firstMatchingId(document.experience, saved.activeItemIds?.experience ?? null),
        activeEducationId: firstMatchingId(document.education, saved.activeItemIds?.education ?? null),
        activeProjectId: firstMatchingId(document.projects, saved.activeItemIds?.projects ?? null),
        activeLanguageId: firstMatchingId(document.languages, saved.activeItemIds?.languages ?? null),
        activeSimpleSection: resolveSimpleSection(document, saved.activeItemIds?.simpleSection as CVState['activeSimpleSection']),
        saveStatus: 'loaded',
        savedAt: document.lastUpdatedAt,
        hydrated: true,
        templateId: saved.templateId ?? 'classic',
      });
      return;
    }
    set({ document: createEmptyDocument(), hydrated: true, saveStatus: 'idle', templateId: 'classic' });
  };
  const loadAndSync = () => {
    lastSyncedRev = loadSavedCV()?.rev ?? null;
    loadFromStorage();
    lastSyncedDocument = get().document;
  };

  return {
  document: createEmptyDocument(),
  activeSection: 'personalInfo',
  activeExperienceId: null,
  activeEducationId: null,
  activeProjectId: null,
  activeLanguageId: null,
  activeSimpleSection: null,
  saveStatus: 'idle',
  savedAt: null,
  saveError: null,
  hydrated: false,
  templateId: 'classic',
  initFromStorage: () => {
    // Already holding a document (e.g. just imported on the landing page): don't overwrite it with the old draft.
    if (get().hydrated) return;
    loadAndSync();
  },
  createNewCV: () => {
    clearSavedCV();
    set({ document: createEmptyDocument(), activeSection: 'personalInfo', activeExperienceId: null, activeEducationId: null, activeProjectId: null, activeLanguageId: null, activeSimpleSection: null, saveStatus: 'idle', savedAt: null, templateId: 'classic' });
  },
  resetCV: () => {
    clearSavedCV();
    set({ document: createEmptyDocument(), activeSection: 'personalInfo', activeExperienceId: null, activeEducationId: null, activeProjectId: null, activeLanguageId: null, activeSimpleSection: null, saveStatus: 'idle', savedAt: null, templateId: 'classic' });
  },
  setActiveSection: (section) => set({ activeSection: section }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setTemplateId: (templateId) => set({ templateId, saveStatus: 'saving' }),
  updatePersonalInfo: (field, value) =>
    set((state) => ({
      document: withUpdatedTimestamp({
        ...state.document,
        personalInfo: {
          ...state.document.personalInfo,
          [field]: value,
        } as PersonalInfo,
      }),
      saveStatus: 'saving',
    })),
  updateSummary: (value) =>
    set((state) => ({
      document: withUpdatedTimestamp({
        ...state.document,
        personalInfo: { ...state.document.personalInfo, summary: value },
      }),
      saveStatus: 'saving',
    })),
  updateProfilePhoto: (value) =>
    set((state) => ({
      document: withUpdatedTimestamp({
        ...state.document,
        // A new photo starts centred; the previous photo's crop wouldn't fit it.
        personalInfo: { ...state.document.personalInfo, profilePhoto: value, photoZoom: 1, photoX: 50, photoY: 50 },
      }),
      saveStatus: 'saving',
    })),
  removeProfilePhoto: () =>
    removeWithUndo('Removed your profile photo', () =>
      set((state) => ({
        document: withUpdatedTimestamp({
          ...state.document,
          personalInfo: { ...state.document.personalInfo, profilePhoto: '' },
        }),
        saveStatus: 'saving',
      })),
    ),
  setSkills: (skills) =>
    set((state) => ({
      document: withUpdatedTimestamp({ ...state.document, skills }),
      saveStatus: 'saving',
    })),
  setInterests: (interests) =>
    set((state) => ({
      document: withUpdatedTimestamp({ ...state.document, interests }),
      saveStatus: 'saving',
    })),
  addExperience: () => set((state) => {
    const item = createExperienceItem();
    return { document: withUpdatedTimestamp({ ...state.document, experience: [...state.document.experience, item] }), activeSection: 'experience', activeExperienceId: item.id, saveStatus: 'saving' };
  }),
  duplicateExperience: (id) => set((state) => {
    const { items, insertedId } = duplicateAfter(state.document.experience, id, (item) => ({ ...item, id: createId(), achievements: [...item.achievements], technologies: [...item.technologies] }));
    if (!insertedId) return {};
    return { document: withUpdatedTimestamp({ ...state.document, experience: items }), activeSection: 'experience', activeExperienceId: insertedId, saveStatus: 'saving' };
  }),
  updateExperience: (id, patch) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, experience: updateItem(state.document.experience, id, patch) }), activeExperienceId: id, activeSection: 'experience', saveStatus: 'saving' })),
  deleteExperience: (id) => {
    const item = get().document.experience.find((entry) => entry.id === id);
    removeWithUndo(`Deleted ${quoted(item?.role) || 'an entry'} from Experience`, () => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, experience: state.document.experience.filter((item) => item.id !== id) }), activeExperienceId: state.activeExperienceId === id ? null : state.activeExperienceId, saveStatus: 'saving' })));
  },
  moveExperience: (id, direction) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, experience: moveItems(state.document.experience, id, direction) }), saveStatus: 'saving' })),
  addEducation: () => set((state) => {
    const item = createEducationItem();
    return { document: withUpdatedTimestamp({ ...state.document, education: [...state.document.education, item] }), activeSection: 'education', activeEducationId: item.id, saveStatus: 'saving' };
  }),
  duplicateEducation: (id) => set((state) => {
    const { items, insertedId } = duplicateAfter(state.document.education, id, (item) => ({ ...item, id: createId() }));
    if (!insertedId) return {};
    return { document: withUpdatedTimestamp({ ...state.document, education: items }), activeSection: 'education', activeEducationId: insertedId, saveStatus: 'saving' };
  }),
  updateEducation: (id, patch) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, education: updateItem(state.document.education, id, patch) }), activeEducationId: id, activeSection: 'education', saveStatus: 'saving' })),
  deleteEducation: (id) => {
    const item = get().document.education.find((entry) => entry.id === id);
    removeWithUndo(`Deleted ${quoted(item?.qualification) || 'an entry'} from Education`, () => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, education: state.document.education.filter((item) => item.id !== id) }), activeEducationId: state.activeEducationId === id ? null : state.activeEducationId, saveStatus: 'saving' })));
  },
  moveEducation: (id, direction) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, education: moveItems(state.document.education, id, direction) }), saveStatus: 'saving' })),
  addProject: () => set((state) => {
    const item = createProjectItem();
    return { document: withUpdatedTimestamp({ ...state.document, projects: [...state.document.projects, item] }), activeSection: 'projects', activeProjectId: item.id, saveStatus: 'saving' };
  }),
  duplicateProject: (id) => set((state) => {
    const { items, insertedId } = duplicateAfter(state.document.projects, id, (item) => ({ ...item, id: createId(), technologies: [...item.technologies] }));
    if (!insertedId) return {};
    return { document: withUpdatedTimestamp({ ...state.document, projects: items }), activeSection: 'projects', activeProjectId: insertedId, saveStatus: 'saving' };
  }),
  updateProject: (id, patch) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, projects: updateItem(state.document.projects, id, patch) }), activeProjectId: id, activeSection: 'projects', saveStatus: 'saving' })),
  deleteProject: (id) => {
    const item = get().document.projects.find((entry) => entry.id === id);
    removeWithUndo(`Deleted ${quoted(item?.name) || 'an entry'} from Projects`, () => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, projects: state.document.projects.filter((item) => item.id !== id) }), activeProjectId: state.activeProjectId === id ? null : state.activeProjectId, saveStatus: 'saving' })));
  },
  moveProject: (id, direction) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, projects: moveItems(state.document.projects, id, direction) }), saveStatus: 'saving' })),
  addLanguage: () => set((state) => {
    const item = createLanguageItem();
    return { document: withUpdatedTimestamp({ ...state.document, languages: [...state.document.languages, item] }), activeSection: 'languages', activeLanguageId: item.id, saveStatus: 'saving' };
  }),
  duplicateLanguage: (id) => set((state) => {
    const { items, insertedId } = duplicateAfter(state.document.languages, id, (item) => ({ ...item, id: createId() }));
    if (!insertedId) return {};
    return { document: withUpdatedTimestamp({ ...state.document, languages: items }), activeSection: 'languages', activeLanguageId: insertedId, saveStatus: 'saving' };
  }),
  updateLanguage: (id, patch) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, languages: updateItem(state.document.languages, id, patch) }), activeLanguageId: id, activeSection: 'languages', saveStatus: 'saving' })),
  deleteLanguage: (id) => {
    const item = get().document.languages.find((entry) => entry.id === id);
    removeWithUndo(`Deleted ${quoted(item?.name) || 'an entry'} from Languages`, () => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, languages: state.document.languages.filter((item) => item.id !== id) }), activeLanguageId: state.activeLanguageId === id ? null : state.activeLanguageId, saveStatus: 'saving' })));
  },
  moveLanguage: (id, direction) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, languages: moveItems(state.document.languages, id, direction) }), saveStatus: 'saving' })),
  addSimpleItem: (section) => set((state) => {
    const key = sectionKeyMap[section] as keyof CVDocument;
    const nextValue = [...(state.document[key] as SimpleSectionItem[]), createSimpleItem()];
    return { document: withUpdatedTimestamp({ ...state.document, [key]: nextValue }), activeSection: section, activeSimpleSection: section, saveStatus: 'saving' };
  }),
  duplicateSimpleItem: (section, id) => set((state) => {
    const key = sectionKeyMap[section] as keyof CVDocument;
    const items = state.document[key] as SimpleSectionItem[];
    const { items: nextItems, insertedId } = duplicateAfter(items, id, (item) => ({ ...item, id: createId() }));
    if (!insertedId) return {};
    return { document: withUpdatedTimestamp({ ...state.document, [key]: nextItems }), activeSection: section, activeSimpleSection: section, saveStatus: 'saving' };
  }),
  updateSimpleItem: (section, id, patch) => set((state) => {
    const key = sectionKeyMap[section] as keyof CVDocument;
    const items = state.document[key] as SimpleSectionItem[];
    return { document: withUpdatedTimestamp({ ...state.document, [key]: updateItem(items, id, patch) }), activeSection: section, activeSimpleSection: section, saveStatus: 'saving' };
  }),
  deleteSimpleItem: (section, id) => {
    const item = (get().document[sectionKeyMap[section]] as SimpleSectionItem[]).find((entry) => entry.id === id);
    removeWithUndo(`Deleted ${quoted(item?.title) || 'an entry'} from ${sectionLabelMap[section]}`, () =>
      set((state) => {
        const key = sectionKeyMap[section] as keyof CVDocument;
        const items = state.document[key] as SimpleSectionItem[];
        return { document: withUpdatedTimestamp({ ...state.document, [key]: items.filter((entry) => entry.id !== id) }), activeSimpleSection: state.activeSimpleSection === section ? null : state.activeSimpleSection, saveStatus: 'saving' };
      }),
    );
  },
  moveSection: (sectionId, direction) => set((state) => {
    const currentIndex = state.document.sectionOrder.indexOf(sectionId);
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.document.sectionOrder.length) return {};
    const nextOrder = [...state.document.sectionOrder];
    [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
    return { document: withUpdatedTimestamp({ ...state.document, sectionOrder: nextOrder }), saveStatus: 'saving' };
  }),
  moveSectionToIndex: (sectionId, targetIndex) => set((state) => {
    const currentIndex = state.document.sectionOrder.indexOf(sectionId);
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= state.document.sectionOrder.length || currentIndex === targetIndex) return {};
    const nextOrder = [...state.document.sectionOrder];
    nextOrder.splice(currentIndex, 1);
    nextOrder.splice(targetIndex, 0, sectionId);
    return { document: withUpdatedTimestamp({ ...state.document, sectionOrder: nextOrder }), saveStatus: 'saving' };
  }),
  toggleSectionVisibility: (sectionId) =>
    set((state) => {
      const visible = !state.document.sectionVisibility[sectionId];
      const document = withUpdatedTimestamp(applyVisibility(state.document, sectionId, visible));
      // Showing a section opens it; hiding the one being edited moves to the nearest visible section.
      const activeSection = visible ? sectionId : state.activeSection === sectionId ? nearestVisibleSection(document, sectionId) : state.activeSection;
      return { document, activeSection, saveStatus: 'saving' };
    }),
  addOptionalSection: (sectionId) => set((state) => ({ document: withUpdatedTimestamp(applyVisibility(state.document, sectionId, true)), activeSection: sectionId, saveStatus: 'saving' })),
  removeOptionalSection: (sectionId) => set((state) => ({ document: withUpdatedTimestamp(applyVisibility(state.document, sectionId, false)), saveStatus: 'saving' })),
  loadImportedDocument: (incomingDocument, importedTemplateId) => {
    const normalized = normalizeImportedDocument(incomingDocument);
    if (!normalized) return;
    const activeSection = getInitialActiveSection(normalized);
    set({
      document: normalized,
      activeSection,
      activeExperienceId: normalized.experience[0]?.id ?? null,
      activeEducationId: normalized.education[0]?.id ?? null,
      activeProjectId: normalized.projects[0]?.id ?? null,
      activeLanguageId: normalized.languages[0]?.id ?? null,
      activeSimpleSection: resolveSimpleSection(normalized, null),
      saveStatus: 'loaded',
      savedAt: normalized.lastUpdatedAt,
      hydrated: true,
      templateId: importedTemplateId ?? get().templateId,
    });
    get().persist();
  },
  clearSection: (sectionId) =>
    removeWithUndo(sectionId === 'summary' ? 'Cleared your summary' : `Cleared ${sectionLabelMap[sectionId]}`, () => set((state) => {
    const next: CVDocument = { ...state.document };
    const nextState: Partial<CVState> = { saveStatus: 'saving' };

    if (sectionId === 'summary') next.personalInfo = { ...next.personalInfo, summary: '' };
    if (sectionId === 'experience') {
      next.experience = [];
      nextState.activeExperienceId = null;
    }
    if (sectionId === 'education') {
      next.education = [];
      nextState.activeEducationId = null;
    }
    if (sectionId === 'projects') {
      next.projects = [];
      nextState.activeProjectId = null;
    }
    if (sectionId === 'skills') next.skills = [];
    if (sectionId === 'languages') {
      next.languages = [];
      nextState.activeLanguageId = null;
    }
    if (sectionId === 'certifications') {
      next.certifications = [];
      nextState.activeSimpleSection = state.activeSimpleSection === 'certifications' ? null : state.activeSimpleSection;
    }
    if (sectionId === 'volunteer') {
      next.volunteer = [];
      nextState.activeSimpleSection = state.activeSimpleSection === 'volunteer' ? null : state.activeSimpleSection;
    }
    if (sectionId === 'awards') {
      next.awards = [];
      nextState.activeSimpleSection = state.activeSimpleSection === 'awards' ? null : state.activeSimpleSection;
    }
    if (sectionId === 'references') {
      next.references = [];
      nextState.activeSimpleSection = state.activeSimpleSection === 'references' ? null : state.activeSimpleSection;
    }

    return { ...nextState, document: withUpdatedTimestamp(next) };
  })),
  persist: () => {
    const state = get();
    // Saving now would silently overwrite what another tab just saved.
    if (state.conflict) return;
    const rev = createId();
    const payload: SavedCVPayload = {
      version: 2,
      rev,
      parentRev: lastSyncedRev,
      document: state.document,
      activeSection: state.activeSection,
      activeItemIds: {
        experience: state.activeExperienceId,
        education: state.activeEducationId,
        projects: state.activeProjectId,
        languages: state.activeLanguageId,
        simpleSection: state.activeSimpleSection,
      },
      templateId: state.templateId,
    };
    const result = saveCV(payload);
    if (!result.ok) {
      set({ saveStatus: 'error', saveError: result.message });
      return;
    }
    lastSyncedDocument = state.document;
    lastSyncedRev = rev;
    set({ saveStatus: 'saved', savedAt: new Date().toISOString(), saveError: null });
  },
  undo: null,
  undoRemoval: () => {
    const state = get();
    if (!state.undo || !isUndoAvailable(state)) return;
    set({ ...state.undo.before, document: withUpdatedTimestamp(state.undo.before.document), undo: null, saveStatus: 'saving' });
  },
  dismissUndo: () => set({ undo: null }),
  conflict: null,
  syncFromOtherTab: () => {
    // The user is choosing between versions: this tab's copy must stay exactly as it is meanwhile
    // (e.g. after Start over elsewhere, that tab's new empty CV must not replace the one shown here).
    if (get().conflict) return;
    // Read what is stored now, not the event's value: events from two near-simultaneous saves can
    // arrive after this tab has already written its own.
    const saved = loadSavedCV();
    if (!saved) {
      set({ conflict: 'deleted', saveStatus: 'error' });
      return;
    }
    if (saved.rev && saved.rev === lastSyncedRev) return;
    // Another tab re-saved what this tab already has (e.g. it was just opened): nothing changed.
    if (lastSyncedDocument && contentKey(hydrateDocument(saved)) === contentKey(lastSyncedDocument)) {
      lastSyncedRev = saved.rev ?? null;
      return;
    }
    const editedHere = get().document !== lastSyncedDocument;
    const builtOnOurs = (saved.parentRev ?? null) === lastSyncedRev;
    // Only take the other version silently if it saw our latest save and we've changed nothing since.
    if (!editedHere && builtOnOurs) {
      loadAndSync();
      return;
    }
    set({ conflict: 'changed', saveStatus: 'error' });
  },
  resolveConflict: (keep) => {
    set({ conflict: null });
    if (keep === 'theirs') {
      loadAndSync();
      return;
    }
    // Build on the version we chose to replace, so the other tab sees an informed save and syncs quietly.
    lastSyncedRev = loadSavedCV()?.rev ?? null;
    get().persist();
  },
  };
});

function getInitialActiveSection(document: CVDocument): SectionId {
  if (document.experience.length > 0) return 'experience';
  if (document.projects.length > 0) return 'projects';
  if (document.education.length > 0) return 'education';
  if (document.skills.length > 0) return 'skills';
  if (document.languages.length > 0) return 'languages';
  if (document.certifications.length > 0) return 'certifications';
  if (document.volunteer.length > 0) return 'volunteer';
  if (document.awards.length > 0) return 'awards';
  if (document.interests.length > 0) return 'interests';
  if (document.references.length > 0) return 'references';
  return 'personalInfo';
}

function moveItems<T extends { id: string }>(items: T[], id: string, direction: 'up' | 'down') {
  const currentIndex = items.findIndex((item) => item.id === id);
  if (currentIndex < 0) return items;
  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
  return next;
}
