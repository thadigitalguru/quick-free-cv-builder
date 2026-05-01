import type { CVDocument, SectionId } from '../types/cv';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;

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

  if (document.personalInfo.email && !emailPattern.test(document.personalInfo.email.trim())) {
    issues.push({ field: 'email', sectionId: 'personalInfo', message: 'That email format looks invalid.' });
  }

  if (document.personalInfo.linkedinUrl && !urlPattern.test(document.personalInfo.linkedinUrl.trim())) {
    issues.push({ field: 'linkedinUrl', sectionId: 'personalInfo', message: 'That LinkedIn URL looks invalid.' });
  }

  if (document.personalInfo.websiteUrl && !urlPattern.test(document.personalInfo.websiteUrl.trim())) {
    issues.push({ field: 'websiteUrl', sectionId: 'personalInfo', message: 'That website URL looks invalid.' });
  }

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
