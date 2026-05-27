import { describe, expect, it } from 'vitest';
import { parseImportedText } from '../src/utils/importText';

describe('parseImportedText', () => {
  it('extracts core details and skills from plain text resumes', () => {
    const parsed = parseImportedText(`Jane Doe\nSenior Product Designer\njane@example.com\n+1 234 567 890\nhttps://linkedin.com/in/janedoe\nhttps://janedoe.dev\n\nSkills\nFigma, Accessibility, Product Strategy, Design Systems\n\nSummary\nDesigning humane products that improve conversion and trust.`);

    expect(parsed.fullName).toBe('Jane Doe');
    expect(parsed.email).toBe('jane@example.com');
    expect(parsed.phone).toContain('+1 234 567 890');
    expect(parsed.linkedinUrl).toContain('linkedin.com/in/janedoe');
    expect(parsed.websiteUrl).toContain('janedoe.dev');
    expect(parsed.skills).toEqual(expect.arrayContaining(['Figma', 'Accessibility', 'Product Strategy', 'Design Systems']));
  });
});
