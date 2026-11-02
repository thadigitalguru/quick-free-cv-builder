import {
  Award,
  BadgeCheck,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  EyeOff,
  FolderKanban,
  GraduationCap,
  GripVertical,
  HandHeart,
  Languages,
  Plus,
  Smile,
  User,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sectionDefaults, sectionLabelMap } from '../../data/sectionMeta';
import { useCVStore } from '../../store/cvStore';
import { cn } from '../../utils/dom';
import type { SectionId } from '../../types/cv';
import { getEssentialProgress, getSectionStatus } from '../../utils/progress';
import type { ValidationIssue } from '../../utils/validation';
import EditorPanel from './EditorPanel';

const sectionIcons: Record<SectionId, LucideIcon> = {
  personalInfo: User,
  summary: User,
  experience: Briefcase,
  skills: Wrench,
  projects: FolderKanban,
  education: GraduationCap,
  languages: Languages,
  certifications: BadgeCheck,
  volunteer: HandHeart,
  awards: Award,
  interests: Smile,
  references: Users,
};

/** One collapsible card per CV section; the open card holds that section's form. */
export default function SectionSidebar({ validationIssues = [] }: { validationIssues?: ValidationIssue[] }) {
  const { document, activeSection, setActiveSection, moveSection, moveSectionToIndex, toggleSectionVisibility } = useCVStore();
  const [menuOpen, setMenuOpen] = useState(false);
  // Clicking the open card's header folds it away; opening another section always unfolds.
  const [collapsed, setCollapsed] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<SectionId | null>(null);
  const [dropTargetSectionId, setDropTargetSectionId] = useState<SectionId | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const progress = useMemo(() => getEssentialProgress(document), [document]);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const previousSection = useRef(activeSection);

  const orderedSections = useMemo(
    () => document.sectionOrder.filter((sectionId) => sectionId !== 'summary' && document.sectionVisibility[sectionId]),
    [document.sectionOrder, document.sectionVisibility],
  );

  const hiddenSections = useMemo(
    () =>
      document.sectionOrder
        .filter((sectionId) => sectionId !== 'personalInfo' && !document.sectionVisibility[sectionId])
        .map((sectionId) => sectionDefaults.find((section) => section.id === sectionId)!)
        .filter(Boolean),
    [document.sectionOrder, document.sectionVisibility],
  );

  // A newly opened section (from its header, "Next", or Add section) unfolds and scrolls into view.
  useEffect(() => {
    if (previousSection.current === activeSection) return;
    previousSection.current = activeSection;
    setCollapsed(false);
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeSection]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const resetDragState = () => {
    setDraggedSectionId(null);
    setDropTargetSectionId(null);
  };

  const handleDropBefore = (targetSectionId: SectionId) => {
    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      resetDragState();
      return;
    }

    const currentIndex = document.sectionOrder.indexOf(draggedSectionId);
    const targetIndex = document.sectionOrder.indexOf(targetSectionId);
    if (currentIndex < 0 || targetIndex < 0) {
      resetDragState();
      return;
    }

    const insertionIndex = currentIndex < targetIndex ? targetIndex - 1 : targetIndex;
    moveSectionToIndex(draggedSectionId, insertionIndex);
    resetDragState();
  };

  const handleDropToEnd = () => {
    if (!draggedSectionId) {
      resetDragState();
      return;
    }

    moveSectionToIndex(draggedSectionId, document.sectionOrder.length - 1);
    resetDragState();
  };

  const iconButton = 'grid h-8 w-8 place-items-center rounded-full text-[#5f6d86] transition hover:bg-slate-100 hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-30';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#d9e2ef] bg-white px-4 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between text-sm font-semibold text-[#34425c]">
          <span id="essentials-label">Essentials</span>
          <span>
            {progress.done} of {progress.total} done
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-[#e6ecf4]"
          role="progressbar"
          aria-labelledby="essentials-label"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
        >
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
        {progress.next ? (
          <button
            type="button"
            className="mt-2.5 text-sm font-semibold text-brand-700 underline-offset-2 hover:underline"
            onClick={() => setActiveSection(progress.next!)}
          >
            Next: {sectionLabelMap[progress.next]} →
          </button>
        ) : (
          <p className="mt-2.5 text-sm text-emerald-700">Ready to preview and export.</p>
        )}
        <p className="mt-2 hidden text-xs text-[#5d6b84] lg:block">Tip: drag a section by its handle to reorder, or use Alt + ↑ / ↓ on its title.</p>
      </div>

      <h2 className="sr-only">CV sections</h2>

      <nav aria-label="CV sections" className="space-y-3">
        {orderedSections.map((sectionId, index) => {
          const meta = sectionDefaults.find((section) => section.id === sectionId)!;
          const Icon = sectionIcons[sectionId];
          const active = activeSection === sectionId;
          const open = active && !collapsed;
          const canToggle = sectionId !== 'personalInfo';
          const isDragged = draggedSectionId === sectionId;
          const isDropTarget = dropTargetSectionId === sectionId;
          const complete = getSectionStatus(document, sectionId) === 'complete';
          const panelId = `section-panel-${sectionId}`;
          const headerId = `section-header-${sectionId}`;

          return (
            <div
              key={sectionId}
              ref={active ? activeRef : null}
              onDragOver={(event) => {
                if (!draggedSectionId || draggedSectionId === sectionId) return;
                event.preventDefault();
                setDropTargetSectionId(sectionId);
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDropBefore(sectionId);
              }}
              className={cn(
                'scroll-mt-24 rounded-2xl border bg-white transition',
                open ? 'border-brand-500/40 shadow-[0_12px_32px_rgba(37,99,235,0.10)]' : 'border-[#d9e2ef] shadow-[0_4px_14px_rgba(15,23,42,0.04)] hover:border-[#bfcce0]',
                isDropTarget && 'border-brand-500 bg-brand-50/70',
                isDragged && 'opacity-60',
              )}
            >
              {/* Only the header drags, so selecting text in the form below never picks the card up. */}
              <div
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', sectionId);
                  setDraggedSectionId(sectionId);
                }}
                onDragEnd={resetDragState}
                aria-grabbed={isDragged}
                className={cn('group flex items-center gap-1 py-1.5 pl-1.5 pr-2', open && 'border-b border-[#e6ecf4]')}
              >
                <span className="grid h-8 w-6 shrink-0 cursor-grab place-items-center text-[#b4bfd0] transition group-hover:text-[#5f6d86]" title="Drag to reorder" aria-hidden="true">
                  <GripVertical className="h-4 w-4" />
                </span>
                <h3 className="min-w-0 flex-1">
                  <button
                    id={headerId}
                    type="button"
                    onClick={() => (active ? setCollapsed((value) => !value) : setActiveSection(sectionId))}
                    onKeyDown={(event) => {
                      if (event.altKey && event.key === 'ArrowUp') {
                        event.preventDefault();
                        moveSection(sectionId, 'up');
                      }
                      if (event.altKey && event.key === 'ArrowDown') {
                        event.preventDefault();
                        moveSection(sectionId, 'down');
                      }
                    }}
                    aria-expanded={open}
                    aria-controls={panelId}
                    aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                    className="flex min-h-[48px] w-full items-center gap-2.5 rounded-xl px-1.5 text-left sm:gap-3 sm:px-2"
                  >
                    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', open ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-600')} aria-hidden="true">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[16px] font-semibold tracking-[-0.01em] text-[#1f2937]">
                      {meta.label}
                      <span className="sr-only">{complete ? ', complete' : ', not started'}</span>
                    </span>
                    {complete && <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />}
                    <ChevronDown className={cn('hidden h-5 w-5 shrink-0 text-[#5f6d86] transition sm:block', open && 'rotate-180')} aria-hidden="true" />
                  </button>
                </h3>
                <div className="flex shrink-0 items-center">
                  <button type="button" className={iconButton} onClick={() => moveSection(sectionId, 'up')} disabled={index === 0} aria-label={`Move ${meta.label} up`}>
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => moveSection(sectionId, 'down')}
                    disabled={index === orderedSections.length - 1}
                    aria-label={`Move ${meta.label} down`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={cn(iconButton, canToggle && 'hover:bg-rose-50 hover:text-rose-600')}
                    onClick={() => {
                      if (!canToggle) return;
                      toggleSectionVisibility(sectionId);
                    }}
                    disabled={!canToggle}
                    aria-label={canToggle ? `Hide ${meta.label}` : `${meta.label} cannot be hidden`}
                    title={canToggle ? 'Hide from CV. Your content is kept; add it back from "Add section".' : undefined}
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {open && (
                <div id={panelId} role="region" aria-labelledby={headerId} className="px-4 pb-5 pt-4 sm:px-5">
                  <EditorPanel validationIssues={validationIssues} />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {draggedSectionId && (
        <button
          type="button"
          className="w-full rounded-2xl border border-dashed border-brand-500/40 bg-brand-50 px-4 py-2.5 text-left text-sm font-medium text-brand-700 transition hover:bg-brand-100"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleDropToEnd();
          }}
          onClick={handleDropToEnd}
        >
          Drop here to move the dragged section to the end.
        </button>
      )}

      <div ref={menuRef} className="relative">
        <button
          type="button"
          className="flex h-[48px] w-full items-center justify-between rounded-2xl border-2 border-dashed border-[#cfd9e8] px-4 text-[15px] font-semibold text-[#45546e] transition hover:border-[#b8c6d8] hover:bg-white"
          onClick={() => setMenuOpen((value) => !value)}
          disabled={hiddenSections.length === 0}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-5 w-5 shrink-0" />
            Add section
          </span>
          <ChevronDown className="h-5 w-5 shrink-0" />
        </button>

        {menuOpen && hiddenSections.length > 0 && (
          <div className="absolute left-0 right-0 top-[54px] z-20 overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-[0_18px_30px_rgba(15,23,42,0.08)]">
            {hiddenSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px] font-medium text-[#34425c] transition hover:bg-slate-50"
                onClick={() => {
                  toggleSectionVisibility(section.id);
                  setMenuOpen(false);
                }}
              >
                <span>
                  {section.label}
                  {getSectionStatus(document, section.id) === 'complete' && <span className="ml-2 text-xs font-normal text-[#5d6b84]">hidden, has content</span>}
                </span>
                <Plus className="h-4 w-4 shrink-0 text-[#8aa0be]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
