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
  /** Structure-only details for the opt-in "Copy import details"; never contains CV text. */
  diagnostics?: ImportDiagnostics;
}

export interface ImportDiagnostics {
  format: 1;
  source: ImportSourceKind;
  /** Rounded, so the exact file can't be matched by size. */
  sizeKb: number;
  pages?: number;
  pagesRead?: number;
  twoColumnPages?: number;
  found: Record<string, number>;
  unplacedLines: number;
  warnings: number;
  text: import('./importText').ImportTextDiagnostics;
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

type PlacedItem = PdfTextItem & { transform: number[]; width: number };

const looksLikeDate = (text: string) => /\b(19|20)\d{2}\b|present|current/i.test(text);

/**
 * Two-column CVs (a sidebar beside the main column) put sidebar and main text on the same rows,
 * so reading across merges unrelated lines ("SKILLS Acme Corp"). When a page has a clear vertical
 * gutter, read each column top to bottom instead. Full-width text above both columns (a header)
 * stays first, and the column holding the largest text (usually the name) comes next.
 */
export const orderPdfColumns = (items: PdfTextItem[]): PdfTextItem[] => {
  const placed = items.filter((item): item is PlacedItem => typeof item.str === 'string' && item.str.trim() !== '' && Array.isArray(item.transform) && typeof item.width === 'number');
  if (placed.length < 12 || placed.length !== items.filter((item) => typeof item.str === 'string' && item.str.trim() !== '').length) return items;
  const left = (item: PlacedItem) => item.transform[4];
  const right = (item: PlacedItem) => item.transform[4] + item.width;
  const minX = Math.min(...placed.map(left));
  const maxX = Math.max(...placed.map(right));
  const span = maxX - minX;
  if (span < 200) return items;

  // Pick the gutter crossed by the fewest items, preferring the middle of the widest such band.
  let best: { x: number; crossing: number; band: number } | null = null;
  let bandStart = 0;
  let previousCrossing = -1;
  for (let x = minX + span * 0.2; x <= minX + span * 0.8; x += 1) {
    const crossing = placed.filter((item) => left(item) < x && right(item) > x).length;
    if (crossing !== previousCrossing) bandStart = x;
    previousCrossing = crossing;
    const band = x - bandStart;
    if (!best || crossing < best.crossing || (crossing === best.crossing && band > best.band)) best = { x: bandStart + band / 2, crossing, band };
  }
  if (!best || best.band < 6 || best.crossing > placed.length * 0.15) return items;

  const gutter = best.x;
  const leftColumn = placed.filter((item) => right(item) <= gutter);
  const rightColumn = placed.filter((item) => left(item) >= gutter);
  const crossing = placed.filter((item) => left(item) < gutter && right(item) > gutter);
  const distinctRows = (column: PlacedItem[]) => new Set(column.map((item) => Math.round(item.transform[5]))).size;
  if (distinctRows(leftColumn) < 4 || distinctRows(rightColumn) < 4) return items;
  // Right-aligned dates in a one-column CV look like a narrow column; don't split those.
  if ([leftColumn, rightColumn].some((column) => column.filter((item) => looksLikeDate(item.str)).length >= column.length * 0.6)) return items;

  const top = (column: PlacedItem[]) => Math.max(...column.map((item) => item.transform[5]));
  const columnsTop = Math.max(top(leftColumn), top(rightColumn));
  const header = crossing.filter((item) => item.transform[5] > columnsTop);
  // Full-width lines further down (rare) stay with the column they start in.
  crossing.filter((item) => !header.includes(item)).forEach((item) => (left(item) < gutter ? leftColumn : rightColumn).push(item));

  const fontSize = (item: PlacedItem) => Math.hypot(item.transform[2], item.transform[3]) || Math.abs(item.transform[3]);
  const largest = (column: PlacedItem[]) => Math.max(...column.map(fontSize));
  const textLength = (column: PlacedItem[]) => column.reduce((sum, item) => sum + item.str.length, 0);
  const columns = [leftColumn, rightColumn].sort((a, b) => largest(b) - largest(a) || textLength(b) - textLength(a));
  // pdf.js y grows upwards: read top to bottom, then left to right within a row.
  const readingOrder = (column: PlacedItem[]) => [...column].sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
  // An empty marker forces a line break between groups even if their rows happen to line up.
  const breakItem: PdfTextItem = { str: '', hasEOL: true };
  return [...readingOrder(header), breakItem, ...readingOrder(columns[0]), breakItem, ...readingOrder(columns[1])];
};

const itemFontSize = (item: PdfTextItem) => (item.transform ? Math.hypot(item.transform[2], item.transform[3]) || Math.abs(item.transform[3]) : 0);

/** Rebuilds line breaks from pdf.js text items so section headings and bullets survive extraction. */
export const pdfItemsToText = (rawItems: PdfTextItem[]) => {
  const items = orderPdfColumns(rawItems);
  const lines: { text: string; size: number }[] = [{ text: '', size: 0 }];
  const currentLine = () => lines[lines.length - 1];
  const breakLine = () => lines.push({ text: '', size: 0 });
  let lastY: number | null = null;
  let lastRight: number | null = null;
  items.forEach((item) => {
    // pdf.js also emits marked-content markers without text.
    if (typeof item.str !== 'string') return;
    const x = item.transform?.[4];
    const y = item.transform?.[5];
    if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2 && currentLine().text !== '') {
      breakLine();
    } else if (lastRight !== null && x !== undefined && x - lastRight > 1 && currentLine().text && !/\s$/.test(currentLine().text) && !/^\s/.test(item.str)) {
      currentLine().text += ' ';
    }
    currentLine().text += item.str;
    if (item.str.trim()) currentLine().size = Math.max(currentLine().size, itemFontSize(item));
    if (item.hasEOL) breakLine();
    if (y !== undefined) lastY = y;
    lastRight = x !== undefined && item.width !== undefined ? x + item.width : null;
  });

  // A long name in a narrow sidebar wraps ("Amina" / "Wanjiru"). Rejoin consecutive short lines set in
  // the page's largest type when that is clearly bigger than the body text.
  const filled = lines.filter((line) => line.text.trim());
  const sizes = filled.map((line) => line.size).sort((a, b) => a - b);
  const largest = sizes[sizes.length - 1] ?? 0;
  const median = sizes[Math.floor(sizes.length / 2)] ?? 0;
  const isNamePart = (line: { text: string; size: number }) =>
    largest >= median * 1.4 && line.size >= largest - 0.5 && line.text.trim().length <= 30 && !/[\d@]/.test(line.text);
  const merged: string[] = [];
  filled.forEach((line, index) => {
    if (index > 0 && isNamePart(line) && isNamePart(filled[index - 1])) merged[merged.length - 1] += ` ${line.text.trim()}`;
    else merged.push(line.text);
  });
  return merged.join('\n');
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
    const { text, pageCount, pagesRead, twoColumnPages } = await extractPdfText(file);
    if (pageCount > pagesRead) warnings.push(`Only the first ${pagesRead} of ${pageCount} pages were read.`);
    if (text.replace(/\s/g, '').length < 40 * pagesRead) {
      if (text.replace(/\s/g, '').length < 40) {
        throw new ImportError(
          `${file.name} looks like a scanned or image-only PDF, so there is no selectable text to read. This app doesn't run OCR (that would mean uploading your CV or a large download). Export a text-based PDF or DOCX from the original, or type your details in.`,
        );
      }
      warnings.push('Very little text was found. Parts of this PDF may be scanned images, which cannot be read.');
    }
    return { kind, text, dataUrl: '', warnings, pdf: { pages: pageCount, pagesRead, twoColumnPages } };
  }

  if (kind === 'docx') {
    onProgress?.('Extracting text from DOCX…');
    const { default: mammoth } = await import('mammoth');
    const buffer = await file.arrayBuffer();
    let result: { value: string };
    try {
      result = await mammoth.extractRawText({ arrayBuffer: buffer });
    } catch {
      // mammoth only reports zip internals ("can't find end of central directory").
      throw new ImportError(
        `${file.name} couldn't be opened as a Word document. It may be damaged, or an older .doc file renamed to .docx. Open it in Word or Google Docs, save it as .docx or PDF, and import that.`,
      );
    }
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

  const warnings = [
    ...imported.warnings,
    'Fields were filled by matching headings like "Experience" and "Education". Check each section, especially role and company order.',
    ...parsed.notes,
  ];
  const pdf = 'pdf' in imported ? imported.pdf : undefined;
  return {
    document,
    report: {
      fileName: file.name,
      sourceKind: imported.kind,
      found,
      warnings,
      unplaced: parsed.unplaced,
      diagnostics: {
        format: 1,
        source: imported.kind,
        sizeKb: Math.max(1, Math.round(file.size / 1024 / 10) * 10),
        ...(pdf ? { pages: pdf.pages, pagesRead: pdf.pagesRead, twoColumnPages: pdf.twoColumnPages } : {}),
        found: Object.fromEntries(found.map((row) => [row.label, row.count])),
        unplacedLines: parsed.unplaced.length,
        warnings: warnings.length,
        text: parsed.diagnostics,
      },
    },
  };
};

async function extractPdfText(file: File) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  const buffer = await file.arrayBuffer();
  let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;
  try {
    pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  } catch (error) {
    // pdf.js messages ("Invalid PDF structure.", "No password given") don't tell people what to do.
    const name = error instanceof Error ? error.name : '';
    if (name === 'PasswordException') {
      throw new ImportError(`${file.name} is password-protected, so it can't be read here. Open it, save or print a copy without a password, and import that.`);
    }
    // file.size, not buffer.byteLength: pdf.js transfers the buffer to its worker, which empties it.
    if (file.size === 0) throw new ImportError(`${file.name} is empty (0 bytes). Check you picked the right file.`);
    throw new ImportError(`${file.name} couldn't be read as a PDF; it may be damaged or not really a PDF. Try exporting it again from the original, or import a DOCX instead.`);
  }
  const pagesRead = Math.min(pdf.numPages, MAX_PDF_PAGES);
  let text = '';
  let twoColumnPages = 0;
  for (let index = 1; index <= pagesRead; index += 1) {
    const page = await pdf.getPage(index);
    const items = (await page.getTextContent()).items as PdfTextItem[];
    if (orderPdfColumns(items) !== items) twoColumnPages += 1;
    text += `${pdfItemsToText(items)}\n`;
  }
  return { text, pageCount: pdf.numPages, pagesRead, twoColumnPages };
}
