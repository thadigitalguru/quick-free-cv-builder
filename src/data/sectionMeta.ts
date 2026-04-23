import type { CVSectionMeta, SectionId } from '../types/cv';

export const sectionDefaults: CVSectionMeta[] = [
  { id: 'personalInfo', label: 'Personal Info', visible: true, optional: false },
  { id: 'summary', label: 'Professional Summary', visible: true, optional: false },
  { id: 'experience', label: 'Experience', visible: true, optional: false },
  { id: 'skills', label: 'Skills', visible: true, optional: false },
  { id: 'projects', label: 'Projects', visible: true, optional: false },
  { id: 'education', label: 'Education', visible: true, optional: false },
  { id: 'languages', label: 'Languages', visible: true, optional: false },
  { id: 'certifications', label: 'Certifications', visible: false, optional: true },
  { id: 'volunteer', label: 'Volunteer Work', visible: false, optional: true },
  { id: 'awards', label: 'Awards', visible: false, optional: true },
  { id: 'interests', label: 'Interests', visible: false, optional: true },
  { id: 'references', label: 'References', visible: false, optional: true },
];

export const defaultOrder: SectionId[] = sectionDefaults.map((section) => section.id);

export const sectionLabelMap = Object.fromEntries(
  sectionDefaults.map((section) => [section.id, section.label]),
) as Record<SectionId, string>;

export const optionalSectionIds = sectionDefaults.filter((section) => section.optional).map((section) => section.id);
