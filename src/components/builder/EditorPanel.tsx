import { useMemo, useState, type ReactNode } from 'react';
import { Copy, Info, Plus, Trash2 } from 'lucide-react';
import { useCVStore } from '../../store/cvStore';
import { Button, Input, Label, Select, Textarea } from '../shared/controls';
import { joinCsvList, parseCsvList } from '../../utils/cvUtils';
import { readFileAsDataUrl } from '../../utils/files';
import { cn } from '../../utils/dom';
import { fieldKey, groupIssuesBySection, type ValidationIssue } from '../../utils/validation';

export default function EditorPanel({ validationIssues = [] }: { validationIssues?: ValidationIssue[] }) {
  const { activeSection } = useCVStore();
  const issuesBySection = groupIssuesBySection(validationIssues);

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
      <h3 className="mb-6 text-[22px] font-semibold tracking-[-0.02em] text-[#1f2937]">{heading}</h3>

      {validationIssues.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Checks</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {(issuesBySection[activeSection] ?? validationIssues).map((issue) => (
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

const buildIssueLookup = (issues: ValidationIssue[]) => new Map(issues.map((issue) => [issue.field, issue.message]));

function PersonalInfoForm({ validationIssues }: { validationIssues: ValidationIssue[] }) {
  const { document, updatePersonalInfo, updateProfilePhoto, removeProfilePhoto } = useCVStore();
  const info = document.personalInfo;
  const issueMap = useMemo(() => buildIssueLookup(validationIssues), [validationIssues]);
  const fieldError = (field: string) => issueMap.get(field);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="grid gap-5">
        <Field label="Full Name *" error={fieldError('fullName')}>
          <Input
            value={info.fullName}
            onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
            aria-invalid={Boolean(fieldError('fullName'))}
            required
            className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError('fullName') && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
          />
        </Field>

        <Field label="Job Title">
          <Input
            value={info.jobTitle}
            onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
            placeholder="Software Engineer, Product Designer, etc."
            autoComplete="organization-title"
            className="h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]"
          />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-[15px] font-semibold text-[#374151]">Summary / Objective</label>
            <Button variant="ghost" className="h-auto self-start px-2 py-1 text-xs leading-none text-slate-500" onClick={() => useCVStore.getState().clearSection('summary')}>Clear summary</Button>
          </div>
          <Textarea
            value={info.summary}
            onChange={(e) => updatePersonalInfo('summary', e.target.value)}
            rows={4}
            placeholder="2–4 lines summarizing your experience and goals. Markdown supported."
            className="min-h-[108px] rounded-[12px] border-[#cbd6e4] px-4 py-3 text-[15px] placeholder:text-[#a1aab8]"
          />
          <p className="mt-2 flex items-center gap-2 text-[13px] text-[#8390a6]">
            Tip: use <strong className="font-semibold text-[#5b6780]">**bold**</strong> for emphasis and <strong className="font-semibold text-[#5b6780]">*bullets*</strong> if needed.
            <Info className="h-4 w-4 shrink-0" />
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email *" error={fieldError('email')}>
            <Input
              type="email"
              value={info.email}
              onChange={(e) => updatePersonalInfo('email', e.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
              inputMode="email"
              aria-invalid={Boolean(fieldError('email'))}
              className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError('email') && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
            />
          </Field>
          <Field label="Phone">
            <Input
              type="tel"
              value={info.phone}
              onChange={(e) => updatePersonalInfo('phone', e.target.value)}
              placeholder="+1 234 567 890"
              autoComplete="tel"
              inputMode="tel"
              className="h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Location">
            <Input
              value={info.location}
              onChange={(e) => updatePersonalInfo('location', e.target.value)}
              placeholder="City, Country"
              autoComplete="address-level2"
              className="h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]"
            />
          </Field>
          <Field label="LinkedIn URL" error={fieldError('linkedinUrl')}>
            <Input
              type="url"
              value={info.linkedinUrl}
              onChange={(e) => updatePersonalInfo('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/you"
              inputMode="url"
              autoComplete="url"
              aria-invalid={Boolean(fieldError('linkedinUrl'))}
              className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError('linkedinUrl') && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
            />
          </Field>
        </div>

        <Field label="Personal Website" error={fieldError('websiteUrl')}>
          <Input
            type="url"
            value={info.websiteUrl}
            onChange={(e) => updatePersonalInfo('websiteUrl', e.target.value)}
            placeholder="https://your-portfolio.com"
            inputMode="url"
            autoComplete="url"
            aria-invalid={Boolean(fieldError('websiteUrl'))}
            className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError('websiteUrl') && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
          />
        </Field>
      </div>

      <div className="pt-9 lg:pl-6">
        <div className="text-[15px] font-semibold text-[#374151]">Profile Photo</div>
        <div className="mt-6 flex flex-col items-center lg:items-start">
          {info.profilePhoto ? (
            <div className="relative h-[142px] w-[142px] overflow-hidden rounded-full border border-dashed border-[#c9d3e2] bg-[#f6f8fc]">
              <img
                src={info.profilePhoto}
                alt="Profile preview"
                className="h-full w-full object-cover"
                style={{
                  transform: `translate(${info.photoX - 50}%, ${info.photoY - 50}%) scale(${info.photoZoom})`,
                  transformOrigin: 'center center',
                  objectPosition: '50% 50%',
                }}
              />
            </div>
          ) : (
            <div className="grid h-[142px] w-[142px] place-items-center rounded-full border border-dashed border-[#c9d3e2] bg-[#f6f8fc] text-[14px] font-medium text-[#96a3bb]">
              No photo
            </div>
          )}

          <div className="mt-6 w-full max-w-[220px]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="profile-photo-upload"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                updateProfilePhoto(await readFileAsDataUrl(file));
              }}
            />
            <label htmlFor="profile-photo-upload" className="block">
              <Button variant="secondary" className="h-[46px] w-full rounded-[12px] border-[#c3cde0] bg-white px-5 text-[15px] font-semibold text-[#374151] shadow-[0_2px_0_rgba(15,23,42,0.02)]">
                Upload photo
              </Button>
            </label>
            <p className="mt-4 text-center text-[13px] leading-5 text-[#8a97ac]">Recommended: use a square image, at least 400×400px.</p>
          </div>

          {info.profilePhoto && (
            <div className="mt-6 w-full max-w-[260px] space-y-4 rounded-[16px] border border-[#e3eaf4] bg-[#f8fbff] p-4">
              <PhotoControl
                label="Zoom"
                value={info.photoZoom}
                min={0.8}
                max={2.4}
                step={0.05}
                onChange={(value) => updatePersonalInfo('photoZoom', value)}
              />
              <PhotoControl
                label="X position"
                value={info.photoX}
                min={0}
                max={100}
                step={1}
                onChange={(value) => updatePersonalInfo('photoX', value)}
              />
              <PhotoControl
                label="Y position"
                value={info.photoY}
                min={0}
                max={100}
                step={1}
                onChange={(value) => updatePersonalInfo('photoY', value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="h-10 flex-1 rounded-[12px] border-[#c3cde0] bg-white px-3 text-xs font-semibold text-[#374151]" onClick={() => {
                  updatePersonalInfo('photoZoom', 1);
                  updatePersonalInfo('photoX', 50);
                  updatePersonalInfo('photoY', 50);
                }}>
                  Reset crop
                </Button>
                <Button variant="ghost" className="h-10 rounded-[12px] px-3 text-xs font-semibold text-slate-500" onClick={removeProfilePhoto}>
                  Remove photo
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExperienceForm({ validationIssues }: { validationIssues: ValidationIssue[] }) {
  const { document, addExperience, duplicateExperience, updateExperience, deleteExperience, moveExperience, clearSection } = useCVStore();
  const issueMap = useMemo(() => buildIssueLookup(validationIssues), [validationIssues]);
  const fieldError = (field: string) => issueMap.get(field);

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
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" className="px-3 py-2 text-xs leading-none text-slate-500" onClick={() => clearSection('experience')}>Clear section</Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Role"><Input value={item.role} onChange={(e) => updateExperience(item.id, { role: e.target.value })} /></Field>
            <Field label="Company"><Input value={item.company} onChange={(e) => updateExperience(item.id, { company: e.target.value })} /></Field>
            <Field label="Location"><Input value={item.location} onChange={(e) => updateExperience(item.id, { location: e.target.value })} /></Field>
            <Field label="Start date" error={fieldError(fieldKey('experience', item.id, 'startDate'))}>
              <Input
                value={item.startDate}
                onChange={(e) => updateExperience(item.id, { startDate: e.target.value })}
                placeholder="YYYY or YYYY-MM"
                inputMode="numeric"
                aria-invalid={Boolean(fieldError(fieldKey('experience', item.id, 'startDate')))}
                className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError(fieldKey('experience', item.id, 'startDate')) && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
              />
            </Field>
            <Field label="End date" error={fieldError(fieldKey('experience', item.id, 'endDate'))}>
              <Input
                value={item.endDate}
                onChange={(e) => updateExperience(item.id, { endDate: e.target.value })}
                placeholder="YYYY or YYYY-MM"
                inputMode="numeric"
                aria-invalid={Boolean(fieldError(fieldKey('experience', item.id, 'endDate')))}
                className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError(fieldKey('experience', item.id, 'endDate')) && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Current role">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={item.isCurrent} onChange={(e) => updateExperience(item.id, { isCurrent: e.target.checked })} />
                  Yes
                </label>
              </Field>
              {item.isCurrent && <p className="mt-1 text-xs text-slate-500">Shown as Present in the CV preview.</p>}
            </div>
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

function EducationForm({ validationIssues }: { validationIssues: ValidationIssue[] }) {
  const { document, addEducation, duplicateEducation, updateEducation, deleteEducation, moveEducation, clearSection } = useCVStore();
  const issueMap = useMemo(() => buildIssueLookup(validationIssues), [validationIssues]);
  const fieldError = (field: string) => issueMap.get(field);

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
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" className="px-3 py-2 text-xs leading-none text-slate-500" onClick={() => clearSection('education')}>Clear section</Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Institution"><Input value={item.institution} onChange={(e) => updateEducation(item.id, { institution: e.target.value })} /></Field>
            <Field label="Qualification"><Input value={item.qualification} onChange={(e) => updateEducation(item.id, { qualification: e.target.value })} /></Field>
            <Field label="Field of study"><Input value={item.fieldOfStudy} onChange={(e) => updateEducation(item.id, { fieldOfStudy: e.target.value })} /></Field>
            <Field label="Start date" error={fieldError(fieldKey('education', item.id, 'startDate'))}>
              <Input
                value={item.startDate}
                onChange={(e) => updateEducation(item.id, { startDate: e.target.value })}
                placeholder="YYYY or YYYY-MM"
                inputMode="numeric"
                aria-invalid={Boolean(fieldError(fieldKey('education', item.id, 'startDate')))}
                className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError(fieldKey('education', item.id, 'startDate')) && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
              />
            </Field>
            <Field label="End date" error={fieldError(fieldKey('education', item.id, 'endDate'))}>
              <Input
                value={item.endDate}
                onChange={(e) => updateEducation(item.id, { endDate: e.target.value })}
                placeholder="YYYY or YYYY-MM"
                inputMode="numeric"
                aria-invalid={Boolean(fieldError(fieldKey('education', item.id, 'endDate')))}
                className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError(fieldKey('education', item.id, 'endDate')) && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
              />
            </Field>
            <Field label="Description"><Textarea rows={4} value={item.description} onChange={(e) => updateEducation(item.id, { description: e.target.value })} /></Field>
          </div>
        </div>
      ))}
      <Button onClick={addEducation} variant="secondary"><Plus className="h-4 w-4" /> Add education</Button>
    </div>
  );
}

function SkillsForm() {
  const { document, setSkills, clearSection } = useCVStore();
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
      <div className="flex justify-end">
        <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection('skills')}>Clear section</Button>
      </div>
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

function ProjectsForm({ validationIssues }: { validationIssues: ValidationIssue[] }) {
  const { document, addProject, duplicateProject, updateProject, deleteProject, moveProject, clearSection } = useCVStore();
  const issueMap = useMemo(() => buildIssueLookup(validationIssues), [validationIssues]);
  const fieldError = (field: string) => issueMap.get(field);

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
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection('projects')}>Clear section</Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Name"><Input value={item.name} onChange={(e) => updateProject(item.id, { name: e.target.value })} /></Field>
            <Field label="Role"><Input value={item.role} onChange={(e) => updateProject(item.id, { role: e.target.value })} /></Field>
            <Field label="Date" error={fieldError(fieldKey('projects', item.id, 'date'))}>
              <Input
                value={item.date}
                onChange={(e) => updateProject(item.id, { date: e.target.value })}
                placeholder="YYYY or YYYY-MM"
                inputMode="numeric"
                aria-invalid={Boolean(fieldError(fieldKey('projects', item.id, 'date')))}
                className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError(fieldKey('projects', item.id, 'date')) && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
              />
            </Field>
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
  const { document, addLanguage, duplicateLanguage, updateLanguage, deleteLanguage, moveLanguage, clearSection } = useCVStore();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection('languages')}>Clear section</Button>
      </div>
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

function InterestsForm() {
  const { document: cvDocument, setInterests, clearSection } = useCVStore();
  const [draft, setDraft] = useState('');

  const updateInterests = (next: string[]) => {
    setInterests(next);
  };

  const add = (interest: string) => {
    const next = interest.trim();
    if (!next) return;
    if (cvDocument.interests.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    updateInterests([...cvDocument.interests, next]);
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection('interests')}>Clear section</Button>
      </div>
      <Field label="Add an interest">
        <div className="flex gap-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(draft); } }} placeholder="e.g. Travel" />
          <Button variant="secondary" onClick={() => add(draft)}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </Field>
      <div className="flex flex-wrap gap-2">
        {cvDocument.interests.map((interest) => (
          <button key={interest} type="button" className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-sm text-slate-700" onClick={() => updateInterests(cvDocument.interests.filter((item) => item !== interest))}>
            {interest} <span className="text-slate-400">×</span>
          </button>
        ))}
      </div>
      <Field label="Interests (comma separated)">
        <Textarea rows={4} value={cvDocument.interests.join(', ')} onChange={(e) => updateInterests(parseCsvList(e.target.value))} />
      </Field>
    </div>
  );
}

function SimpleSectionForm({ section, title }: { section: 'certifications' | 'volunteer' | 'awards' | 'references'; title: string }) {
  const { document, addSimpleItem, duplicateSimpleItem, updateSimpleItem, deleteSimpleItem, clearSection } = useCVStore();
  const items = document[section];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection(section)}>Clear section</Button>
      </div>
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

function Field({ label, children, error, hint }: { label: string; children: ReactNode; error?: string | null; hint?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

function PhotoControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm font-medium text-[#425067]">
        <span>{label}</span>
        <span className="tabular-nums text-[#6e7f99]">{Number.isInteger(value) ? value : value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-brand-600"
      />
    </div>
  );
}
