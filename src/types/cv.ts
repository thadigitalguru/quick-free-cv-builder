export type SectionId =
  | 'personalInfo'
  | 'summary'
  | 'experience'
  | 'skills'
  | 'projects'
  | 'education'
  | 'languages'
  | 'certifications'
  | 'awards';

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  websiteUrl: string;
  summary: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  achievements: string[];
  technologies: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  qualification: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  date: string;
  description: string;
  link: string;
  technologies: string[];
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: 'Native' | 'Fluent' | 'Professional' | 'Intermediate' | 'Basic';
}

export interface SimpleSectionItem {
  id: string;
  title: string;
  details: string;
}

export interface CVSectionMeta {
  id: SectionId;
  label: string;
  visible: boolean;
  optional: boolean;
}

export interface CVDocument {
  personalInfo: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  languages: LanguageItem[];
  certifications: SimpleSectionItem[];
  awards: SimpleSectionItem[];
  sectionOrder: SectionId[];
  sectionVisibility: Record<SectionId, boolean>;
  lastUpdatedAt: string;
}

export interface SavedCVPayload {
  version: number;
  document: CVDocument;
  activeSection: SectionId;
  activeItemIds: Record<string, string | null>;
}
