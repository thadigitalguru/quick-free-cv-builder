import { describe, expect, it, vi } from 'vitest';

const htmlCalls: any[] = [];
vi.mock('../src/utils/pdfFonts', () => ({ registerCvFonts: async () => [{ family: 'Noto Sans', weight: 400, ref: { name: 'NotoSans', style: 'normal' } }] }));
vi.mock('jspdf', () => ({
  jsPDF: class {
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
