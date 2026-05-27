import type { CVDocument } from '../types/cv';
import { defaultOrder, sectionDefaults } from './sectionMeta';

export const mockPreview: CVDocument = {
  personalInfo: {
    fullName: 'Titus Kores',
    jobTitle: 'SEO Manager',
    email: 'ntimama2@gmail.com',
    phone: '0790965628',
    location: 'Nairobi, Kenya',
    linkedinUrl: 'https://www.linkedin.com/in/titus-kores-610201200/',
    websiteUrl: 'thadigitalguru.github.io',
    profilePhoto: '',
    photoZoom: 1,
    photoX: 50,
    photoY: 50,
    summary:
      'Results-driven growth marketing leader with 7 years of experience in developing and executing data-driven marketing strategies. Specialized in performance marketing, SEO, content marketing and customer acquisition strategies to enhance brand visibility and organic growth marketing hacking. Proven ability to develop and execute high-impact digital campaigns, collaborate with cross-functional teams, and optimize user experience for brand growth. Adept at leveraging analytics and innovative solutions to drive engagement and measurable results.',
  },
  experience: [
    {
      id: 'mock-1',
      role: 'Growth Marketing Specialist',
      company: 'Pakamumi (iGaming)',
      location: 'Nairobi, Kenya',
      startDate: 'Feb 2022',
      endDate: 'Mar 2025',
      isCurrent: false,
      technologies: ['Chrome DevTools', 'WebPageTest', 'Google Analytics', 'SEO'],
      achievements: [
        'Analyzed and optimized customer website performance and conversion by using tools such as Chrome DevTools, WebPageTest, Google Analytics, and SEO to identify and implement targeted improvements.',
        'Worked in Google Sheets (Excel) with large amounts of data (filtering, conditional formatting, and applying various functions);',
        'Achieved an 80% increase in organic traffic over a period of 18 months through effective optimization of both the website and landing pages.',
        'Collaborated with developers to resolve Javascript SEO issues and enhance user interface designs for improved crawlability and UX.',
        'Achieved top 10 keyword ranking positions driving over 10,000 search volume and increasing organic traffic.',
        'Optimized SEO strategies that improved search engine rankings and overall traffic for targeted keywords.',
        'Trained professionals in SEO, AI marketing, content strategy, and growth hacking to enable them leverage AI tools like ChatGPT, Claude, and SurferSEO to 10x their productivity and results.',
        'Monitored website performance, user experience and analytics to optimize for best results.',
        'Analyzed competitor’s websites for feature comparison and competitive advantage analysis.',
        'Collaborated with development team to resolve usability issues and improve website functionality.',
        'Identified areas of improvement within current SEO processes and recommended changes accordingly.',
        'Managed 1000+ pages website and maintained consistent optimizations on crawlability and accessibility.',
      ],
    },
  ],
  education: [],
  skills: [],
  projects: [],
  languages: [],
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
