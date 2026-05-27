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
import { defaultOrder, sectionDefaults } from '../data/sectionMeta';
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
  institution: 'University Name',
  qualification: 'BSc',
  fieldOfStudy: 'Computer Science',
  startDate: '2018-09',
  endDate: '2022-06',
  description: 'Relevant coursework, honors, or achievements.',
});

const createProjectItem = (): ProjectItem => ({
  id: createId(),
  name: 'Portfolio Project',
  role: 'Builder',
  date: '2024',
  description: 'A concise description of the project impact and scope.',
  link: 'https://example.com',
  technologies: ['React', 'TypeScript'],
});

const createLanguageItem = (): LanguageItem => ({
  id: createId(),
  name: 'English',
  proficiency: 'Fluent',
});

const createSimpleItem = (title: string, details = 'Add a concise description here.'): SimpleSectionItem => ({
  id: createId(),
  title,
  details,
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

type SaveStatus = 'idle' | 'saved' | 'saving' | 'loaded';

interface CVState {
  document: CVDocument;
  activeSection: SectionId;
  activeExperienceId: string | null;
  activeEducationId: string | null;
  activeProjectId: string | null;
  activeLanguageId: string | null;
  activeSimpleSection: 'certifications' | 'volunteer' | 'awards' | 'references' | null;
  saveStatus: SaveStatus;
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
  loadImportedDocument: (document: CVDocument) => void;
  clearSection: (sectionId: SectionId) => void;
  persist: () => void;
}

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

const optionalSectionInitialTitles: Record<'certifications' | 'volunteer' | 'awards' | 'references', string> = {
  certifications: 'New Certification',
  volunteer: 'Volunteer Experience',
  awards: 'New Award',
  references: 'Reference',
};

const isOptionalSection = (sectionId: string): sectionId is 'certifications' | 'volunteer' | 'awards' | 'references' =>
  sectionId in optionalSectionInitialTitles;

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

export const useCVStore = create<CVState>((set, get) => ({
  document: createEmptyDocument(),
  activeSection: 'personalInfo',
  activeExperienceId: null,
  activeEducationId: null,
  activeProjectId: null,
  activeLanguageId: null,
  activeSimpleSection: null,
  saveStatus: 'idle',
  savedAt: null,
  hydrated: false,
  templateId: 'classic',
  initFromStorage: () => {
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
        personalInfo: { ...state.document.personalInfo, profilePhoto: value },
      }),
      saveStatus: 'saving',
    })),
  removeProfilePhoto: () =>
    set((state) => ({
      document: withUpdatedTimestamp({
        ...state.document,
        personalInfo: { ...state.document.personalInfo, profilePhoto: '' },
      }),
      saveStatus: 'saving',
    })),
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
  deleteExperience: (id) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, experience: state.document.experience.filter((item) => item.id !== id) }), activeExperienceId: state.activeExperienceId === id ? null : state.activeExperienceId, saveStatus: 'saving' })),
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
  deleteEducation: (id) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, education: state.document.education.filter((item) => item.id !== id) }), activeEducationId: state.activeEducationId === id ? null : state.activeEducationId, saveStatus: 'saving' })),
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
  deleteProject: (id) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, projects: state.document.projects.filter((item) => item.id !== id) }), activeProjectId: state.activeProjectId === id ? null : state.activeProjectId, saveStatus: 'saving' })),
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
  deleteLanguage: (id) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, languages: state.document.languages.filter((item) => item.id !== id) }), activeLanguageId: state.activeLanguageId === id ? null : state.activeLanguageId, saveStatus: 'saving' })),
  moveLanguage: (id, direction) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, languages: moveItems(state.document.languages, id, direction) }), saveStatus: 'saving' })),
  addSimpleItem: (section) => set((state) => {
    const key = sectionKeyMap[section] as keyof CVDocument;
    const title = optionalSectionInitialTitles[section];
    const nextValue = [...(state.document[key] as SimpleSectionItem[]), createSimpleItem(title)];
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
  deleteSimpleItem: (section, id) => set((state) => {
    const key = sectionKeyMap[section] as keyof CVDocument;
    const items = state.document[key] as SimpleSectionItem[];
    return { document: withUpdatedTimestamp({ ...state.document, [key]: items.filter((item) => item.id !== id) }), activeSimpleSection: state.activeSimpleSection === section ? null : state.activeSimpleSection, saveStatus: 'saving' };
  }),
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
  toggleSectionVisibility: (sectionId) => set((state) => ({ document: withUpdatedTimestamp(applyVisibility(state.document, sectionId, !state.document.sectionVisibility[sectionId])), saveStatus: 'saving' })),
  addOptionalSection: (sectionId) => set((state) => ({ document: withUpdatedTimestamp(applyVisibility(state.document, sectionId, true)), activeSection: sectionId, saveStatus: 'saving' })),
  removeOptionalSection: (sectionId) => set((state) => ({ document: withUpdatedTimestamp(applyVisibility(state.document, sectionId, false)), saveStatus: 'saving' })),
  loadImportedDocument: (incomingDocument) => {
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
    });
  },
  clearSection: (sectionId) => set((state) => {
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
  }),
  persist: () => {
    const state = get();
    const payload: SavedCVPayload = {
      version: 2,
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
    saveCV(payload);
    set({ saveStatus: 'saved', savedAt: new Date().toISOString() });
  },
}));

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
