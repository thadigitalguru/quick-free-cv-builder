/**
 * The small formatting the summary hint promises: **bold** and bullet lines ("- ", "* " or "• ").
 * Everything else stays literal text; nothing here ever becomes HTML.
 */
export type RichSpan = { text: string; bold: boolean };
export type RichBlock = { type: 'paragraph'; spans: RichSpan[] } | { type: 'list'; items: RichSpan[][] };

const bulletLine = /^\s*[-*•]\s+(.*)$/;

export const parseInline = (text: string): RichSpan[] => {
  const spans: RichSpan[] = [];
  // Only a closed pair is bold; a stray "**" stays as typed.
  const pattern = /\*\*(.+?)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index! > last) spans.push({ text: text.slice(last, match.index), bold: false });
    spans.push({ text: match[1], bold: true });
    last = match.index! + match[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), bold: false });
  return spans;
};

export const parseRichText = (text: string): RichBlock[] => {
  const blocks: RichBlock[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const bullet = line.match(bulletLine);
    const previous = blocks[blocks.length - 1];
    if (bullet) {
      if (previous?.type === 'list') previous.items.push(parseInline(bullet[1]));
      else blocks.push({ type: 'list', items: [parseInline(bullet[1])] });
    } else if (previous?.type === 'paragraph') {
      // Consecutive plain lines read as one paragraph, as typed in a textarea.
      previous.spans.push({ text: ' ', bold: false }, ...parseInline(line));
    } else {
      blocks.push({ type: 'paragraph', spans: parseInline(line) });
    }
  }
  return blocks;
};
