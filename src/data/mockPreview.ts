import type { CVDocument } from '../types/cv';
import { defaultOrder, sectionDefaults } from './sectionMeta';

// Shown in the preview until the user types. Entirely fictional: the companies are well-known
// sample names, the email uses the reserved example.com domain, and the phone number is a placeholder.
export const mockPreview: CVDocument = {
  personalInfo: {
    fullName: 'Amina Wanjiru',
    jobTitle: 'Product Marketing Manager',
    email: 'amina@example.com',
    phone: '+254 700 000 000',
    location: 'Nairobi, Kenya',
    linkedinUrl: 'linkedin.com/in/example',
    websiteUrl: 'example.com',
    profilePhoto: '',
    photoZoom: 1,
    photoX: 50,
    photoY: 50,
    summary:
      'Product marketer with 6 years of experience taking B2B software to market across East Africa. I turn customer research into clear positioning, launch plans and sales tools, and measure what works.',
  },
  experience: [
    {
      id: 'sample-1',
      role: 'Product Marketing Manager',
      company: 'Contoso',
      location: 'Nairobi, Kenya',
      startDate: '2022-03',
      endDate: '',
      isCurrent: true,
      technologies: [],
      achievements: [
        'Led positioning and launch for 4 products, adding 1,200 paying customers in the first year.',
        'Built a win/loss research programme with sales; the findings cut the average sales cycle by 18%.',
        'Rewrote onboarding emails and help content, raising trial-to-paid conversion from 9% to 14%.',
      ],
    },
    {
      id: 'sample-2',
      role: 'Marketing Associate',
      company: 'Fabrikam',
      location: 'Nairobi, Kenya',
      startDate: '2019-01',
      endDate: '2022-02',
      isCurrent: false,
      technologies: [],
      achievements: [
        'Ran SEO and content for the company blog, growing organic visits 3x in two years.',
        'Planned 12 webinars a year with product experts, generating a third of qualified leads.',
      ],
    },
  ],
  education: [
    {
      id: 'sample-edu-1',
      institution: 'University of Nairobi',
      qualification: 'Bachelor of Commerce',
      fieldOfStudy: 'Marketing',
      startDate: '2014-09',
      endDate: '2018-07',
      description: 'Second Class Honours (Upper Division)',
    },
  ],
  skills: ['Positioning & messaging', 'Go-to-market planning', 'Customer research', 'SEO', 'Google Analytics 4', 'HubSpot', 'Copywriting'],
  projects: [],
  languages: [
    { id: 'sample-lang-1', name: 'English', proficiency: 'Fluent' },
    { id: 'sample-lang-2', name: 'Swahili', proficiency: 'Native' },
  ],
  certifications: [],
  volunteer: [],
  awards: [],
  interests: [],
  references: [],
  sectionOrder: defaultOrder,
  sectionVisibility: sectionDefaults.reduce((acc, section) => {
    acc[section.id] = section.visible;
    return acc;
  }, {} as CVDocument['sectionVisibility']),
  lastUpdatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
};
