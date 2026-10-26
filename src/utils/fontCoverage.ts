import type { CVDocument } from '../types/cv';
import { coveredRanges } from './fontCoverage.generated';

const isCovered = (code: number) => {
  let low = 0;
  let high = coveredRanges.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const [start, end] = coveredRanges[mid];
    if (code < start) high = mid - 1;
    else if (code > end) low = mid + 1;
    else return true;
  }
  return false;
};

// Whitespace and invisible joiners/selectors (parts of emoji sequences) aren't drawn themselves.
const isInvisible = (code: number) => code < 0x20 || code === 0x200d || (code >= 0xfe00 && code <= 0xfe0f);

const collectText = (value: unknown, out: string[], key?: string) => {
  if (key === 'profilePhoto' || key === 'id') return;
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectText(item, out));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([childKey, child]) => collectText(child, out, childKey));
};

/**
 * Characters in the CV that the PDF font can't draw (they'd come out blank), in first-seen order.
 * Covers Latin incl. accents, Greek, Cyrillic and Vietnamese; not Arabic, CJK, Indic scripts or emoji.
 */
export const findUnsupportedCharacters = (document: CVDocument) => {
  const texts: string[] = [];
  collectText(document, texts);
  const missing = new Set<string>();
  for (const text of texts) {
    for (const char of text) {
      const code = char.codePointAt(0)!;
      if (!isInvisible(code) && !isCovered(code)) missing.add(char);
    }
  }
  return [...missing];
};
