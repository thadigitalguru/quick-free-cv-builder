import { describe, expect, it, vi } from 'vitest';

const htmlCalls: any[] = [];
vi.mock('../src/utils/pdfFonts', () => ({ registerCvFonts: async () => [{ family: 'Noto Sans', weight: 400, ref: { name: 'NotoSans', style: 'normal' } }] }));
vi.mock('jspdf', () => ({
  jsPDF: class {
    text() {}
    getFontSize() {
      return 10;
    }
    html(_element: unknown, options: any) {
      htmlCalls.push(options);
      options.callback({ output: () => new Blob(['%PDF']), getNumberOfPages: () => 1, deletePage: vi.fn(), internal: { pages: [] } });
    }
  },
}));

const fakeElement = () => {
  const classes = new Set<string>();
  const seen: string[][] = [];
  return {
    seen,
    classes,
    element: {
      querySelectorAll: () => [],
      classList: {
        add: (...names: string[]) => {
          names.forEach((name) => classes.add(name));
          seen.push([...classes]);
        },
        remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
      },
    } as unknown as HTMLElement,
  };
};

describe('exportPreviewAsPdf', () => {
  it('lets jsPDF compute its own scale and never slices text lines across pages', async () => {
    const { exportPreviewAsPdf } = await import('../src/utils/pdf');
    for (const templateId of ['classic', 'modern', 'compact'] as const) {
      await exportPreviewAsPdf(fakeElement().element, 'cv.pdf', { templateId, mode: 'standard' });
    }
    // html2canvas.scale overrides jsPDF's width/windowWidth scale and produced blank, 21-page PDFs.
    htmlCalls.forEach((options) => {
      expect(options.html2canvas.scale).toBeUndefined();
      expect(options.autoPaging).toBe('text');
      // margin alone positions the content; x/y would be added on top of it.
      expect([options.x, options.y]).toEqual([0, 0]);
      // Without an embedded Unicode font, names like "Łukasz" export as garbage.
      expect(options.fontFaces[0]).toMatchObject({ family: 'Noto Sans', ref: { name: 'NotoSans' } });
    });
  });

  it('turns off letter-spacing for ATS exports and cleans up afterwards', async () => {
    const { exportPreviewAsPdf } = await import('../src/utils/pdf');
    const { element, seen, classes } = fakeElement();
    await exportPreviewAsPdf(element, 'cv.pdf', { templateId: 'classic', mode: 'ats' });
    expect(seen[0]).toEqual(['pdf-export', 'pdf-export-ats']);
    expect(classes.size).toBe(0);
  });
});

describe('PDF hand-off', () => {
  it('returns the PDF instead of calling jsPDF save(), whose Safari path opens a new tab', async () => {
    const { exportPreviewAsPdf } = await import('../src/utils/pdf');
    const blob = await exportPreviewAsPdf(fakeElement().element, 'cv.pdf', { templateId: 'classic', mode: 'standard' });
    expect(blob).toBeInstanceOf(Blob);
  });

  it('asks iPhone and iPad (including iPadOS posing as a Mac) for a tap to save', async () => {
    const { needsTapToSave } = await import('../src/utils/download');
    const cases: [string, number, boolean][] = [
      ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1', 5, true],
      ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 5, true],
      ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 0, false],
      ['Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36', 5, false],
    ];
    for (const [userAgent, maxTouchPoints, expected] of cases) {
      vi.stubGlobal('navigator', { userAgent, maxTouchPoints });
      expect(needsTapToSave()).toBe(expected);
    }
    vi.unstubAllGlobals();
  });
});

describe('downloadBlob', () => {
  it('relabels the file as binary when forced, so iOS downloads a PDF instead of opening it', async () => {
    const created: Blob[] = [];
    const click = vi.fn();
    vi.stubGlobal('window', { setTimeout: vi.fn() });
    vi.stubGlobal('URL', { createObjectURL: (blob: Blob) => (created.push(blob), 'blob:x'), revokeObjectURL: vi.fn() });
    const link = { click, remove: vi.fn() } as Record<string, unknown>;
    vi.stubGlobal('document', { createElement: () => link, body: { appendChild: vi.fn() } });
    const { downloadBlob } = await import('../src/utils/download');
    const pdf = new Blob(['%PDF'], { type: 'application/pdf' });
    downloadBlob('cv.pdf', pdf);
    downloadBlob('cv.pdf', pdf, { forceDownload: true });
    expect(created.map((blob) => blob.type)).toEqual(['application/pdf', 'application/octet-stream']);
    expect(link.download).toBe('cv.pdf');
    expect(click).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});

describe('addLinkAnnotations', () => {
  const fakePdf = () => {
    let page = 1;
    const links: { page: number; args: unknown[] }[] = [];
    const pdf = {
      text: () => undefined,
      getFontSize: () => 10,
      getCurrentPageInfo: () => ({ pageNumber: page }),
      getTextWidth: (value: string) => value.length,
      setPage: (n: number) => (page = n),
      link: (...args: unknown[]) => links.push({ page, args }),
      goTo: (n: number) => (page = n),
    };
    return { pdf, links };
  };

  it('covers each link where its text was actually drawn, across words, lines and pages', async () => {
    const { addLinkAnnotations, recordTextDraws } = await import('../src/utils/pdf');
    const { pdf, links } = fakePdf();
    const drawn = recordTextDraws(pdf as never);
    const draw = pdf.text as unknown as (text: string, x: number, y: number, options?: { align?: string }) => void;
    draw('Email:', 100, 20);
    draw('a@example.com', 108, 20);
    draw('Phone:', 100, 26);
    draw('+254', 108, 26);
    draw('700', 113, 26);
    draw('000', 117, 26, { align: 'right' });
    pdf.goTo(2);
    draw('linkedin.com/in/a-very-long-', 10, 30);
    draw('handle', 10, 35);
    addLinkAnnotations(pdf as never, drawn, [
      { url: 'mailto:a@example.com', text: 'a@example.com' },
      { url: 'tel:+254700000', text: '+254 700 000' },
      { url: 'https://linkedin.com/in/a-very-long-handle', text: 'linkedin.com/in/a-very-long-handle' },
      { url: 'javascript:alert(1)', text: 'Email:' },
      { url: 'https://not-drawn.example', text: 'not drawn' },
    ]);
    const size = (10 * 25.4) / 72;
    expect(links.map((link) => [link.page, (link.args[4] as { url: string }).url, link.args[0], link.args[2]])).toEqual([
      [1, 'mailto:a@example.com', 108, 13],
      // "000" was right-aligned at x=117, so it starts at 114; the line spans 108..117.
      [1, 'tel:+254700000', 108, 9],
      [2, 'https://linkedin.com/in/a-very-long-handle', 10, 28],
      [2, 'https://linkedin.com/in/a-very-long-handle', 10, 6],
    ]);
    expect(links[0].args[1]).toBeCloseTo(20 - size * 0.9, 5);
  });
});
