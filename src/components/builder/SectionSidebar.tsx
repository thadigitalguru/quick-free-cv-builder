import { ChevronDown, ChevronUp, Eye, EyeOff, FolderInput, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sectionDefaults } from '../../data/sectionMeta';
import { useCVStore } from '../../store/cvStore';
import { Button } from '../shared/controls';
import { cn } from '../../utils/dom';

export default function SectionSidebar() {
  const {
    document,
    activeSection,
    setActiveSection,
    moveSection,
    moveSectionToIndex,
    toggleSectionVisibility,
    addOptionalSection,
    removeOptionalSection,
  } = useCVStore();

  const [draggingSection, setDraggingSection] = useState<string | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  const optionalSections = sectionDefaults.filter((section) => section.optional);
  const hiddenOptionals = optionalSections.filter((section) => !document.sectionVisibility[section.id]);
  const orderedSections = useMemo(() => document.sectionOrder, [document.sectionOrder]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeSection]);

  const sectionCounts: Record<string, number> = {
    personalInfo: 1,
    summary: document.personalInfo.summary ? 1 : 0,
    experience: document.experience.length,
    skills: document.skills.length,
    projects: document.projects.length,
    education: document.education.length,
    languages: document.languages.length,
    certifications: document.certifications.length,
    volunteer: document.volunteer.length,
    awards: document.awards.length,
    interests: document.interests.length,
    references: document.references.length,
  };

  const handleAddOptional = () => {
    const firstHidden = hiddenOptionals[0]?.id;
    if (!firstHidden) return;
    addOptionalSection(firstHidden as 'certifications' | 'volunteer' | 'awards' | 'references');
  };

  return (
    <aside className="rounded-[2rem] border border-border bg-white p-4 shadow-soft sticky top-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Sections</h3>
          <p className="mt-1 text-sm text-slate-500">Drag to reorder or use the controls.</p>
        </div>
        <Button variant="secondary" className="h-10 px-3 text-sm" onClick={handleAddOptional} disabled={hiddenOptionals.length === 0}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span>{hiddenOptionals.length ? `${hiddenOptionals.length} optional hidden` : 'All optional visible'}</span>
        <button
          type="button"
          className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
          onClick={() => hiddenOptionals.forEach((section) => addOptionalSection(section.id as 'certifications' | 'volunteer' | 'awards' | 'references'))}
          disabled={hiddenOptionals.length === 0}
        >
          <FolderInput className="h-3.5 w-3.5" /> Restore all
        </button>
      </div>

      <div className="mt-4 space-y-2 max-h-[52vh] overflow-auto pr-1">
        {orderedSections.map((sectionId, index) => {
          const meta = sectionDefaults.find((section) => section.id === sectionId)!;
          const visible = document.sectionVisibility[sectionId];
          const count = sectionCounts[sectionId] ?? 0;
          const active = activeSection === sectionId;

          return (
            <div
              key={sectionId}
              draggable
              onDragStart={() => setDraggingSection(sectionId)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!draggingSection || draggingSection === sectionId) return;
                const targetIndex = orderedSections.indexOf(sectionId);
                if (targetIndex === -1) return;
                moveSectionToIndex(draggingSection as any, targetIndex);
                setDraggingSection(null);
              }}
              onDragEnd={() => setDraggingSection(null)}
              className={cn(
                'rounded-2xl border p-3 transition',
                draggingSection === sectionId
                  ? 'border-brand-400 bg-brand-50/80'
                  : active
                    ? 'border-brand-200 bg-brand-50'
                    : 'border-border bg-white hover:bg-slate-50',
              )}
            >
              <button
                ref={active ? activeRef : null}
                type="button"
                onClick={() => setActiveSection(sectionId)}
                className="flex w-full items-center gap-3 text-left"
                title="Click to edit; drag to reorder"
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', visible ? 'bg-emerald-500' : 'bg-slate-300')} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{meta.label}</span>
                  <span className="block text-xs text-slate-500">{count} item{count === 1 ? '' : 's'}</span>
                </span>
                {!visible && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">Hidden</span>}
              </button>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => moveSection(sectionId, 'up')} disabled={index === 0} aria-label={`Move ${meta.label} up`}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => moveSection(sectionId, 'down')} disabled={index === orderedSections.length - 1} aria-label={`Move ${meta.label} down`}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => toggleSectionVisibility(sectionId)} aria-label={`${visible ? 'Hide' : 'Show'} ${meta.label}`}>
                    {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  {meta.optional && visible && (
                    <Button variant="ghost" className="h-8 w-8 p-0 text-rose-600" onClick={() => removeOptionalSection(sectionId as any)} aria-label={`Remove ${meta.label}`}>
                      ×
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-medium text-slate-700">Tip</p>
        <p className="mt-1">Drag section cards to reorder, or use the arrows for precise movement.</p>
      </div>
    </aside>
  );
}
