import type { CVDocument, ExperienceItem, ProjectItem } from '../types/cv';

export const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Formats only the dates the user entered; returns '' when there are none so nothing is invented. */
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2021-03" → "Mar 2021" for the CV; a year, or anything else typed, is shown as entered. */
export const formatDate = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  return match ? `${monthNames[Number(match[2]) - 1]} ${match[1]}` : trimmed;
};

/** Only the dates the user entered, readable ("Mar 2021 – Present"); never adds precision. */
export const formatRange = (startDate: string, endDate: string, isCurrent?: boolean) => {
  const start = formatDate(startDate);
  const end = isCurrent ? 'Present' : formatDate(endDate);
  return [start, end].filter(Boolean).join(' – ');
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
