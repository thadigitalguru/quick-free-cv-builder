import type { ResumeTemplateId } from '../types/cv';

export type ExportOptions = { templateId?: ResumeTemplateId; mode?: 'standard' | 'ats' };

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/** Page geometry shared by the PDF export and the page-count estimate, so the two can't drift apart. */
export const getExportGeometry = (options?: ExportOptions) => {
  const isCompact = options?.templateId === 'compact' && options?.mode !== 'ats';
  const margin: [number, number, number, number] = isCompact ? [5, 4, 5, 4] : [8, 6, 8, 6];
  const windowWidth = isCompact ? 1120 : 1280;
  const contentWidthMm = A4_WIDTH_MM - margin[1] - margin[3];
  const pxPerMm = windowWidth / contentWidthMm;
  return { margin, windowWidth, contentWidthMm, pageContentHeightPx: (A4_HEIGHT_MM - margin[0] - margin[2]) * pxPerMm };
};

export const getExportClasses = (mode?: 'standard' | 'ats') => (mode === 'ats' ? ['pdf-export', 'pdf-export-ats'] : ['pdf-export']);
