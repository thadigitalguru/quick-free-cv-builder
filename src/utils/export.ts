import type { CVDocument } from '../types/cv';
import { downloadTextFile } from './download';

const invalidFilenameChars = /[<>:"/\\|?*\x00-\x1F]/g;

export const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(invalidFilenameChars, '-')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')
    .replace(/^[-.\s]+|[-.\s]+$/g, '') || 'Quick-Free-CV';

export const buildCvFileName = (document: CVDocument, extension: 'json' | 'pdf') => {
  const baseName = sanitizeFileName(document.personalInfo.fullName || 'Quick-Free-CV');
  return `${baseName}.${extension}`;
};

export const downloadCvJson = (document: CVDocument) => {
  downloadTextFile(buildCvFileName(document, 'json'), JSON.stringify(document, null, 2), 'application/json;charset=utf-8');
};
