import type { CVDocument } from '../types/cv';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;

export interface ValidationIssue {
  field: string;
  message: string;
}

export const validateDocument = (document: CVDocument): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  if (!document.personalInfo.fullName.trim()) {
    issues.push({ field: 'fullName', message: 'Full name is required for export.' });
  }

  if (document.personalInfo.email && !emailPattern.test(document.personalInfo.email.trim())) {
    issues.push({ field: 'email', message: 'Email format looks invalid.' });
  }

  if (document.personalInfo.linkedinUrl && !urlPattern.test(document.personalInfo.linkedinUrl.trim())) {
    issues.push({ field: 'linkedinUrl', message: 'LinkedIn URL looks invalid.' });
  }

  if (document.personalInfo.websiteUrl && !urlPattern.test(document.personalInfo.websiteUrl.trim())) {
    issues.push({ field: 'websiteUrl', message: 'Website URL looks invalid.' });
  }

  return issues;
};

export const hasBlockingIssues = (issues: ValidationIssue[]) =>
  issues.some((issue) => issue.field === 'fullName');
