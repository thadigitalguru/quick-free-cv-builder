import type { CVDocument, ResumeTemplateId } from '../types/cv';
import { downloadTextFile } from './download';

// Control characters are exactly what file names must not contain, so the regex has to match them.
// eslint-disable-next-line no-control-regex
const invalidFilenameChars = /[<>:"/\\|?*\x00-\x1F]/g;

export const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(invalidFilenameChars, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s-]+|[.\s-]+$/g, '') || 'Quick-Free-CV';

export const buildCvFileName = (document: CVDocument, extension: 'json' | 'pdf') => {
  const baseName = sanitizeFileName(document.personalInfo.fullName || 'Quick-Free-CV');
  return `${baseName}.${extension}`;
};

/** The JSON backup is the document plus the chosen template and colour, so a round trip restores the same look. */
export const serializeCvJson = (document: CVDocument, templateId?: ResumeTemplateId, accentColor?: string | null) =>
  JSON.stringify({ ...document, ...(templateId ? { templateId } : {}), ...(accentColor ? { accentColor } : {}) }, null, 2);

export const downloadCvJson = (document: CVDocument, templateId?: ResumeTemplateId, accentColor?: string | null) => {
  downloadTextFile(buildCvFileName(document, 'json'), serializeCvJson(document, templateId, accentColor), 'application/json;charset=utf-8');
};
