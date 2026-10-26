import { describe, expect, it } from 'vitest';
import { countPages } from '../src/utils/pageCount';
import { getExportGeometry } from '../src/utils/pdf';

describe('page count', () => {
  const { pageContentHeightPx } = getExportGeometry({ templateId: 'classic', mode: 'standard' });

  it('uses the same A4 geometry as the PDF export', () => {
    // 281mm of usable height at 1280px across 198mm.
    expect(pageContentHeightPx).toBeCloseTo((281 * 1280) / 198, 5);
    expect(getExportGeometry({ templateId: 'compact', mode: 'standard' }).windowWidth).toBe(1120);
    // ATS export ignores Compact's tighter margins.
    expect(getExportGeometry({ templateId: 'compact', mode: 'ats' }).windowWidth).toBe(1280);
  });

  it('counts whole pages without adding one for rounding', () => {
    expect(countPages(0, pageContentHeightPx)).toBe(1);
    expect(countPages(pageContentHeightPx + 2, pageContentHeightPx)).toBe(1);
    expect(countPages(pageContentHeightPx + 40, pageContentHeightPx)).toBe(2);
    expect(countPages(pageContentHeightPx * 2.5, pageContentHeightPx)).toBe(3);
  });
});

describe('text paging (jsPDF autoPaging "text")', () => {
  it('pushes a line that straddles a page break, and everything after it', async () => {
    const { textPagingShift } = await import('../src/utils/pageCount');
    // Page height 100: the second line (95–105) crosses the break, so it moves down 5.
    expect(textPagingShift([{ top: 80, bottom: 90 }, { top: 95, bottom: 105 }, { top: 110, bottom: 120 }], 100)).toBe(5);
    // Lines that fit never move anything.
    expect(textPagingShift([{ top: 0, bottom: 10 }, { top: 88, bottom: 100 }], 100)).toBe(0);
    // Shifts accumulate across pages: 95 → 100 (+5); then 192+5=197 crosses 200 → +3.
    expect(textPagingShift([{ top: 95, bottom: 105 }, { top: 192, bottom: 202 }], 100)).toBe(8);
  });
});
