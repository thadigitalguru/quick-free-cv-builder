import { describe, expect, it } from 'vitest';
import { parseInline, parseRichText } from '../src/utils/richText';

describe('summary formatting', () => {
  it('turns **text** into bold and leaves everything else as typed', () => {
    expect(parseInline('I build **reliable** data platforms')).toEqual([
      { text: 'I build ', bold: false },
      { text: 'reliable', bold: true },
      { text: ' data platforms', bold: false },
    ]);
    // An unclosed pair, single asterisks and markup stay literal text.
    expect(parseInline('5 ** 2 and *maybe* <b>x</b>')).toEqual([{ text: '5 ** 2 and *maybe* <b>x</b>', bold: false }]);
  });

  it('groups -, * and • lines into one list and joins plain lines into a paragraph', () => {
    expect(parseRichText('Analyst with 6 years\nin fintech.\n- Led **3** migrations\n* Mentored 4 engineers\n• Spoke at PyCon\n\nOpen to remote roles.')).toEqual([
      { type: 'paragraph', spans: [{ text: 'Analyst with 6 years', bold: false }, { text: ' ', bold: false }, { text: 'in fintech.', bold: false }] },
      {
        type: 'list',
        items: [
          [{ text: 'Led ', bold: false }, { text: '3', bold: true }, { text: ' migrations', bold: false }],
          [{ text: 'Mentored 4 engineers', bold: false }],
          [{ text: 'Spoke at PyCon', bold: false }],
        ],
      },
      { type: 'paragraph', spans: [{ text: 'Open to remote roles.', bold: false }] },
    ]);
  });

  it('does not treat a hyphenated word or a dash mid-line as a bullet', () => {
    expect(parseRichText('-5% churn\nCost - benefit')).toEqual([
      { type: 'paragraph', spans: [{ text: '-5% churn', bold: false }, { text: ' ', bold: false }, { text: 'Cost - benefit', bold: false }] },
    ]);
  });
});
