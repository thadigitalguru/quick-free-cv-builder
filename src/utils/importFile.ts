import mammoth from 'mammoth';
import { parseImportedText } from './importText';
import { normalizeImportedDocument } from './importDocument';

const pdfjs = import('pdfjs-dist');

export const readImportedFile = async (file: File) => {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
  const isDocx =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx');

  if (file.type.startsWith('image/')) {
    return { kind: 'image' as const, text: '', dataUrl: await readFileAsDataUrl(file) };
  }

  if (isPdf) {
    const text = await extractPdfText(file);
    return { kind: 'text' as const, text, dataUrl: '' };
  }

  if (isDocx) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return { kind: 'text' as const, text: result.value, dataUrl: '' };
  }

  const text = await file.text();
  return { kind: 'text' as const, text, dataUrl: '' };
};

export const buildImportedDocument = async (file: File) => {
  const imported = await readImportedFile(file);

  if (imported.kind === 'image') {
    return normalizeImportedDocument({
      personalInfo: { profilePhoto: imported.dataUrl },
      experience: [],
      education: [],
      projects: [],
      languages: [],
      certifications: [],
      volunteer: [],
      awards: [],
      interests: [],
      references: [],
      skills: [],
    });
  }

  const text = imported.text.trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    const normalized = normalizeImportedDocument(parsed);
    if (normalized) return normalized;
  } catch {
    // ignore JSON parse errors
  }

  const parsedText = parseImportedText(text);
  return normalizeImportedDocument({
    personalInfo: {
      fullName: parsedText.fullName,
      summary: parsedText.summary,
      email: parsedText.email,
      phone: parsedText.phone,
      location: parsedText.location,
      linkedinUrl: parsedText.linkedinUrl,
      websiteUrl: parsedText.websiteUrl,
    },
    experience: [],
    education: [],
    projects: [],
    languages: [],
    certifications: [],
    volunteer: [],
    awards: [],
    interests: parsedText.skills,
    references: [],
    skills: parsedText.skills,
  });
};

async function extractPdfText(file: File) {
  const pdfjsLib = await pdfjs;
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let output = '';
  const pages = Math.min(pdf.numPages, 10);
  for (let index = 1; index <= pages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    output += content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ') + '\n';
  }
  return output;
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}
