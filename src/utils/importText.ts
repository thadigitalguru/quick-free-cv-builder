export interface ImportedTextDraft {
  summary: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  websiteUrl: string;
  skills: string[];
}

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phoneRegex = /(\+?\d[\d\s().-]{7,}\d)/;
const urlRegex = /(https?:\/\/[\w.-]+(?:\/[\w\-./?%&=]*)?)/gi;

export const parseImportedText = (text: string): ImportedTextDraft => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const email = text.match(emailRegex)?.[0] ?? '';
  const phone = text.match(phoneRegex)?.[0] ?? '';
  const urls = Array.from(text.matchAll(urlRegex)).map((match) => match[1]);
  const linkedinUrl = urls.find((url) => /linkedin\.com/i.test(url)) ?? '';
  const websiteUrl = urls.find((url) => !/linkedin\.com/i.test(url)) ?? '';
  const fullName = lines[0] && !emailRegex.test(lines[0]) ? lines[0].replace(/resume|cv/i, '').trim() : '';
  const summary = lines.slice(1).join('\n').trim() || text.trim();
  const skills = Array.from(
    new Set(
      text
        .split(/[\n,;·•|]/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 2 && entry.length < 30),
    ),
  ).slice(0, 12);

  return {
    summary,
    fullName,
    email,
    phone,
    location: '',
    linkedinUrl,
    websiteUrl,
    skills,
  };
};
