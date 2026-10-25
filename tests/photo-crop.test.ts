import { describe, expect, it } from 'vitest';
import { getCropRect } from '../src/utils/photoCrop';

describe('getCropRect', () => {
  it('uses the largest centred square at zoom 1', () => {
    expect(getCropRect(800, 600, { zoom: 1, x: 50, y: 50 })).toEqual({ sx: 100, sy: 0, size: 600 });
  });

  it('zooms into a smaller square and slides it to the chosen edge', () => {
    expect(getCropRect(800, 600, { zoom: 2, x: 0, y: 0 })).toEqual({ sx: 0, sy: 0, size: 300 });
    expect(getCropRect(800, 600, { zoom: 2, x: 100, y: 100 })).toEqual({ sx: 500, sy: 300, size: 300 });
  });

  it('never leaves the image, even for out-of-range saved values', () => {
    // Older drafts allowed zoom 0.8, which showed empty space around the photo.
    const rect = getCropRect(400, 400, { zoom: 0.8, x: 140, y: -20 });
    expect(rect).toEqual({ sx: 0, sy: 0, size: 400 });
    const nan = getCropRect(400, 400, { zoom: Number.NaN, x: Number.NaN, y: 50 });
    expect(nan.size).toBe(400);
  });
});
