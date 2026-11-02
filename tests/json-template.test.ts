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

  it('restores the CV colour saved with the document, and ignores anything that is not a colour', async () => {
    const result = await buildImportedDocument(jsonFile(serializeCvJson(document, 'banner', '#0f766e')));
    expect(result).toMatchObject({ templateId: 'banner', accentColor: '#0f766e' });
    expect(result!.document).toEqual(document);
    const unsafe = await buildImportedDocument(jsonFile(JSON.stringify({ ...document, accentColor: 'red; background:url(x)' })));
    expect(unsafe!.accentColor).toBeUndefined();
    expect(JSON.parse(serializeCvJson(document, 'classic', null))).not.toHaveProperty('accentColor');
  });

  it('ignores an unknown template value', async () => {
    const result = await buildImportedDocument(jsonFile(JSON.stringify({ ...document, templateId: 'neon' })));
    expect(result!.templateId).toBeUndefined();
  });
});
