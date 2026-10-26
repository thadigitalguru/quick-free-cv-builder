import regularUrl from '../assets/fonts/NotoSans-Regular.ttf?url';
import boldUrl from '../assets/fonts/NotoSans-Bold.ttf?url';

/**
 * jsPDF's built-in fonts only cover Western European text, so "Łukasz" or "Poznań" came out as
 * garbage. The CV is rendered in Noto Sans (preview and PDF), which jsPDF embeds as a subset.
 */
export const CV_FONT_FAMILY = 'Noto Sans';

const faces = [
  { file: 'NotoSans-Regular.ttf', url: regularUrl, weight: 400, style: 'normal' },
  { file: 'NotoSans-Bold.ttf', url: boldUrl, weight: 700, style: 'bold' },
] as const;

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
};

let loaded: Promise<{ file: string; data: string }[]> | null = null;

const loadFontFiles = () =>
  (loaded ??= Promise.all(
    faces.map(async ({ file, url }) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Couldn't load the PDF font (${response.status}). Reload the page and try again.`);
      return { file, data: toBase64(await response.arrayBuffer()) };
    }),
  ).catch((error: unknown) => {
    loaded = null;
    throw error;
  }));

type FontTarget = { addFileToVFS: (file: string, data: string) => unknown };

/** Puts the font files into this PDF and returns the `fontFaces` option for `.html()`. */
export const registerCvFonts = async (pdf: FontTarget) => {
  const files = await loadFontFiles();
  files.forEach(({ file, data }) => pdf.addFileToVFS(file, data));
  return faces.map(({ file, weight, style }) => ({
    family: CV_FONT_FAMILY,
    weight,
    style: 'normal' as const,
    src: [{ url: file, format: 'truetype' as const }],
    // jsPDF registers each face under this name/style and selects it by CSS family and weight.
    ref: { name: 'NotoSans', style },
  }));
};
