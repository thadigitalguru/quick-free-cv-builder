import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS build script
import { fontFiles, readCoverage, toRanges } from '../scripts/font-coverage.mjs';
import { coveredRanges } from '../src/utils/fontCoverage.generated';
import { findUnsupportedCharacters } from '../src/utils/fontCoverage';
import { normalizeImportedDocument } from '../src/utils/importDocument';

describe('PDF font coverage', () => {
  it('matches the fonts actually embedded in the PDF', () => {
    const [regular, bold] = fontFiles.map((url: URL) => readCoverage(fs.readFileSync(url)));
    const shared = new Set([...regular].filter((code) => bold.has(code)));
    // If this fails, the fonts changed: run `node scripts/font-coverage.mjs`.
    expect(toRanges(shared)).toEqual(coveredRanges);
  });

  it('accepts accented Latin, Greek, Cyrillic and Vietnamese names', () => {
    const cv = normalizeImportedDocument({ personalInfo: { fullName: 'Łukasz Żółć-Nguyễn', location: 'Kraków, İstanbul, Москва, Αθήνα' }, experience: [{ role: 'Inginer', company: 'Şantier SRL', achievements: ['Saved €200k — “fast”'] }] })!;
    expect(findUnsupportedCharacters(cv)).toEqual([]);
  });

  it('lists characters the PDF would leave blank, once each, ignoring the photo', () => {
    const cv = normalizeImportedDocument({
      personalInfo: { fullName: 'Ana', summary: 'Growth → 2x ✓ 🚀🚀', profilePhoto: 'data:image/png;base64,→→' },
      experience: [{ role: '工程师', achievements: ['مرحبا'] }],
    })!;
    expect(findUnsupportedCharacters(cv)).toEqual(['→', '✓', '🚀', '工', '程', '师', 'م', 'ر', 'ح', 'ب', 'ا']);
  });
});
