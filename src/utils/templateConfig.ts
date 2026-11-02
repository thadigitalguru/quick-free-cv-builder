import type { ResumeTemplateId } from '../types/cv';

export const templateLabelMap: Record<ResumeTemplateId, string> = {
  classic: 'Classic',
  modern: 'Modern',
  compact: 'Compact',
  banner: 'Banner',
};

/** Accent colours offered for the CV; all readable as text on white and as a band behind white text (4.5:1+). */
export const accentSwatches = [
  { name: 'Navy', value: '#1e3a8a' },
  { name: 'Blue', value: '#1d4ed8' },
  { name: 'Teal', value: '#0f766e' },
  { name: 'Green', value: '#15803d' },
  { name: 'Purple', value: '#6d28d9' },
  { name: 'Crimson', value: '#b91c1c' },
  { name: 'Amber', value: '#b45309' },
  { name: 'Charcoal', value: '#1f2937' },
] as const;

export const defaultAccent = '#1d4ed8';

export const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

/** WCAG contrast of a colour against white. */
export const contrastWithWhite = (hex: string) => {
  const channel = (offset: number) => {
    const c = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return 1.05 / (luminance + 0.05);
};
