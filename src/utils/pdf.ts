import type { ResumeTemplateId } from '../types/cv';

export const exportPreviewAsPdf = async (
  element: HTMLElement | null,
  filename = 'Quick-Free-CV.pdf',
  options?: { templateId?: ResumeTemplateId; mode?: 'standard' | 'ats' },
) => {
  if (!element) {
    throw new Error('PDF preview is not ready yet. Try again in a moment.');
  }

  let html2pdf: typeof import('html2pdf.js').default;
  try {
    ({ default: html2pdf } = await import('html2pdf.js'));
  } catch {
    throw new Error('PDF export is temporarily unavailable. Please refresh and try again.');
  }

  const isCompact = options?.templateId === 'compact' && options?.mode !== 'ats';
  const isModern = options?.templateId === 'modern' && options?.mode !== 'ats';
  const exportMargin: [number, number, number, number] = isCompact ? [5, 4, 5, 4] : [8, 6, 8, 6];
  const canvasScale = isCompact ? 2.1 : isModern ? 2.2 : 2.25;
  const exportWindowWidth = isCompact ? 1120 : 1280;

  const pdfOptions = {
    margin: exportMargin,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: canvasScale,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: exportWindowWidth,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: isCompact
      ? {
          mode: ['css', 'legacy'],
          avoid: ['.resume-section', '.pdf-avoid-break', '.pdf-section-group', 'article'],
        }
      : {
          mode: ['css', 'legacy', 'avoid-all'],
          avoid: ['.resume-section', '.pdf-avoid-break', '.pdf-section-group', 'article', 'li'],
        },
    enableLinks: true,
  };

  element.classList.add('pdf-export');
  try {
    await html2pdf().set(pdfOptions as any).from(element).save();
  } finally {
    element.classList.remove('pdf-export');
  }
};
