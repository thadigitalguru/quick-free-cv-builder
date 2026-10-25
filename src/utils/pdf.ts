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
  const exportMargin: [number, number, number, number] = isCompact ? [5, 4, 5, 4] : [8, 6, 8, 6];
  const exportWindowWidth = isCompact ? 1120 : 1280;

  // 'text' moves a line that would straddle a page break onto the next page; 'slice' cuts it in half.
  const autoPaging = 'text' as const;
  const pdfOptions: import('jspdf').HTMLOptions = {
    margin: exportMargin,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    // Don't pass html2canvas.scale: jsPDF.html() uses it in place of its own mm-per-px scale
    // (width / windowWidth), which blows the layout up ~14x and leaves every page blank.
    html2canvas: {
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

  const exportClasses = options?.mode === 'ats' ? ['pdf-export', 'pdf-export-ats'] : ['pdf-export'];
  element.classList.add(...exportClasses);
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
    element.classList.remove(...exportClasses);
  }
};
