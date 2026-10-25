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
