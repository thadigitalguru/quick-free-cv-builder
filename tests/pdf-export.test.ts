import { describe, expect, it, vi } from 'vitest';

const htmlCalls: any[] = [];
vi.mock('jspdf', () => ({
  jsPDF: class {
    html(_element: unknown, options: any) {
      htmlCalls.push(options);
      options.callback({ save: vi.fn(), getNumberOfPages: () => 1, deletePage: vi.fn(), internal: { pages: [] } });
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
