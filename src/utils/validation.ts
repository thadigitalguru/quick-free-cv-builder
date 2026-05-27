import type { CVDocument, SectionId } from '../types/cv';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^^\s]*)?$/i;
const flexibleDatePattern = /^\d{4}(-(?:(0[1-9])|(1[0-2])))?$/;

export const fieldKey = (sectionId: SectionId, itemId: string, field: string) => `${sectionId}:${itemId}:${field}`;

export const isValidEmail = (value: string) => !value.trim() || emailPattern.test(value.trim());
export const isValidUrl = (value: string) => !value.trim() || urlPattern.test(value.trim());
export const isFlexibleDateValue = (value: string) => !value.trim() || flexibleDatePattern.test(value.trim());

export interface ValidationIssue {
  field: string;
  sectionId: SectionId | 'personalInfo';
  message: string;
}

export const validateDocument = (document: CVDocument): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  if (!document.personalInfo.fullName.trim()) {
    issues.push({ field: 'fullName', sectionId: 'personalInfo', message: 'Add your full name to export.' });
  }

  if (!isValidEmail(document.personalInfo.email)) {
    issues.push({ field: 'email', sectionId: 'personalInfo', message: 'That email format looks invalid.' });
  }

  if (!isValidUrl(document.personalInfo.linkedinUrl)) {
    issues.push({ field: 'linkedinUrl', sectionId: 'personalInfo', message: 'That LinkedIn URL looks invalid.' });
  }

  if (!isValidUrl(document.personalInfo.websiteUrl)) {
    issues.push({ field: 'websiteUrl', sectionId: 'personalInfo', message: 'That website URL looks invalid.' });
  }

  document.experience.forEach((item) => {
    if (!isFlexibleDateValue(item.startDate)) {
      issues.push({ field: fieldKey('experience', item.id, 'startDate'), sectionId: 'experience', message: 'Use YYYY or YYYY-MM for start date.' });
    }
    if (!isFlexibleDateValue(item.endDate)) {
      issues.push({ field: fieldKey('experience', item.id, 'endDate'), sectionId: 'experience', message: 'Use YYYY or YYYY-MM for end date.' });
    }
  });

  document.education.forEach((item) => {
    if (!isFlexibleDateValue(item.startDate)) {
      issues.push({ field: fieldKey('education', item.id, 'startDate'), sectionId: 'education', message: 'Use YYYY or YYYY-MM for start date.' });
    }
    if (!isFlexibleDateValue(item.endDate)) {
      issues.push({ field: fieldKey('education', item.id, 'endDate'), sectionId: 'education', message: 'Use YYYY or YYYY-MM for end date.' });
    }
  });

  document.projects.forEach((item) => {
    if (!isFlexibleDateValue(item.date)) {
      issues.push({ field: fieldKey('projects', item.id, 'date'), sectionId: 'projects', message: 'Use YYYY or YYYY-MM for project date.' });
    }
  });

  if (document.experience.length === 0) issues.push({ field: 'experience', sectionId: 'experience', message: 'Add at least one experience entry to export.' });
  if (document.education.length === 0) issues.push({ field: 'education', sectionId: 'education', message: 'Add at least one education entry to export.' });
  if (document.skills.length === 0) issues.push({ field: 'skills', sectionId: 'skills', message: 'Add at least one skill to export.' });
  if (document.interests.length === 0) issues.push({ field: 'interests', sectionId: 'interests', message: 'Add at least one interest to export.' });

  return issues;
};

export const hasBlockingIssues = (issues: ValidationIssue[]) => issues.some((issue) => issue.field === 'fullName');

export const groupIssuesBySection = (issues: ValidationIssue[]) =>
  issues.reduce<Record<string, ValidationIssue[]>>((acc, issue) => {
    acc[issue.sectionId] ??= [];
    acc[issue.sectionId].push(issue);
    return acc;
  }, {});
