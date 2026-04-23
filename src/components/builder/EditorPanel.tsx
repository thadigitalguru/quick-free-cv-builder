import { useMemo, useState, type ReactNode } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { useCVStore } from '../../store/cvStore';
import { Button, Input, Label, Select, Textarea } from '../shared/controls';
import { joinCsvList, parseCsvList } from '../../utils/cvUtils';
import { readFileAsDataUrl } from '../../utils/files';
import { groupIssuesBySection, type ValidationIssue } from '../../utils/validation';

export default function EditorPanel({ validationIssues = [] }: { validationIssues?: ValidationIssue[] }) {
  const { activeSection, clearSection } = useCVStore();
  const issuesBySection = groupIssuesBySection(validationIssues);

  const heading = useMemo(() => {
    const map: Record<string, string> = {
      personalInfo: 'Personal Info',
      summary: 'Professional Summary',
      experience: 'Experience',
      skills: 'Skills',
      projects: 'Projects',
      education: 'Education',
      languages: 'Languages',
      certifications: 'Certifications',
      awards: 'Awards',
    };
    return map[activeSection];
  }, [activeSection]);

  return (
    <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{heading}</h3>
          <p className="text-sm text-slate-500">Edit the selected section below.</p>
        </div>
        {activeSection !== 'personalInfo' && (
          <Button variant="secondary" className="text-xs" onClick={() => clearSection(activeSection as any)}>
            <Trash2 className="h-4 w-4" /> Clear section
          </Button>
        )}
      </div>

      {validationIssues.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Quick checks</p>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            {(issuesBySection[activeSection] ?? validationIssues).map((issue) => (
              <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {activeSection === 'personalInfo' && <PersonalInfoForm />}
      {activeSection === 'summary' && <SummaryForm />}
      {activeSection === 'experience' && <ExperienceForm />}
      {activeSection === 'skills' && <SkillsForm />}
      {activeSection === 'projects' && <ProjectsForm />}
      {activeSection === 'education' && <EducationForm />}
      {activeSection === 'languages' && <LanguagesForm />}
      {activeSection === 'certifications' && <SimpleSectionForm section="certifications" title="Certifications" />}
      {activeSection === 'awards' && <SimpleSectionForm section="awards" title="Awards" />}
    </div>
  );
}

function PersonalInfoForm() {
  const { document, updatePersonalInfo, updateProfilePhoto } = useCVStore();
  const info = document.personalInfo;

  return (
    <div className="grid gap-4">
      <Field label="Full name"><Input value={info.fullName} onChange={(e) => updatePersonalInfo('fullName', e.target.value)} placeholder="Jane Doe" /></Field>
      <Field label="Job title"><Input value={info.jobTitle} onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)} placeholder="Product Designer" /></Field>
      <Field label="Email"><Input value={info.email} onChange={(e) => updatePersonalInfo('email', e.target.value)} placeholder="jane@example.com" /></Field>
      <Field label="Phone"><Input value={info.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} placeholder="+1 234 567 890" /></Field>
      <Field label="Location"><Input value={info.location} onChange={(e) => updatePersonalInfo('location', e.target.value)} placeholder="Lagos, Nigeria" /></Field>
      <Field label="LinkedIn"><Input value={info.linkedinUrl} onChange={(e) => updatePersonalInfo('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/janedoe" /></Field>
      <Field label="Website"><Input value={info.websiteUrl} onChange={(e) => updatePersonalInfo('websiteUrl', e.target.value)} placeholder="https://janedoe.com" /></Field>
      <Field label="Profile photo">
        <div className="flex items-center gap-4">
          {info.profilePhoto ? (
            <img src={info.profilePhoto} alt="Profile preview" className="h-16 w-16 rounded-2xl border border-border object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-border bg-slate-50 text-xs text-slate-500">No photo</div>
          )}
          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept="image/*"
              className="w-full rounded-2xl border border-border bg-white px-3.5 py-2.5 text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                updateProfilePhoto(await readFileAsDataUrl(file));
              }}
            />
            {info.profilePhoto && (
              <Button variant="secondary" className="text-xs" onClick={() => updateProfilePhoto('')}>
                Remove photo
              </Button>
            )}
          </div>
        </div>
      </Field>
    </div>
  );
}

function SummaryForm() {
  const { document, updateSummary } = useCVStore();

  return (
    <Field label="Professional summary">
      <Textarea value={document.personalInfo.summary} onChange={(e) => updateSummary(e.target.value)} rows={10} placeholder="Write a concise, achievement-focused summary..." />
    </Field>
  );
}

function ExperienceForm() {
  const { document, addExperience, duplicateExperience, updateExperience, deleteExperience, moveExperience } = useCVStore();

  return (
    <div className="space-y-4">
      {document.experience.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold">Experience {index + 1}</h4>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveExperience(item.id, 'up')} disabled={index === 0}>Up</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveExperience(item.id, 'down')} disabled={index === document.experience.length - 1}>Down</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => duplicateExperience(item.id)}><Copy className="h-4 w-4" /></Button>
              <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" onClick={() => deleteExperience(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Role"><Input value={item.role} onChange={(e) => updateExperience(item.id, { role: e.target.value })} /></Field>
            <Field label="Company"><Input value={item.company} onChange={(e) => updateExperience(item.id, { company: e.target.value })} /></Field>
            <Field label="Location"><Input value={item.location} onChange={(e) => updateExperience(item.id, { location: e.target.value })} /></Field>
            <Field label="Start date"><Input value={item.startDate} onChange={(e) => updateExperience(item.id, { startDate: e.target.value })} placeholder="YYYY-MM" /></Field>
            <Field label="End date"><Input value={item.endDate} onChange={(e) => updateExperience(item.id, { endDate: e.target.value })} placeholder="YYYY-MM" disabled={item.isCurrent} /></Field>
            <Field label="Current role">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={item.isCurrent}
                  onChange={(e) => updateExperience(item.id, { isCurrent: e.target.checked, endDate: e.target.checked ? '' : item.endDate })}
                />
                Yes
              </label>
            </Field>
          </div>
          <div className="mt-4 grid gap-3">
            <Field label="Achievements (one per line)">
              <Textarea rows={6} value={item.achievements.join('\n')} onChange={(e) => updateExperience(item.id, { achievements: e.target.value.split('\n').filter(Boolean) })} />
            </Field>
            <Field label="Technologies (comma separated)"><Input value={joinCsvList(item.technologies)} onChange={(e) => updateExperience(item.id, { technologies: parseCsvList(e.target.value) })} /></Field>
          </div>
        </div>
      ))}
      <Button onClick={addExperience} variant="secondary"><Plus className="h-4 w-4" /> Add experience</Button>
    </div>
  );
}

function EducationForm() {
  const { document, addEducation, duplicateEducation, updateEducation, deleteEducation, moveEducation } = useCVStore();

  return (
    <div className="space-y-4">
      {document.education.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold">Education {index + 1}</h4>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveEducation(item.id, 'up')} disabled={index === 0}>Up</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveEducation(item.id, 'down')} disabled={index === document.education.length - 1}>Down</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => duplicateEducation(item.id)}><Copy className="h-4 w-4" /></Button>
              <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" onClick={() => deleteEducation(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Institution"><Input value={item.institution} onChange={(e) => updateEducation(item.id, { institution: e.target.value })} /></Field>
            <Field label="Qualification"><Input value={item.qualification} onChange={(e) => updateEducation(item.id, { qualification: e.target.value })} /></Field>
            <Field label="Field of study"><Input value={item.fieldOfStudy} onChange={(e) => updateEducation(item.id, { fieldOfStudy: e.target.value })} /></Field>
            <Field label="Start date"><Input value={item.startDate} onChange={(e) => updateEducation(item.id, { startDate: e.target.value })} /></Field>
            <Field label="End date"><Input value={item.endDate} onChange={(e) => updateEducation(item.id, { endDate: e.target.value })} /></Field>
            <Field label="Description"><Textarea rows={4} value={item.description} onChange={(e) => updateEducation(item.id, { description: e.target.value })} /></Field>
          </div>
        </div>
      ))}
      <Button onClick={addEducation} variant="secondary"><Plus className="h-4 w-4" /> Add education</Button>
    </div>
  );
}

function SkillsForm() {
  const { document, setSkills } = useCVStore();
  const [draft, setDraft] = useState('');

  const addSkill = (skill: string) => {
    const next = skill.trim();
    if (!next) return;
    if (document.skills.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    setSkills([...document.skills, next]);
    setDraft('');
  };

  const removeSkill = (skill: string) => {
    setSkills(document.skills.filter((item) => item !== skill));
  };

  return (
    <div className="space-y-4">
      <Field label="Add a skill">
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill(draft);
              }
            }}
            placeholder="e.g. Figma"
          />
          <Button variant="secondary" onClick={() => addSkill(draft)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </Field>

      <div className="flex flex-wrap gap-2">
        {document.skills.map((skill) => (
          <button
            key={skill}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
            onClick={() => removeSkill(skill)}
            title="Remove skill"
          >
            {skill}
            <span className="text-slate-400">×</span>
          </button>
        ))}
      </div>

      <Field label="Skills (comma separated)">
        <Textarea rows={6} value={document.skills.join(', ')} onChange={(e) => setSkills(parseCsvList(e.target.value))} placeholder="React, TypeScript, Accessibility" />
      </Field>
    </div>
  );
}

function ProjectsForm() {
  const { document, addProject, duplicateProject, updateProject, deleteProject, moveProject } = useCVStore();

  return (
    <div className="space-y-4">
      {document.projects.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold">Project {index + 1}</h4>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveProject(item.id, 'up')} disabled={index === 0}>Up</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveProject(item.id, 'down')} disabled={index === document.projects.length - 1}>Down</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => duplicateProject(item.id)}><Copy className="h-4 w-4" /></Button>
              <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" onClick={() => deleteProject(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Name"><Input value={item.name} onChange={(e) => updateProject(item.id, { name: e.target.value })} /></Field>
            <Field label="Role"><Input value={item.role} onChange={(e) => updateProject(item.id, { role: e.target.value })} /></Field>
            <Field label="Date"><Input value={item.date} onChange={(e) => updateProject(item.id, { date: e.target.value })} /></Field>
            <Field label="Link"><Input value={item.link} onChange={(e) => updateProject(item.id, { link: e.target.value })} /></Field>
            <Field label="Description"><Textarea rows={4} value={item.description} onChange={(e) => updateProject(item.id, { description: e.target.value })} /></Field>
            <Field label="Technologies"><Input value={joinCsvList(item.technologies)} onChange={(e) => updateProject(item.id, { technologies: parseCsvList(e.target.value) })} /></Field>
          </div>
        </div>
      ))}
      <Button onClick={addProject} variant="secondary"><Plus className="h-4 w-4" /> Add project</Button>
    </div>
  );
}

function LanguagesForm() {
  const { document, addLanguage, duplicateLanguage, updateLanguage, deleteLanguage, moveLanguage } = useCVStore();

  return (
    <div className="space-y-4">
      {document.languages.map((item, index) => (
        <div key={item.id} className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Language"><Input value={item.name} onChange={(e) => updateLanguage(item.id, { name: e.target.value })} /></Field>
          <Field label="Proficiency">
            <Select value={item.proficiency} onChange={(e) => updateLanguage(item.id, { proficiency: e.target.value as any })}>
              {['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'].map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </Select>
          </Field>
          <div className="flex gap-2">
            <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveLanguage(item.id, 'up')} disabled={index === 0}>Up</Button>
            <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveLanguage(item.id, 'down')} disabled={index === document.languages.length - 1}>Down</Button>
            <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => duplicateLanguage(item.id)}><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" onClick={() => deleteLanguage(item.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
      <Button onClick={addLanguage} variant="secondary"><Plus className="h-4 w-4" /> Add language</Button>
    </div>
  );
}

function SimpleSectionForm({ section, title }: { section: 'certifications' | 'awards'; title: string }) {
  const { document, addSimpleItem, duplicateSimpleItem, updateSimpleItem, deleteSimpleItem } = useCVStore();
  const items = document[section];

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={`${title} title`}><Input value={item.title} onChange={(e) => updateSimpleItem(section, item.id, { title: e.target.value })} /></Field>
            <Field label="Details"><Input value={item.details} onChange={(e) => updateSimpleItem(section, item.id, { details: e.target.value })} /></Field>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => duplicateSimpleItem(section, item.id)}><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" onClick={() => deleteSimpleItem(section, item.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
      <Button onClick={() => addSimpleItem(section)} variant="secondary"><Plus className="h-4 w-4" /> Add {title.toLowerCase()}</Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
