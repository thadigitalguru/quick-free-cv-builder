import type { EducationItem, ExperienceItem, LanguageItem, ProjectItem, SimpleSectionItem } from '../types/cv';

// Heuristic, offline parser for CVs extracted from PDF/DOCX/TXT. It only copies text that exists in the
// source into fields; anything it cannot place is returned in `unplaced` so the UI can show it to the user.

type Draft<T> = Omit<T, 'id'>;

export interface ImportedTextDraft {
  summary: string;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  websiteUrl: string;
  skills: string[];
  interests: string[];
  experience: Draft<ExperienceItem>[];
  education: Draft<EducationItem>[];
  projects: Draft<ProjectItem>[];
  languages: Draft<LanguageItem>[];
  certifications: Draft<SimpleSectionItem>[];
  volunteer: Draft<SimpleSectionItem>[];
  awards: Draft<SimpleSectionItem>[];
  references: Draft<SimpleSectionItem>[];
  /** Text that was read but not mapped to any field. */
  unplaced: string[];
  /** Human-readable notes about guesses the parser had to make. */
  notes: string[];
}

type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'languages'
  | 'certifications'
  | 'awards'
  | 'volunteer'
  | 'interests'
  | 'references';

const headingAliases: Record<SectionKey, string[]> = {
  summary: ['summary', 'professional summary', 'profile', 'professional profile', 'about', 'about me', 'objective', 'career objective', 'personal statement', 'career summary'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history', 'career history', 'relevant experience', 'career', 'career experience', 'professional history', 'professional background', 'work', 'positions held', 'internships', 'internship experience', 'experience and internships', 'experience & internships'],
  education: ['education', 'academic background', 'education and training', 'education & training', 'academic qualifications', 'qualifications', 'education history', 'academic history', 'educational background', 'academics'],
  skills: ['skills', 'top skills', 'technical skills', 'core skills', 'key skills', 'competencies', 'core competencies', 'skills & tools', 'skills and tools', 'tools', 'expertise', 'skill set', 'skillset', 'areas of expertise', 'key competencies', 'technical proficiencies', 'skills & competencies', 'skills and competencies'],
  projects: ['projects', 'selected projects', 'key projects', 'personal projects'],
  languages: ['languages', 'language skills', 'spoken languages'],
  certifications: ['certifications', 'certificates', 'licenses & certifications', 'licenses and certifications', 'licences & certifications', 'courses', 'training'],
  awards: ['awards', 'honors', 'honours', 'awards & honors', 'awards and honours', 'awards & honours', 'awards and honors'],
  volunteer: ['volunteering', 'volunteer', 'volunteer experience', 'volunteer work'],
  interests: ['interests', 'hobbies', 'hobbies and interests', 'hobbies & interests', 'personal interests'],
  references: ['references', 'referees'],
};

// Headings we recognise but have no section for; their text is reported back rather than merged elsewhere.
const unsupportedHeadings = new Set(['publications', 'achievements', 'key achievements', 'memberships', 'affiliations', 'professional memberships', 'activities', 'extracurricular activities', 'leadership', 'research', 'conferences', 'patents', 'additional information', 'other']);

// Sidebar blocks of contact details; their lines are read like the header (email, phone, location).
const contactHeadings = new Set(['contact', 'contacts', 'contact details', 'contact information', 'contact info', 'personal details', 'personal information', 'personal info', 'details', 'get in touch']);

const headingLookup = new Map<string, SectionKey>(
  (Object.entries(headingAliases) as [SectionKey, string[]][]).flatMap(([key, aliases]) => aliases.map((alias) => [alias, key] as const)),
);
// Letter-spaced headings lose their word gaps in extraction ("W O R K E X P E R I E N C E").
const compactHeadingLookup = new Map<string, SectionKey>([...headingLookup].map(([alias, key]) => [alias.replace(/\s+/g, ''), key]));

/** "C O N T A C T" → "CONTACT": letter-spaced headings come out of PDFs one letter at a time. */
export const collapseLetterSpacing = (line: string) => {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length < 4 || !tokens.every((token) => /^[A-Za-z&]$/.test(token))) return line;
  // A wider gap, when the PDF kept one, still separates words.
  return line.trim().split(/\s{2,}/).map((word) => word.replace(/\s+/g, '')).join(' ');
};

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phoneRegex = /(\+?\d[\d\s().-]{7,}\d)/;
const urlRegex = /((?:https?:\/\/|www\.)[\w.-]+(?:\/[\w\-./?%&=#~]*)?|(?:[\w-]+\.)?linkedin\.com\/[\w\-./?%&=#~]*)/gi;
const urlTestRegex = new RegExp(urlRegex.source, 'i');
const bulletRegex = /^[•●▪◦‣∙·*\-–—]\s*/;
const locationRegex = /^[A-Za-zÀ-ÿ .'-]{2,30},\s*[A-Za-zÀ-ÿ .'-]{2,30}$/;

const month = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
const datePoint = `(?:${month}\\s+\\d{4}|\\d{1,2}\\/\\d{4}|\\d{4}-\\d{2}|\\d{4})`;
// Open-ended roles: "Present", "Current", "to date" ("2021 – to date", "2021 to date"), "till now".
const presentWords = 'present|current(?:ly)?|now|today|ongoing|to\\s+date|till\\s+date|till\\s+now|until\\s+now|date';
const dateEnd = `(?:${datePoint}|${presentWords})`;
const dateRangeRegex = new RegExp(`(${datePoint})\\s*(?:-|–|—|to|until)\\s*(${dateEnd})`, 'i');
const singleYearRegex = /\b(19|20)\d{2}\b/;

const monthIndex: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/** Converts a date the source actually stated into YYYY or YYYY-MM; never adds precision that wasn't there. */
export const normalizeDate = (value: string) => {
  const trimmed = value.trim();
  const named = trimmed.match(/^([a-z]{3})[a-z]*\.?\s+(\d{4})$/i);
  if (named && monthIndex[named[1].toLowerCase()]) return `${named[2]}-${monthIndex[named[1].toLowerCase()]}`;
  const slashed = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashed && Number(slashed[1]) >= 1 && Number(slashed[1]) <= 12) return `${slashed[2]}-${slashed[1].padStart(2, '0')}`;
  return trimmed;
};

const isPhone = (token: string) => {
  const match = token.match(phoneRegex)?.[0];
  return Boolean(match && match.replace(/\D/g, '').length >= 9 && !dateRangeRegex.test(match) && !/[a-z]{3,}/i.test(token.replace(match, '')));
};

const isPresent = (value: string) => new RegExp(`^(?:${presentWords})$`, 'i').test(value.trim());
// "Since March 2021" on a line of its own is an open-ended date range.
const sinceLine = new RegExp(`^since\\s+(${datePoint})$`, 'i');

const stripBullet = (line: string) => line.replace(bulletRegex, '').trim();
const isBullet = (line: string) => bulletRegex.test(line) && stripBullet(line).length > 0;

const toHeadingKey = (line: string) => line.toLowerCase().replace(/[:：]$/, '').replace(/\s+/g, ' ').trim();

const detectHeading = (line: string): SectionKey | 'unknown' | 'contact' | null => {
  if (line.length > 40) return null;
  const key = toHeadingKey(line);
  if (contactHeadings.has(key)) return 'contact';
  const known = headingLookup.get(key) ?? compactHeadingLookup.get(key.replace(/\s+/g, ''));
  if (known) return known;
  if (unsupportedHeadings.has(key)) return 'unknown';
  // ALL-CAPS short lines with no contact data read as headings we don't support; keep their content visible.
  const letters = line.replace(/[^A-Za-z]/g, '');
  // Only plain words count: "SQL • POWER BI" (an upper-cased skills line) must not start a new section.
  if (letters.length >= 4 && /^[A-Z][A-Z &/]+$/.test(line.replace(/[:：]$/, '')) && line.split(/\s+/).length <= 4) {
    return 'unknown';
  }
  return null;
};

const splitList = (lines: string[]) =>
  lines
    .flatMap((line) => line.split(/[,;|•·●▪]/))
    .map((entry) => stripBullet(entry))
    .filter(Boolean);

const uniqueCaseInsensitive = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const joinParagraph = (lines: string[]) => lines.map(stripBullet).join(' ').replace(/\s+/g, ' ').trim();

const jobTitleWords =
  /\b(analyst|engineer|developer|designer|manager|director|officer|assistant|associate|intern|lead|head|consultant|specialist|coordinator|administrator|accountant|teacher|lecturer|nurse|doctor|scientist|researcher|architect|technician|supervisor|executive|representative|agent|clerk|secretary|president|founder|owner|advisor|adviser|strategist|editor|writer|marketer|programmer|tester|trainer|instructor|tutor|volunteer|chef|driver|cashier|receptionist|attendant|planner|auditor|economist|lawyer|advocate|pharmacist|surveyor|operator|controller|vp|cto|ceo|cfo|coo)s?\b/i;
const looksLikeJobTitle = (value: string) => jobTitleWords.test(value);

const splitHeaderParts = (line: string) =>
  line
    .split(/\s+(?:at|@)\s+|\s+[|–—-]\s+|\s*,\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

interface RawEntry {
  header: string[];
  dateStart: string;
  dateEnd: string;
  body: string[];
}

/** Groups section lines into entries, using a date range (or a lone year) as the anchor for each entry. */
const groupEntries = (lines: string[], allowSingleYear: boolean): { entries: RawEntry[]; anchored: boolean } => {
  const hasDate = (line: string) => dateRangeRegex.test(line) || (allowSingleYear && singleYearRegex.test(line));
  const anchored = lines.some((line) => !isBullet(line) && hasDate(line));
  if (!anchored) {
    return { entries: lines.length ? [{ header: [], dateStart: '', dateEnd: '', body: lines }] : [], anchored: false };
  }

  const textBesideDate = (line: string) => {
    const range = line.match(dateRangeRegex);
    return line
      .replace(range ? range[0] : (line.match(singleYearRegex)?.[0] ?? ''), '')
      .replace(/[|,–—-]\s*$/, '')
      .replace(/^\s*[|,–—-]/, '')
      .replace(/\(\s*\)/, '')
      .trim();
  };
  // "Role, Company    Mar 2021 – Present" on one line from the very first entry: every entry starts
  // at its dated line. Lookahead would otherwise take unbulleted achievements for the next header.
  const oneLineHeaders = !isBullet(lines[0] ?? '') && hasDate(lines[0] ?? '') && textBesideDate(lines[0]) !== '';

  const entries: RawEntry[] = [];
  let current: RawEntry | null = null;
  let currentHasDate = false;

  const startEntry = () => {
    current = { header: [], dateStart: '', dateEnd: '', body: [] };
    currentHasDate = false;
    entries.push(current);
  };

  lines.forEach((line, index) => {
    if (!current) startEntry();
    const entry = current as unknown as RawEntry;

    if (isBullet(line)) {
      entry.body.push(line);
      return;
    }

    if (currentHasDate && oneLineHeaders) {
      if (hasDate(line)) startEntry();
      else {
        entry.body.push(line);
        return;
      }
    } else if (currentHasDate) {
      // A plain line after a dated entry starts a new entry only if a date line follows before any bullet.
      const upcoming = lines.slice(index, index + 3);
      const nextBullet = upcoming.findIndex(isBullet);
      const nextDate = upcoming.findIndex(hasDate);
      if (nextDate >= 0 && (nextBullet < 0 || nextDate < nextBullet)) {
        startEntry();
      } else {
        entry.body.push(line);
        return;
      }
    }

    const target = current as unknown as RawEntry;
    if (hasDate(line)) {
      const range = line.match(dateRangeRegex);
      if (range) {
        target.dateStart = range[1];
        target.dateEnd = range[2];
      } else {
        target.dateEnd = line.match(singleYearRegex)?.[0] ?? '';
      }
      const rest = textBesideDate(line);
      if (rest) target.header.push(rest);
      currentHasDate = true;
    } else {
      target.header.push(line);
    }
  });

  return { entries, anchored: true };
};

/** Bullets become items; wrapped continuation lines (common in PDFs) are joined to the bullet above. */
const toBulletItems = (lines: string[]) => {
  const items: string[] = [];
  let lastWasBullet = false;
  lines.forEach((line) => {
    if (isBullet(line)) {
      items.push(stripBullet(line));
      lastWasBullet = true;
    } else if (lastWasBullet && items.length && /^[a-z(]/.test(line)) {
      items[items.length - 1] = `${items[items.length - 1]} ${line}`;
    } else {
      items.push(line);
      lastWasBullet = false;
    }
  });
  return items;
};

// "SQL • POWER BI", or a single "TYPESCRIPT": the upper-cased technologies line our own export prints.
const isUpperCaseList = (line: string) => line === line.toUpperCase() && /[A-Z]/.test(line) && (/[•·|,]/.test(line) || (line.length <= 40 && !/[.!?]$/.test(line)));

const parseExperience = (lines: string[], notes: string[]): Draft<ExperienceItem>[] => {
  const { entries, anchored } = groupEntries(lines, false);
  if (!anchored && entries.length) notes.push('Experience had no date ranges, so it was kept as one entry. Split it into roles in the editor.');

  return entries.map((entry) => {
    let location = '';
    let headerParts = entry.header.length === 1 ? splitHeaderParts(entry.header[0]) : [...entry.header];
    // "Role" / "Company • Location" on two lines, as many templates (including ours) lay it out.
    if (entry.header.length === 2 && /\s[•|]\s/.test(entry.header[1])) {
      const [company, ...rest] = entry.header[1].split(/\s[•|]\s/);
      headerParts = [entry.header[0], company.trim()];
      location = rest.join(', ').trim();
    }
    // "Company" above "Role" is common too: swap when only the second line reads like a job title.
    if (headerParts.length >= 2 && !looksLikeJobTitle(headerParts[0]) && looksLikeJobTitle(headerParts[1])) {
      headerParts = [headerParts[1], headerParts[0], ...headerParts.slice(2)];
    }
    const [role = '', company = '', ...extraHeader] = headerParts;
    // An all-caps keyword list right under the dates is a technologies line, not an achievement.
    const body = [...entry.body];
    const technologies = body.length && isUpperCaseList(body[0]) ? splitList([body.shift()!]) : [];
    return {
      role,
      company,
      location,
      startDate: normalizeDate(entry.dateStart),
      endDate: isPresent(entry.dateEnd) ? '' : normalizeDate(entry.dateEnd),
      isCurrent: isPresent(entry.dateEnd),
      // Header text we couldn't map stays with the entry instead of being dropped.
      achievements: [...extraHeader, ...toBulletItems(body)],
      technologies,
    };
  });
};

const qualificationRegex = /\b(b\.?sc|b\.?a|b\.?eng|b\.?com|m\.?sc|m\.?a|m\.?eng|mba|ph\.?d|bachelor|master|doctor|diploma|certificate|degree|associate|a-levels?|gcse|kcse|kcpe|high school diploma|hnd)\b/i;
const institutionRegex = /\b(university|college|institute|school|academy|polytechnic|conservatoire)\b/i;

const parseEducation = (lines: string[], notes: string[]): Draft<EducationItem>[] => {
  const { entries, anchored } = groupEntries(lines, true);
  if (!anchored && entries.length) notes.push('Education had no dates, so it was kept as one entry. Check the institution and qualification fields.');

  return entries.map((entry) => {
    const parts = entry.header.length === 1 ? splitHeaderParts(entry.header[0]) : [...entry.header];
    const source = anchored ? parts : [...parts, ...entry.body.splice(0, 2)];
    let institution = '';
    let qualification = '';
    const leftovers: string[] = [];
    source.forEach((part) => {
      if (!institution && institutionRegex.test(part)) institution = part;
      else if (!qualification && qualificationRegex.test(part)) qualification = part;
      else leftovers.push(part);
    });
    if (!institution && leftovers.length) institution = leftovers.shift()!;
    if (!qualification && leftovers.length) qualification = leftovers.shift()!;

    return {
      institution,
      qualification,
      fieldOfStudy: '',
      startDate: normalizeDate(entry.dateStart),
      endDate: isPresent(entry.dateEnd) ? '' : normalizeDate(entry.dateEnd),
      description: [...leftovers, ...toBulletItems(entry.body)].join('\n'),
    };
  });
};

const parseProjects = (lines: string[]): Draft<ProjectItem>[] => {
  const projects: Draft<ProjectItem>[] = [];
  lines.forEach((line) => {
    const current = projects[projects.length - 1];
    if (isBullet(line) && current) {
      current.description = [current.description, stripBullet(line)].filter(Boolean).join('\n');
      return;
    }
    const text = stripBullet(line);
    const [name, ...rest] = text.split(/\s+[–—-]\s+|:\s+/);
    const link = text.match(urlRegex)?.[0] ?? '';
    projects.push({ name: name.trim(), role: '', date: '', description: rest.join(' – ').trim(), link, technologies: [] });
  });
  return projects;
};

const proficiencyMatchers: [RegExp, LanguageItem['proficiency']][] = [
  [/native|mother tongue|first language/i, 'Native'],
  [/fluent|bilingual|c2|c1/i, 'Fluent'],
  [/professional|business|working|full/i, 'Professional'],
  [/intermediate|conversational|b2|b1/i, 'Intermediate'],
  [/basic|beginner|elementary|a2|a1/i, 'Basic'],
];

const parseLanguages = (lines: string[], unplaced: string[]): Draft<LanguageItem>[] => {
  const languages: Draft<LanguageItem>[] = [];
  splitList(lines).forEach((entry) => {
    const proficiency = proficiencyMatchers.find(([regex]) => regex.test(entry))?.[1];
    const name = entry.split(/\s*[(:–—-]\s*/)[0].trim();
    // The data model requires a proficiency; we won't make one up, so unrated languages are shown for manual entry.
    if (proficiency && name) languages.push({ name, proficiency });
    else unplaced.push(`Language: ${entry}`);
  });
  return languages;
};

const parseSimpleItems = (lines: string[]): Draft<SimpleSectionItem>[] => {
  const items: Draft<SimpleSectionItem>[] = [];
  lines.forEach((line) => {
    const current = items[items.length - 1];
    // A bullet, or a short line with a year ("Coursera, 2022"), describes the item above it.
    const looksLikeDetails = isBullet(line) || (singleYearRegex.test(line) && line.length <= 60);
    if (looksLikeDetails && current && !current.details) {
      current.details = stripBullet(line);
      return;
    }
    items.push({ title: stripBullet(line), details: '' });
  });
  return items;
};

const parseList = (lines: string[], unplaced: string[], label: string) => {
  const items: string[] = [];
  splitList(lines).forEach((entry) => {
    if (entry.length <= 60) items.push(entry);
    else unplaced.push(`${label}: ${entry}`);
  });
  return uniqueCaseInsensitive(items);
};

const contactLabelRegex = /(?:^|\s)(e-?mail|phone|tel|mobile|location|address|linkedin|portfolio|website|web)\s*:\s*/gi;
const isContactLine = (line: string) => /^(e-?mail|phone|tel|mobile|location|address|linkedin|portfolio|website|web)\s*:/i.test(line);

/** Splits "Email: a@b.com Phone: +254…" into label/value pairs. */
const parseContactLine = (line: string) => {
  const matches = [...line.matchAll(contactLabelRegex)];
  return matches.map((match, index) => ({
    label: match[1].toLowerCase(),
    value: line.slice(match.index! + match[0].length, matches[index + 1]?.index ?? line.length).trim(),
  }));
};

/**
 * PDF generators often emit glyph runs with stray spaces ("example .com", "2021 - 03", "https ://").
 * Undo only those patterns so emails, URLs and dates are recognisable again.
 */
export const normalizeExtractedText = (text: string) =>
  text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+([.,:;%!?)])/g, '$1')
    .replace(/\([ \t]+/g, '(')
    .replace(/(\d{4}) - (\d{2})(?!\d)/g, '$1-$2')
    .replace(/(\S) \/(?=\S)/g, '$1/');

export const parseImportedText = (rawText: string): ImportedTextDraft => {
  const text = normalizeExtractedText(rawText);
  const lines = text
    .split('\n')
    // Tabs separate fields ("email<TAB>phone"); keep them as separators instead of plain spaces.
    .map((line) => collapseLetterSpacing(line).replace(/\t+/g, ' | ').replace(/\s+/g, ' ').replace(/^\|\s*|\s*\|$/g, '').trim())
    .map((line) => line.replace(sinceLine, '$1 – Present'))
    // Some PDFs emit list markers as their own line.
    .filter((line) => line && !/^[•●▪◦‣∙·*–—-]$/.test(line));

  const unplaced: string[] = [];
  const notes: string[] = [];
  const header: string[] = [];
  const sections: Partial<Record<SectionKey, string[]>> = {};
  const contactFields: { label: string; value: string }[] = [];
  let current: SectionKey | 'header' | 'unknown' = 'header';

  lines.forEach((line) => {
    // Labelled contact lines can appear anywhere (PDFs often store a header column last).
    if (isContactLine(line)) {
      contactFields.push(...parseContactLine(line));
      return;
    }
    const detected = detectHeading(line);
    // Right under a role's dates, an all-caps line is its technologies ("TYPESCRIPT"), not a new section.
    const isTechLine =
      detected === 'unknown' &&
      (current === 'experience' || current === 'projects' || current === 'volunteer') &&
      !unsupportedHeadings.has(toHeadingKey(line)) &&
      dateRangeRegex.test(sections[current]!.at(-1) ?? '');
    // The very first line is the name even in capitals ("AMINA WANJIRU"), not an unknown heading.
    const isCapitalisedName = detected === 'unknown' && current === 'header' && header.length === 0 && !unsupportedHeadings.has(toHeadingKey(line));
    const heading = isTechLine || isCapitalisedName ? null : detected;
    if (heading === 'contact') {
      current = 'header';
      return;
    }
    if (heading === 'unknown') {
      current = 'unknown';
      unplaced.push(line);
      return;
    }
    if (heading) {
      current = heading;
      sections[heading] ??= [];
      return;
    }
    if (current === 'header') header.push(line);
    else if (current === 'unknown') unplaced.push(line);
    else sections[current]!.push(line);
  });

  const urls = Array.from(text.matchAll(urlRegex)).map((match) => match[1].replace(/[.,;]$/, ''));
  const linkedinUrl = urls.find((url) => /linkedin\.com/i.test(url)) ?? '';
  const websiteUrl = urls.find((url) => !/linkedin\.com/i.test(url)) ?? '';
  const email = text.match(emailRegex)?.[0] ?? '';
  // Phones are only taken from the header block so a date range like "2019 - 2022" is never read as one.
  const labelled = (labels: string[]) => contactFields.find((field) => labels.includes(field.label) && field.value && field.value !== '—')?.value ?? '';
  const phone =
    header.flatMap((line) => line.split(/\s*[|•·●]\s*/)).find(isPhone)?.match(phoneRegex)?.[0]?.trim() ||
    labelled(['phone', 'tel', 'mobile']).match(phoneRegex)?.[0]?.trim() ||
    '';

  let fullName = '';
  let jobTitle = '';
  let location = labelled(['location', 'address']);
  const headerLeftovers: string[] = [];
  header.forEach((line) => {
    const tokens = line.split(/\s*[|•·●]\s*/).map((token) => token.trim()).filter(Boolean);
    const remaining = tokens.filter((token) => {
      if (emailRegex.test(token) || urlTestRegex.test(token) || /linkedin/i.test(token)) return false;
      if (isPhone(token)) return false;
      if (!location && locationRegex.test(token) && fullName) {
        location = token;
        return false;
      }
      return true;
    });
    if (!remaining.length) return;
    const joined = remaining.join(' | ');
    if (!fullName && joined.length <= 60) {
      fullName = joined.replace(/\b(resume|curriculum vitae|cv)\b/gi, '').trim();
    } else if (fullName && !jobTitle && joined.length <= 60 && !/\d/.test(joined)) {
      jobTitle = joined;
    } else {
      headerLeftovers.push(line);
    }
  });

  let summary = sections.summary ? joinParagraph(sections.summary) : '';
  // Text before the first recognised heading becomes the summary, unless it has date ranges:
  // then it's probably job history under a heading we don't know, which a summary would hide.
  const leftoversLookLikeHistory = headerLeftovers.some((line) => dateRangeRegex.test(line));
  if (!summary && headerLeftovers.length && !leftoversLookLikeHistory) {
    summary = joinParagraph(headerLeftovers);
  } else {
    unplaced.unshift(...headerLeftovers);
    if (leftoversLookLikeHistory) notes.push("Some text before the first heading has dates in it, so it looks like job history. It wasn't put in your summary; copy it into Experience.");
  }

  // "Tools: SQL, Power BI" groups skills under a label; the label isn't a skill.
  const skillLines = (sections.skills ?? []).map((line) => line.replace(/^([A-Za-z][\w&/+ -]{0,30}):\s+(?=\S)/, (match, label: string) => (label.trim().split(/\s+/).length <= 4 ? '' : match)));
  const skills = sections.skills ? parseList(skillLines, unplaced, 'Skill') : [];
  const interests = sections.interests ? parseList(sections.interests, unplaced, 'Interest') : [];

  return {
    summary,
    fullName,
    jobTitle,
    email,
    phone,
    location,
    linkedinUrl,
    websiteUrl,
    skills,
    interests,
    experience: sections.experience ? parseExperience(sections.experience, notes) : [],
    education: sections.education ? parseEducation(sections.education, notes) : [],
    projects: sections.projects ? parseProjects(sections.projects) : [],
    languages: sections.languages ? parseLanguages(sections.languages, unplaced) : [],
    certifications: sections.certifications ? parseSimpleItems(sections.certifications) : [],
    volunteer: sections.volunteer ? parseSimpleItems(sections.volunteer) : [],
    awards: sections.awards ? parseSimpleItems(sections.awards) : [],
    references: sections.references ? parseSimpleItems(sections.references) : [],
    unplaced,
    notes,
  };
};
