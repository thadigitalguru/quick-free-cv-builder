import { defaultOrder, sectionDefaults } from '../data/sectionMeta';
import type { CVDocument, ExperienceItem, EducationItem, ProjectItem, LanguageItem, SimpleSectionItem, SectionId } from '../types/cv';
import { createId } from './cvUtils';

const allowedSectionIds = new Set<SectionId>(sectionDefaults.map((section) => section.id));

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const stringValue = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const booleanValue = (value: unknown, fallback = false) => (typeof value === 'boolean' ? value : fallback);

const arrayValue = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const normalizeSectionOrder = (value: unknown): SectionId[] => {
  const incoming = arrayValue<string>(value).filter((item): item is SectionId => allowedSectionIds.has(item as SectionId));
  const merged = [...incoming, ...defaultOrder.filter((sectionId) => !incoming.includes(sectionId))];
  return merged;
};

const normalizeVisibility = (value: unknown): Record<SectionId, boolean> => {
  const incoming = isRecord(value) ? value : {};
  return sectionDefaults.reduce((acc, section) => {
    acc[section.id] = booleanValue(incoming[section.id], section.visible);
    return acc;
  }, {} as Record<SectionId, boolean>);
};

const normalizeExperience = (value: unknown): ExperienceItem[] =>
  arrayValue<ExperienceItem>(value).map((item) => ({
    id: stringValue(item.id, createId()),
    role: stringValue(item.role),
    company: stringValue(item.company),
    location: stringValue(item.location),
    startDate: stringValue(item.startDate),
    endDate: stringValue(item.endDate),
    isCurrent: booleanValue(item.isCurrent),
    achievements: arrayValue<string>(item.achievements).filter((entry) => typeof entry === 'string'),
    technologies: arrayValue<string>(item.technologies).filter((entry) => typeof entry === 'string'),
  }));

const normalizeEducation = (value: unknown): EducationItem[] =>
  arrayValue<EducationItem>(value).map((item) => ({
    id: stringValue(item.id, createId()),
    institution: stringValue(item.institution),
    qualification: stringValue(item.qualification),
    fieldOfStudy: stringValue(item.fieldOfStudy),
    startDate: stringValue(item.startDate),
    endDate: stringValue(item.endDate),
    description: stringValue(item.description),
  }));

const normalizeProjects = (value: unknown): ProjectItem[] =>
  arrayValue<ProjectItem>(value).map((item) => ({
    id: stringValue(item.id, createId()),
    name: stringValue(item.name),
    role: stringValue(item.role),
    date: stringValue(item.date),
    description: stringValue(item.description),
    link: stringValue(item.link),
    technologies: arrayValue<string>(item.technologies).filter((entry) => typeof entry === 'string'),
  }));

const normalizeLanguages = (value: unknown): LanguageItem[] =>
  arrayValue<LanguageItem>(value).map((item) => ({
    id: stringValue(item.id, createId()),
    name: stringValue(item.name),
    proficiency: (['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'] as const).includes(item.proficiency as any)
      ? (item.proficiency as LanguageItem['proficiency'])
      : 'Fluent',
  }));

const normalizeSimpleItems = (value: unknown): SimpleSectionItem[] =>
  arrayValue<SimpleSectionItem>(value).map((item) => ({
    id: stringValue(item.id, createId()),
    title: stringValue(item.title),
    details: stringValue(item.details),
  }));

export const normalizeImportedDocument = (raw: unknown): CVDocument | null => {
  if (!isRecord(raw)) return null;
  const source = isRecord(raw.document) ? raw.document : raw;

  return {
    personalInfo: {
      fullName: stringValue(source.personalInfo && isRecord(source.personalInfo) ? source.personalInfo.fullName : source.fullName),
      jobTitle: stringValue(source.personalInfo && isRecord(source.personalInfo) ? source.personalInfo.jobTitle : source.jobTitle),
      email: stringValue(source.personalInfo && isRecord(source.personalInfo) ? source.personalInfo.email : source.email),
      phone: stringValue(source.personalInfo && isRecord(source.personalInfo) ? source.personalInfo.phone : source.phone),
      location: stringValue(source.personalInfo && isRecord(source.personalInfo) ? source.personalInfo.location : source.location),
      linkedinUrl: stringValue(source.personalInfo && isRecord(source.personalInfo) ? source.personalInfo.linkedinUrl : source.linkedinUrl),
      websiteUrl: stringValue(source.personalInfo && isRecord(source.personalInfo) ? source.personalInfo.websiteUrl : source.websiteUrl),
      profilePhoto: stringValue(source.personalInfo && isRecord(source.personalInfo) ? source.personalInfo.profilePhoto : source.profilePhoto),
      summary: stringValue(source.personalInfo && isRecord(source.personalInfo) ? source.personalInfo.summary : source.summary),
    },
    experience: normalizeExperience(source.experience),
    education: normalizeEducation(source.education),
    skills: arrayValue<string>(source.skills).filter((entry) => typeof entry === 'string'),
    projects: normalizeProjects(source.projects),
    languages: normalizeLanguages(source.languages),
    certifications: normalizeSimpleItems(source.certifications),
    awards: normalizeSimpleItems(source.awards),
    sectionOrder: normalizeSectionOrder(source.sectionOrder),
    sectionVisibility: normalizeVisibility(source.sectionVisibility),
    lastUpdatedAt: typeof source.lastUpdatedAt === 'string' ? source.lastUpdatedAt : new Date().toISOString(),
  };
};
