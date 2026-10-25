import type { ResumeTemplateId } from '../types/cv';

type ExportOptions = { templateId?: ResumeTemplateId; mode?: 'standard' | 'ats' };

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

type PagedPdf = Pick<import('jspdf').jsPDF, 'getNumberOfPages' | 'deletePage'> & { internal: { pages: unknown[] } };

// Text show (Tj/TJ) and image/XObject (Do) operators: a page without any carries no CV content.
const pageHasContent = (pdf: PagedPdf, pageNumber: number) => {
  const stream = pdf.internal.pages[pageNumber];
  return /\b(?:Tj|TJ|Do)\b/.test(Array.isArray(stream) ? stream.join('\n') : String(stream ?? ''));
};

/**
 * jsPDF adds a page whenever a background or border is drawn past the page bottom, even with
 * nothing on it, which left some CVs with a blank last page. Only trailing empty pages are removed.
 */
export const removeTrailingBlankPages = (pdf: PagedPdf) => {
  while (pdf.getNumberOfPages() > 1 && !pageHasContent(pdf, pdf.getNumberOfPages())) {
    pdf.deletePage(pdf.getNumberOfPages());
  }
};

export const exportPreviewAsPdf = async (
  element: HTMLElement | null,
  filename = 'Quick-Free-CV.pdf',
  options?: ExportOptions,
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

  const { margin: exportMargin, windowWidth: exportWindowWidth, contentWidthMm } = getExportGeometry(options);

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
    width: contentWidthMm,
    windowWidth: exportWindowWidth,
  };

  const exportClasses = getExportClasses(options?.mode);
  element.classList.add(...exportClasses);
  try {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    await new Promise<void>((resolve, reject) => {
      try {
        pdf.html(element, {
          ...pdfOptions,
          jsPDF: pdf,
          callback: (doc) => {
            removeTrailingBlankPages(doc as unknown as PagedPdf);
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
