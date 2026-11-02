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

/** The active section's form; SectionSidebar shows it inside that section's card. */
export default function EditorPanel({ validationIssues = [] }: { validationIssues?: ValidationIssue[] }) {
  const { activeSection } = useCVStore();
  const issuesBySection = groupIssuesBySection(validationIssues);
  const sectionIssues = issuesBySection[activeSection] ?? [];

  return (
    <div>
      {/* Only this section's checks; overall progress lives above the section list. */}
      {sectionIssues.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
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
