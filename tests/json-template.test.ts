import { describe, expect, it } from 'vitest';
import { serializeCvJson } from '../src/utils/export';
import { buildImportedDocument } from '../src/utils/importFile';
import { normalizeImportedDocument } from '../src/utils/importDocument';

const jsonFile = (content: string) => new File([content], 'cv.json', { type: 'application/json' });

describe('JSON backup template', () => {
  const document = normalizeImportedDocument({ personalInfo: { fullName: 'Jane Doe' }, skills: ['Excel'] })!;

  it('restores the template saved with the document', async () => {
    const result = await buildImportedDocument(jsonFile(serializeCvJson(document, 'modern')));
    expect(result!.templateId).toBe('modern');
    expect(result!.document).toEqual(document);
  });

  it('still imports older backups that have no template', async () => {
    const result = await buildImportedDocument(jsonFile(serializeCvJson(document)));
    expect(result!.templateId).toBeUndefined();
    expect(result!.document.personalInfo.fullName).toBe('Jane Doe');
  });

  it('ignores an unknown template value', async () => {
    const result = await buildImportedDocument(jsonFile(JSON.stringify({ ...document, templateId: 'neon' })));
    expect(result!.templateId).toBeUndefined();
  });
});
