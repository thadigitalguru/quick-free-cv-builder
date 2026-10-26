import { describe, expect, it, vi } from 'vitest';

// What pdf.js and mammoth actually throw for damaged, locked and empty files.
const named = (name: string, message: string) => Object.assign(new Error(message), { name });
let pdfFailure: Error = named('InvalidPDFException', 'Invalid PDF structure.');
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  // Like pdf.js: the data is transferred to the worker, which detaches (empties) the buffer.
  getDocument: ({ data }: { data: ArrayBuffer }) => {
    data.transfer?.();
    return { promise: Promise.reject(pdfFailure) };
  },
}));
vi.mock('mammoth', () => ({ default: { extractRawText: () => Promise.reject(new Error("Corrupted zip: can't find end of central directory")) } }));

const file = (name: string, bytes: string, type: string) => new File([bytes], name, { type });

describe('import errors people can act on', () => {
  it('explains a password-protected PDF instead of "No password given"', async () => {
    pdfFailure = named('PasswordException', 'No password given');
    const { buildImportedDocument, ImportError } = await import('../src/utils/importFile');
    const error = await buildImportedDocument(file('cv.pdf', '%PDF-1.7', 'application/pdf')).catch((caught) => caught);
    expect(error).toBeInstanceOf(ImportError);
    expect(error.message).toMatch(/cv\.pdf is password-protected.*without a password/);
  });

  it('explains damaged and empty PDFs instead of "Invalid PDF structure."', async () => {
    const { buildImportedDocument } = await import('../src/utils/importFile');
    pdfFailure = named('InvalidPDFException', 'Invalid PDF structure.');
    await expect(buildImportedDocument(file('cv.pdf', 'garbage', 'application/pdf'))).rejects.toThrow(/couldn't be read as a PDF; it may be damaged/);
    pdfFailure = named('InvalidPDFException', 'The PDF file is empty, i.e. its size is zero bytes.');
    await expect(buildImportedDocument(file('cv.pdf', '', 'application/pdf'))).rejects.toThrow(/is empty \(0 bytes\)/);
  });

  it('explains a broken or renamed Word file instead of zip internals', async () => {
    const { buildImportedDocument } = await import('../src/utils/importFile');
    await expect(
      buildImportedDocument(file('cv.docx', 'PK not a zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
    ).rejects.toThrow(/couldn't be opened as a Word document.*older \.doc/);
  });
});
