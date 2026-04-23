import type { CVDocument, ExperienceItem, ProjectItem } from '../types/cv';

export const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const formatRange = (startDate: string, endDate: string, isCurrent?: boolean) => {
  const start = startDate || 'Start';
  const end = isCurrent ? 'Present' : endDate || 'End';
  return `${start} — ${end}`;
};

export const splitBullets = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const parseCsvList = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const joinCsvList = (items: string[]) => items.join(', ');

export const getVisibleOrder = (document: CVDocument) =>
  document.sectionOrder.filter((sectionId) => document.sectionVisibility[sectionId]);

export const experienceSummary = (item: ExperienceItem) =>
  [item.company, item.location].filter(Boolean).join(' • ');

export const projectSummary = (item: ProjectItem) =>
  [item.role, item.link].filter(Boolean).join(' • ');
