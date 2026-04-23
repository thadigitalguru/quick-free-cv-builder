import { ChevronDown, ChevronUp, EyeOff, Eye, Plus, X, FolderInput } from 'lucide-react';
import { sectionDefaults } from '../../data/sectionMeta';
import { useCVStore } from '../../store/cvStore';
import { Button } from '../shared/controls';
import { cn } from '../../utils/dom';

export default function SectionSidebar() {
  const { document, activeSection, setActiveSection, moveSection, toggleSectionVisibility, addOptionalSection, removeOptionalSection } = useCVStore();
  const optionalSections = sectionDefaults.filter((section) => section.optional);
  const hiddenOptionals = optionalSections.filter((section) => !document.sectionVisibility[section.id]);
  const sectionCounts: Record<string, number> = {
    personalInfo: 1,
    summary: document.personalInfo.summary ? 1 : 0,
    experience: document.experience.length,
    skills: document.skills.length,
    projects: document.projects.length,
    education: document.education.length,
    languages: document.languages.length,
    certifications: document.certifications.length,
    awards: document.awards.length,
  };

  return (
    <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Sections</h3>
          <p className="text-sm text-slate-500">Reorder, hide, or add optional sections.</p>
        </div>
        <Button variant="secondary" onClick={() => addOptionalSection(hiddenOptionals[0]?.id as 'certifications' | 'awards') } disabled={hiddenOptionals.length === 0}>
          <Plus className="h-4 w-4" /> Add section
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {hiddenOptionals.length > 0 && (
          <Button
            variant="secondary"
            className="text-xs"
            onClick={() => hiddenOptionals.forEach((section) => addOptionalSection(section.id as 'certifications' | 'awards'))}
          >
            <FolderInput className="h-3.5 w-3.5" /> Restore all optional
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {document.sectionOrder.map((sectionId, index) => {
          const meta = sectionDefaults.find((section) => section.id === sectionId)!;
          const visible = document.sectionVisibility[sectionId];
          return (
            <div
              key={sectionId}
              className={cn(
                'flex items-center gap-2 rounded-2xl border px-3 py-3 transition',
                activeSection === sectionId ? 'border-brand-200 bg-brand-50' : 'border-border bg-white',
              )}
            >
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setActiveSection(sectionId)}>
                <span className={cn('h-2.5 w-2.5 rounded-full', visible ? 'bg-emerald-500' : 'bg-slate-300')} />
                <span className="truncate text-sm font-medium text-ink">{meta.label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{sectionCounts[sectionId] ?? 0}</span>
                {!visible && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Hidden</span>}
              </button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => moveSection(sectionId, 'up')} disabled={index === 0} aria-label={`Move ${meta.label} up`}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => moveSection(sectionId, 'down')} disabled={index === document.sectionOrder.length - 1} aria-label={`Move ${meta.label} down`}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => toggleSectionVisibility(sectionId)} aria-label={`${visible ? 'Hide' : 'Show'} ${meta.label}`}>
                  {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                {meta.optional && visible && (
                  <Button
                    variant="ghost"
                    className="h-9 w-9 p-0 text-rose-600"
                    onClick={() => removeOptionalSection(sectionId as 'certifications' | 'awards')}
                    aria-label={`Remove ${meta.label}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-700">Optional sections</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {hiddenOptionals.length > 0 ? hiddenOptionals.map((section) => (
            <Button key={section.id} variant="secondary" className="text-xs" onClick={() => addOptionalSection(section.id as 'certifications' | 'awards')}>
              <FolderInput className="h-3.5 w-3.5" /> Add {section.label}
            </Button>
          )) : <span className="text-xs text-slate-500">All optional sections are already visible.</span>}
        </div>
        <p className="mt-3 text-xs text-slate-500">Optional sections can be hidden or removed from the workspace without deleting the content.</p>
      </div>
    </div>
  );
}
