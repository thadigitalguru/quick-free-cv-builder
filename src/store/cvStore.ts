import { create } from 'zustand';
import type {
  CVDocument,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  PersonalInfo,
  ProjectItem,
  SectionId,
  SavedCVPayload,
  SimpleSectionItem,
} from '../types/cv';
import { clearSavedCV, loadSavedCV, saveCV } from '../utils/storage';
import { createId } from '../utils/cvUtils';
import { defaultOrder, sectionDefaults } from '../data/sectionMeta';

const nowIso = () => new Date().toISOString();

const createExperienceItem = (): ExperienceItem => ({
  id: createId(),
  role: 'Senior Product Designer',
  company: 'Company Name',
  location: 'Remote',
  startDate: '2022-01',
  endDate: '',
  isCurrent: true,
  achievements: ['Led design for a core product area and improved user completion rates.', 'Collaborated with engineering and stakeholders to ship polished experiences.'],
  technologies: ['Figma', 'Design Systems', 'Research'],
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

const createSimpleItem = (title: string): SimpleSectionItem => ({
  id: createId(),
  title,
  details: 'Add a concise description here.',
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
    summary: '',
  },
  experience: [createExperienceItem()],
  education: [createEducationItem()],
  skills: ['Communication', 'Leadership', 'Problem Solving'],
  projects: [createProjectItem()],
  languages: [createLanguageItem()],
  certifications: [createSimpleItem('Google UX Certificate')],
  awards: [],
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
  activeSimpleSection: 'certifications' | 'awards' | null;
  saveStatus: SaveStatus;
  savedAt: string | null;
  hydrated: boolean;
  initFromStorage: () => void;
  createNewCV: () => void;
  resetCV: () => void;
  setActiveSection: (section: SectionId) => void;
  setSaveStatus: (status: SaveStatus) => void;
  updatePersonalInfo: (field: keyof PersonalInfo, value: string) => void;
  updateSummary: (value: string) => void;
  setSkills: (skills: string[]) => void;
  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  deleteExperience: (id: string) => void;
  moveExperience: (id: string, direction: 'up' | 'down') => void;
  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<EducationItem>) => void;
  deleteEducation: (id: string) => void;
  moveEducation: (id: string, direction: 'up' | 'down') => void;
  addProject: () => void;
  updateProject: (id: string, patch: Partial<ProjectItem>) => void;
  deleteProject: (id: string) => void;
  moveProject: (id: string, direction: 'up' | 'down') => void;
  addLanguage: () => void;
  updateLanguage: (id: string, patch: Partial<LanguageItem>) => void;
  deleteLanguage: (id: string) => void;
  moveLanguage: (id: string, direction: 'up' | 'down') => void;
  addSimpleItem: (section: 'certifications' | 'awards') => void;
  updateSimpleItem: (section: 'certifications' | 'awards', id: string, patch: Partial<SimpleSectionItem>) => void;
  deleteSimpleItem: (section: 'certifications' | 'awards', id: string) => void;
  moveSection: (sectionId: SectionId, direction: 'up' | 'down') => void;
  toggleSectionVisibility: (sectionId: SectionId) => void;
  addOptionalSection: (sectionId: 'certifications' | 'awards') => void;
  removeOptionalSection: (sectionId: 'certifications' | 'awards') => void;
  persist: () => void;
}

const moveItem = <T,>(items: T[], id: string, direction: 'up' | 'down') => {
  const index = items.findIndex((item: any) => item.id === id);
  if (index < 0) return items;
  const nextIndex = direction === 'up' ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
};

const updateItem = <T extends { id: string }>(items: T[], id: string, patch: Partial<T>) =>
  items.map((item) => (item.id === id ? { ...item, ...patch } : item));

const deleteItem = <T extends { id: string }>(items: T[], id: string) => items.filter((item) => item.id !== id);

const applyVisibility = (document: CVDocument, sectionId: SectionId, visible: boolean) => ({
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
  if (saved?.document) return saved.document;
  return createEmptyDocument();
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
  initFromStorage: () => {
    const saved = loadSavedCV();
    if (saved?.document) {
      set({
        document: hydrateDocument(saved),
        activeSection: saved.activeSection ?? 'personalInfo',
        activeExperienceId: saved.activeItemIds.experience ?? null,
        activeEducationId: saved.activeItemIds.education ?? null,
        activeProjectId: saved.activeItemIds.projects ?? null,
        activeLanguageId: saved.activeItemIds.languages ?? null,
        activeSimpleSection: (saved.activeItemIds.simpleSection as 'certifications' | 'awards' | null) ?? null,
        saveStatus: 'loaded',
        savedAt: saved.document.lastUpdatedAt,
        hydrated: true,
      });
      return;
    }
    set({ document: createEmptyDocument(), hydrated: true, saveStatus: 'idle' });
  },
  createNewCV: () => set({ document: createEmptyDocument(), activeSection: 'personalInfo', saveStatus: 'idle' }),
  resetCV: () => {
    clearSavedCV();
    set({ document: createEmptyDocument(), activeSection: 'personalInfo', saveStatus: 'idle', savedAt: null });
  },
  setActiveSection: (section) => set({ activeSection: section }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  updatePersonalInfo: (field, value) =>
    set((state) => ({
      document: withUpdatedTimestamp({
        ...state.document,
        personalInfo: {
          ...state.document.personalInfo,
          [field]: value,
        },
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
  setSkills: (skills) =>
    set((state) => ({
      document: withUpdatedTimestamp({ ...state.document, skills }),
      saveStatus: 'saving',
    })),
  addExperience: () => set((state) => {
    const item = createExperienceItem();
    return { document: withUpdatedTimestamp({ ...state.document, experience: [...state.document.experience, item] }), activeSection: 'experience', activeExperienceId: item.id, saveStatus: 'saving' };
  }),
  updateExperience: (id, patch) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, experience: updateItem(state.document.experience, id, patch) }), activeExperienceId: id, activeSection: 'experience', saveStatus: 'saving' })),
  deleteExperience: (id) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, experience: deleteItem(state.document.experience, id) }), activeExperienceId: state.activeExperienceId === id ? null : state.activeExperienceId, saveStatus: 'saving' })),
  moveExperience: (id, direction) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, experience: moveItem(state.document.experience, id, direction) }), saveStatus: 'saving' })),
  addEducation: () => set((state) => {
    const item = createEducationItem();
    return { document: withUpdatedTimestamp({ ...state.document, education: [...state.document.education, item] }), activeSection: 'education', activeEducationId: item.id, saveStatus: 'saving' };
  }),
  updateEducation: (id, patch) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, education: updateItem(state.document.education, id, patch) }), activeEducationId: id, activeSection: 'education', saveStatus: 'saving' })),
  deleteEducation: (id) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, education: deleteItem(state.document.education, id) }), activeEducationId: state.activeEducationId === id ? null : state.activeEducationId, saveStatus: 'saving' })),
  moveEducation: (id, direction) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, education: moveItem(state.document.education, id, direction) }), saveStatus: 'saving' })),
  addProject: () => set((state) => {
    const item = createProjectItem();
    return { document: withUpdatedTimestamp({ ...state.document, projects: [...state.document.projects, item] }), activeSection: 'projects', activeProjectId: item.id, saveStatus: 'saving' };
  }),
  updateProject: (id, patch) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, projects: updateItem(state.document.projects, id, patch) }), activeProjectId: id, activeSection: 'projects', saveStatus: 'saving' })),
  deleteProject: (id) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, projects: deleteItem(state.document.projects, id) }), activeProjectId: state.activeProjectId === id ? null : state.activeProjectId, saveStatus: 'saving' })),
  moveProject: (id, direction) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, projects: moveItem(state.document.projects, id, direction) }), saveStatus: 'saving' })),
  addLanguage: () => set((state) => {
    const item = createLanguageItem();
    return { document: withUpdatedTimestamp({ ...state.document, languages: [...state.document.languages, item] }), activeSection: 'languages', activeLanguageId: item.id, saveStatus: 'saving' };
  }),
  updateLanguage: (id, patch) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, languages: updateItem(state.document.languages, id, patch) }), activeLanguageId: id, activeSection: 'languages', saveStatus: 'saving' })),
  deleteLanguage: (id) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, languages: deleteItem(state.document.languages, id) }), activeLanguageId: state.activeLanguageId === id ? null : state.activeLanguageId, saveStatus: 'saving' })),
  moveLanguage: (id, direction) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, languages: moveItem(state.document.languages, id, direction) }), saveStatus: 'saving' })),
  addSimpleItem: (section) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, [section]: [...state.document[section], createSimpleItem(section === 'certifications' ? 'New Certification' : 'New Award')] }), activeSection: section, activeSimpleSection: section, saveStatus: 'saving' })),
  updateSimpleItem: (section, id, patch) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, [section]: updateItem(state.document[section], id, patch) }), activeSection: section, activeSimpleSection: section, saveStatus: 'saving' })),
  deleteSimpleItem: (section, id) => set((state) => ({ document: withUpdatedTimestamp({ ...state.document, [section]: deleteItem(state.document[section], id) }), activeSimpleSection: state.activeSimpleSection === section ? null : state.activeSimpleSection, saveStatus: 'saving' })),
  moveSection: (sectionId, direction) => set((state) => {
    const currentIndex = state.document.sectionOrder.indexOf(sectionId);
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.document.sectionOrder.length) return {};
    const nextOrder = [...state.document.sectionOrder];
    [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
    return { document: withUpdatedTimestamp({ ...state.document, sectionOrder: nextOrder }), saveStatus: 'saving' };
  }),
  toggleSectionVisibility: (sectionId) => set((state) => ({ document: withUpdatedTimestamp(applyVisibility(state.document, sectionId, !state.document.sectionVisibility[sectionId])), saveStatus: 'saving' })),
  addOptionalSection: (sectionId) => set((state) => ({ document: withUpdatedTimestamp(applyVisibility(state.document, sectionId, true)), activeSection: sectionId, saveStatus: 'saving' })),
  removeOptionalSection: (sectionId) => set((state) => ({ document: withUpdatedTimestamp(applyVisibility(state.document, sectionId, false)), saveStatus: 'saving' })),
  persist: () => {
    const state = get();
    const payload: SavedCVPayload = {
      version: 1,
      document: state.document,
      activeSection: state.activeSection,
      activeItemIds: {
        experience: state.activeExperienceId,
        education: state.activeEducationId,
        projects: state.activeProjectId,
        languages: state.activeLanguageId,
        simpleSection: state.activeSimpleSection,
      },
    };
    saveCV(payload);
    set({ saveStatus: 'saved', savedAt: new Date().toISOString() });
  },
}));
