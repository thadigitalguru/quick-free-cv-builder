import type { ResumeTemplateId } from '../types/cv';

export const exportPreviewAsPdf = async (
  element: HTMLElement | null,
  filename = 'Quick-Free-CV.pdf',
  options?: { templateId?: ResumeTemplateId; mode?: 'standard' | 'ats' },
) => {
  if (!element) {
    throw new Error('PDF preview is not ready yet. Try again in a moment.');
  }

  let jsPDF: typeof import('jspdf').jsPDF;
  try {
    ({ jsPDF } = await import('jspdf'));
  } catch {
    throw new Error('PDF export is temporarily unavailable. Please refresh and try again.');
  }

  const isCompact = options?.templateId === 'compact' && options?.mode !== 'ats';
  const isModern = options?.templateId === 'modern' && options?.mode !== 'ats';
  const exportMargin: [number, number, number, number] = isCompact ? [5, 4, 5, 4] : [8, 6, 8, 6];
  const canvasScale = isCompact ? 2.1 : isModern ? 2.2 : 2.25;
  const exportWindowWidth = isCompact ? 1120 : 1280;

  const autoPaging: 'slice' | 'text' = isCompact ? 'text' : 'slice';
  const pdfOptions: import('jspdf').HTMLOptions = {
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
    autoPaging,
    x: exportMargin[3],
    y: exportMargin[0],
    width: 210 - exportMargin[1] - exportMargin[3],
    windowWidth: exportWindowWidth,
  };

  element.classList.add('pdf-export');
  try {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    await new Promise<void>((resolve, reject) => {
      try {
        pdf.html(element, {
          ...pdfOptions,
          jsPDF: pdf,
          callback: (doc) => {
            doc.save(filename);
            resolve();
          },
        });
      } catch (error) {
        reject(error);
      }
    });
  } finally {
    element.classList.remove('pdf-export');
  }
};
