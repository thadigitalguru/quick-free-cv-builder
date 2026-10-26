import { useEffect, useMemo, useRef } from 'react';
import { useCVStore } from '../../store/cvStore';
import { groupIssuesBySection, type ValidationIssue } from '../../utils/validation';
import { PersonalInfoForm } from './editor/PersonalInfoForm';
import { ExperienceForm } from './editor/ExperienceForm';
import { EducationForm } from './editor/EducationForm';
import { SkillsForm } from './editor/SkillsForm';
import { ProjectsForm } from './editor/ProjectsForm';
import { LanguagesForm } from './editor/LanguagesForm';
import { InterestsForm } from './editor/InterestsForm';
import { SimpleSectionForm } from './editor/SimpleSectionForm';

export default function EditorPanel({ validationIssues = [] }: { validationIssues?: ValidationIssue[] }) {
  const { activeSection } = useCVStore();
  const issuesBySection = groupIssuesBySection(validationIssues);
  const sectionIssues = issuesBySection[activeSection] ?? [];
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const previousSection = useRef(activeSection);

  // On stacked (mobile) layouts the editor sits below the section list; bring it into view when the section changes.
  useEffect(() => {
    if (previousSection.current === activeSection) return;
    previousSection.current = activeSection;
    if (!window.matchMedia('(max-width: 1023px)').matches) return;
    const heading = headingRef.current;
    if (!heading) return;
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    heading.focus({ preventScroll: true });
  }, [activeSection]);

  const heading = useMemo(() => {
    const map: Record<string, string> = {
      personalInfo: 'Personal Info',
      experience: 'Experience',
      skills: 'Skills',
      projects: 'Projects',
      education: 'Education',
      languages: 'Languages',
      certifications: 'Certifications',
      volunteer: 'Volunteer Work',
      awards: 'Awards',
      interests: 'Interests',
      references: 'References',
    };
    return map[activeSection] ?? 'Personal Info';
  }, [activeSection]);

  return (
    <div className="rounded-[1.5rem] border border-[#d9e2ef] bg-white p-6 shadow-none">
      <h3 ref={headingRef} tabIndex={-1} className="mb-6 scroll-mt-32 text-[22px] font-semibold tracking-[-0.02em] text-[#1f2937] outline-none">{heading}</h3>

      {/* Only this section's checks; overall progress lives in the sidebar. */}
      {sectionIssues.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Checks</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {sectionIssues.map((issue) => (
              <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {activeSection === 'personalInfo' && <PersonalInfoForm validationIssues={validationIssues} />}
      {activeSection === 'experience' && <ExperienceForm validationIssues={validationIssues} />}
      {activeSection === 'skills' && <SkillsForm />}
      {activeSection === 'projects' && <ProjectsForm validationIssues={validationIssues} />}
      {activeSection === 'education' && <EducationForm validationIssues={validationIssues} />}
      {activeSection === 'languages' && <LanguagesForm />}
      {activeSection === 'certifications' && <SimpleSectionForm section="certifications" title="Certifications" />}
      {activeSection === 'volunteer' && <SimpleSectionForm section="volunteer" title="Volunteer Work" />}
      {activeSection === 'awards' && <SimpleSectionForm section="awards" title="Awards" />}
      {activeSection === 'interests' && <InterestsForm />}
      {activeSection === 'references' && <SimpleSectionForm section="references" title="References" />}
    </div>
  );
}
