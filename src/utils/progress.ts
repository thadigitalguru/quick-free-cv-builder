import type { CVDocument, SectionId } from '../types/cv';

export type SectionStatus = 'complete' | 'empty';

/** The sections every CV needs; everything else is optional. */
export const essentialSections: SectionId[] = ['personalInfo', 'experience', 'education', 'skills'];

const hasText = (value: string) => value.trim().length > 0;

export const getSectionStatus = (document: CVDocument, sectionId: SectionId): SectionStatus => {
  const done = (() => {
    switch (sectionId) {
      case 'personalInfo':
        return hasText(document.personalInfo.fullName) && hasText(document.personalInfo.email);
      case 'summary':
        return hasText(document.personalInfo.summary);
      case 'experience':
        return document.experience.some((item) => hasText(item.role) || hasText(item.company));
      case 'education':
        return document.education.some((item) => hasText(item.institution) || hasText(item.qualification));
      case 'projects':
        return document.projects.some((item) => hasText(item.name));
      case 'languages':
        return document.languages.some((item) => hasText(item.name));
      case 'skills':
      case 'interests':
        return document[sectionId].length > 0;
      default:
        return document[sectionId].some((item) => hasText(item.title));
    }
  })();
  return done ? 'complete' : 'empty';
};

export const getEssentialProgress = (document: CVDocument) => {
  const remaining = essentialSections.filter((sectionId) => getSectionStatus(document, sectionId) !== 'complete');
  return { done: essentialSections.length - remaining.length, total: essentialSections.length, next: remaining[0] ?? null };
};

const allSections: SectionId[] = ['personalInfo', 'summary', 'experience', 'education', 'projects', 'languages', 'skills', 'certifications', 'volunteer', 'awards', 'interests', 'references'];

/** True when replacing this document would lose something the user typed. */
export const documentHasContent = (document: CVDocument) =>
  Object.values(document.personalInfo).some((value) => typeof value === 'string' && hasText(value)) ||
  allSections.some((sectionId) => getSectionStatus(document, sectionId) === 'complete');
