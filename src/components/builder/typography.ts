/** Font sizes for the CV preview and export, adjustable in Advanced options. */
export type PreviewTypography = {
  fullName: number;
  jobTitle: number;
  contact: number;
  sectionTitle: number;
  sectionItemTitle: number;
  sectionDetails: number;
};
export const defaultTypography: PreviewTypography = {
  fullName: 28,
  jobTitle: 20,
  contact: 14,
  sectionTitle: 13,
  sectionItemTitle: 14,
  sectionDetails: 13,
};
export const typographyMinMax: Record<keyof PreviewTypography, { min: number; max: number }> = {
  fullName: { min: 18, max: 48 },
  jobTitle: { min: 12, max: 30 },
  contact: { min: 10, max: 22 },
  sectionTitle: { min: 10, max: 20 },
  sectionItemTitle: { min: 11, max: 22 },
  sectionDetails: { min: 10, max: 20 },
};
