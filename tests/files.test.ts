import { describe, expect, it } from 'vitest';
import { fitWithin } from '../src/utils/files';

describe('fitWithin', () => {
  it('shrinks large photos to the max side and keeps aspect ratio', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 600, height: 450 });
    expect(fitWithin(1080, 1920)).toEqual({ width: 338, height: 600 });
  });

  it('never enlarges small photos', () => {
    expect(fitWithin(300, 200)).toEqual({ width: 300, height: 200 });
  });
});
