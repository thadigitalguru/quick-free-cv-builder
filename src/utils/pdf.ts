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

type TextPdf = Pick<import('jspdf').jsPDF, 'getFontSize' | 'getCurrentPageInfo' | 'getTextWidth' | 'setPage' | 'link'> & {
  text: (...args: never[]) => unknown;
};

export type DrawnText = { page: number; text: string; x: number; baseline: number; width: number; sizeMm: number };

/**
 * Records every text fragment jsPDF draws, with its final page and position. Links are placed from
 * this rather than from a predicted layout: jsPDF's 'text' paging shifts whatever it draws after a
 * page break, and html2canvas doesn't draw in document order, so predictions drifted off the text.
 */
export const recordTextDraws = (pdf: TextPdf) => {
  const drawn: DrawnText[] = [];
  const original = pdf.text.bind(pdf) as (text: string | string[], x: number, y: number, options?: { align?: string }, ...rest: unknown[]) => unknown;
  (pdf as { text: unknown }).text = (text: string | string[], x: number, y: number, options?: { align?: string }, ...rest: unknown[]) => {
    const value = Array.isArray(text) ? text.join(' ') : String(text);
    const width = pdf.getTextWidth(value);
    const left = options?.align === 'right' ? x - width : options?.align === 'center' ? x - width / 2 : x;
    drawn.push({ page: pdf.getCurrentPageInfo().pageNumber, text: value, x: left, baseline: y, width, sizeMm: (pdf.getFontSize() * 25.4) / 72 });
    return original(text, x, y, options, ...rest);
  };
  return drawn;
};

const squash = (value: string) => value.replace(/\s+/g, '');

/**
 * jsPDF draws <a> elements as plain text, so email, phone, LinkedIn and portfolio links weren't
 * clickable. Finds each link's text among the drawn fragments and covers each of its lines.
 */
export const addLinkAnnotations = (pdf: TextPdf, drawn: DrawnText[], links: { url: string; text: string }[]) => {
  const used = new Set<number>();
  for (const { url, text } of links) {
    const target = squash(text);
    if (!target || !/^(https?:|mailto:|tel:)/i.test(url)) continue;
    let match: number[] | null = null;
    for (let start = 0; start < drawn.length && !match; start += 1) {
      if (used.has(start)) continue;
      let joined = '';
      for (let end = start; end < drawn.length; end += 1) {
        joined += squash(drawn[end].text);
        if (joined === target) {
          match = Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
          break;
        }
        if (!target.startsWith(joined)) break;
      }
    }
    if (!match) continue;
    match.forEach((index) => used.add(index));
    // One rectangle per line (a long URL can wrap).
    const lines = new Map<string, DrawnText[]>();
    for (const index of match) {
      const piece = drawn[index];
      const key = `${piece.page}:${piece.baseline.toFixed(2)}`;
      lines.set(key, [...(lines.get(key) ?? []), piece]);
    }
    for (const pieces of lines.values()) {
      const left = Math.min(...pieces.map((piece) => piece.x));
      const right = Math.max(...pieces.map((piece) => piece.x + piece.width));
      const size = Math.max(...pieces.map((piece) => piece.sizeMm));
      pdf.setPage(pieces[0].page);
      pdf.link(left, pieces[0].baseline - size * 0.9, right - left, size * 1.15, { url });
    }
  }
};

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

/** Renders the preview as a PDF and returns it; the caller decides how to hand it to the user. */
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
  } catch (error) {
    // Usually a deploy replaced the chunk; describeError turns that into "reload to continue".
    throw error instanceof Error ? error : new Error('PDF export is temporarily unavailable. Please refresh and try again.');
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
    // jsPDF adds x/y on top of `margin`, which doubled the left margin (the CV sat 6 mm right of
    // centre) and the first page's top margin (page 1 held 8 mm less than the rest).
    x: 0,
    y: 0,
    width: contentWidthMm,
    windowWidth: exportWindowWidth,
  };

  const exportClasses = getExportClasses(options?.mode);
  element.classList.add(...exportClasses);
  try {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const { registerCvFonts } = await import('./pdfFonts');
    const fontFaces = await registerCvFonts(pdf);
    const links = [...element.querySelectorAll('a[href]')].map((anchor) => ({ url: anchor.getAttribute('href') ?? '', text: anchor.textContent ?? '' }));
    const drawn = recordTextDraws(pdf as unknown as TextPdf);
    // The preview must have finished loading the same font, or text is measured with a fallback.
    await globalThis.document?.fonts?.ready;
    return await new Promise<Blob>((resolve, reject) => {
      try {
        pdf.html(element, {
          ...pdfOptions,
          fontFaces,
          jsPDF: pdf,
          callback: (doc) => {
            removeTrailingBlankPages(doc as unknown as PagedPdf);
            addLinkAnnotations(doc as unknown as TextPdf, drawn, links);
            // Not doc.save(): its Safari path opens the PDF in a new tab instead of downloading it.
            resolve(doc.output('blob'));
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
