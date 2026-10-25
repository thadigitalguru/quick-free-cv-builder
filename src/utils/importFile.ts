import { parseImportedText } from './importText';
import { normalizeImportedDocument } from './importDocument';
import type { CVDocument, ResumeTemplateId, SectionId } from '../types/cv';
import { prepareProfilePhoto } from './files';

export type ImportProgressCallback = (message: string) => void;

export type ImportSourceKind = 'json' | 'pdf' | 'docx' | 'text' | 'image';

export interface ImportReport {
  fileName: string;
  sourceKind: ImportSourceKind;
  /** What ended up in the CV, e.g. { label: 'Experience', count: 3 }. */
  found: { label: string; count: number }[];
  /** Limits and guesses the user should know about before relying on the import. */
  warnings: string[];
  /** Text that was read from the file but not placed into any field. */
  unplaced: string[];
}

export interface ImportResult {
  document: CVDocument;
  report: ImportReport;
  /** Template saved in a JSON backup, if any. */
  templateId?: ResumeTemplateId;
}

const templateIds: ResumeTemplateId[] = ['classic', 'modern', 'compact'];

export const MAX_PDF_PAGES = 20;

const cvKeys = ['personalInfo', 'experience', 'education', 'skills', 'projects', 'languages', 'fullName', 'document'];

/** Thrown for files we can read but can't honestly turn into a CV; the message is user-facing. */
export class ImportError extends Error {}

interface PdfTextItem {
  str: string;
  hasEOL?: boolean;
  transform?: number[];
  width?: number;
}

/** Rebuilds line breaks from pdf.js text items so section headings and bullets survive extraction. */
export const pdfItemsToText = (items: PdfTextItem[]) => {
  let output = '';
  let lastY: number | null = null;
  let lastRight: number | null = null;
  items.forEach((item) => {
    // pdf.js also emits marked-content markers without text.
    if (typeof item.str !== 'string') return;
    const x = item.transform?.[4];
    const y = item.transform?.[5];
    if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2 && !output.endsWith('\n')) {
      output += '\n';
    } else if (lastRight !== null && x !== undefined && x - lastRight > 1 && output && !/\s$/.test(output) && !/^\s/.test(item.str)) {
      output += ' ';
    }
    output += item.str;
    if (item.hasEOL) output += '\n';
    if (y !== undefined) lastY = y;
    lastRight = x !== undefined && item.width !== undefined ? x + item.width : null;
  });
  return output;
};

const detectKind = (file: File): ImportSourceKind => {
  const lowerName = file.name.toLowerCase();
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) return 'pdf';
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerName.endsWith('.docx')) return 'docx';
  if (file.type === 'application/json' || lowerName.endsWith('.json')) return 'json';
  return 'text';
};

export const readImportedFile = async (file: File, onProgress?: ImportProgressCallback) => {
  const kind = detectKind(file);
  const warnings: string[] = [];

  if (kind === 'image') {
    onProgress?.('Preparing image preview…');
    return { kind, text: '', dataUrl: await prepareProfilePhoto(file), warnings };
  }

  if (kind === 'pdf') {
    onProgress?.('Extracting text from PDF…');
    const { text, pageCount, pagesRead } = await extractPdfText(file);
    if (pageCount > pagesRead) warnings.push(`Only the first ${pagesRead} of ${pageCount} pages were read.`);
    if (text.replace(/\s/g, '').length < 40 * pagesRead) {
      if (text.replace(/\s/g, '').length < 40) {
        throw new ImportError(
          `${file.name} looks like a scanned or image-only PDF, so there is no selectable text to read. This app doesn't run OCR (that would mean uploading your CV or a large download). Export a text-based PDF or DOCX from the original, or type your details in.`,
        );
      }
      warnings.push('Very little text was found. Parts of this PDF may be scanned images, which cannot be read.');
    }
    return { kind, text, dataUrl: '', warnings };
  }

  if (kind === 'docx') {
    onProgress?.('Extracting text from DOCX…');
    const { default: mammoth } = await import('mammoth');
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    warnings.push('Text in DOCX headers and footers is not read.');
    return { kind, text: result.value, dataUrl: '', warnings };
  }

  onProgress?.('Reading text file…');
  return { kind, text: await file.text(), dataUrl: '', warnings };
};

const countFound = (document: CVDocument): ImportReport['found'] => {
  const { personalInfo } = document;
  const contactCount = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedinUrl, personalInfo.websiteUrl].filter(Boolean).length;
  const rows: ImportReport['found'] = [
    { label: 'Name', count: personalInfo.fullName ? 1 : 0 },
    { label: 'Job title', count: personalInfo.jobTitle ? 1 : 0 },
    { label: 'Contact details', count: contactCount },
    { label: 'Profile photo', count: personalInfo.profilePhoto ? 1 : 0 },
    { label: 'Summary', count: personalInfo.summary ? 1 : 0 },
    { label: 'Experience', count: document.experience.length },
    { label: 'Education', count: document.education.length },
    { label: 'Skills', count: document.skills.length },
    { label: 'Projects', count: document.projects.length },
    { label: 'Languages', count: document.languages.length },
    { label: 'Certifications', count: document.certifications.length },
    { label: 'Volunteer work', count: document.volunteer.length },
    { label: 'Awards', count: document.awards.length },
    { label: 'Interests', count: document.interests.length },
    { label: 'References', count: document.references.length },
  ];
  return rows.filter((row) => row.count > 0);
};

const optionalSectionsWithContent = (document: CVDocument): SectionId[] =>
  (['certifications', 'volunteer', 'awards', 'interests', 'references'] as const).filter((sectionId) => document[sectionId].length > 0);

const importJson = (text: string, fileName: string): ImportResult | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const isCvShaped = typeof parsed === 'object' && parsed !== null && cvKeys.some((key) => key in (parsed as Record<string, unknown>));
  if (!isCvShaped) {
    throw new ImportError(`${fileName} is JSON, but it isn't a CV exported from this app, so nothing was imported.`);
  }
  const document = normalizeImportedDocument(parsed);
  if (!document) return null;
  const record = parsed as Record<string, unknown>;
  const rawTemplate = record.templateId ?? (record.document as Record<string, unknown> | undefined)?.templateId;
  const templateId = templateIds.find((id) => id === rawTemplate);
  return { document, templateId, report: { fileName, sourceKind: 'json', found: countFound(document), warnings: [], unplaced: [] } };
};

export const buildImportedDocument = async (file: File, onProgress?: ImportProgressCallback): Promise<ImportResult | null> => {
  onProgress?.('Reading file…');
  const imported = await readImportedFile(file, onProgress);

  if (imported.kind === 'image') {
    onProgress?.('Using image as profile photo…');
    const document = normalizeImportedDocument({ personalInfo: { profilePhoto: imported.dataUrl } })!;
    return {
      document,
      report: {
        fileName: file.name,
        sourceKind: 'image',
        found: countFound(document),
        warnings: ['Images are only used as a profile photo. Text in the image is not read.'],
        unplaced: [],
      },
    };
  }

  const text = imported.text.trim();
  if (!text) return null;

  if (imported.kind === 'json' || text.startsWith('{')) {
    onProgress?.('Checking for JSON export…');
    const result = importJson(text, file.name);
    if (result) return result;
    if (imported.kind === 'json') throw new ImportError(`${file.name} isn't valid JSON, so nothing was imported.`);
  }

  onProgress?.('Extracting resume text…');
  const parsed = parseImportedText(text);
  const document = normalizeImportedDocument({
    personalInfo: {
      fullName: parsed.fullName,
      jobTitle: parsed.jobTitle,
      summary: parsed.summary,
      email: parsed.email,
      phone: parsed.phone,
      location: parsed.location,
      linkedinUrl: parsed.linkedinUrl,
      websiteUrl: parsed.websiteUrl,
    },
    experience: parsed.experience,
    education: parsed.education,
    projects: parsed.projects,
    languages: parsed.languages,
    certifications: parsed.certifications,
    volunteer: parsed.volunteer,
    awards: parsed.awards,
    interests: parsed.interests,
    references: parsed.references,
    skills: parsed.skills,
  });
  if (!document) return null;

  const found = countFound(document);
  if (!found.length) return null;

  optionalSectionsWithContent(document).forEach((sectionId) => {
    document.sectionVisibility[sectionId] = true;
  });

  return {
    document,
    report: {
      fileName: file.name,
      sourceKind: imported.kind,
      found,
      warnings: [
        ...imported.warnings,
        'Fields were filled by matching headings like "Experience" and "Education". Check each section, especially role and company order.',
        ...parsed.notes,
      ],
      unplaced: parsed.unplaced,
    },
  };
};

async function extractPdfText(file: File) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pagesRead = Math.min(pdf.numPages, MAX_PDF_PAGES);
  let text = '';
  for (let index = 1; index <= pagesRead; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    text += `${pdfItemsToText(content.items as PdfTextItem[])}\n`;
  }
  return { text, pageCount: pdf.numPages, pagesRead };
}
