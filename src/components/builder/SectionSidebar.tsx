import { Check, ChevronDown, ChevronUp, EyeOff, GripVertical, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sectionDefaults, sectionLabelMap } from '../../data/sectionMeta';
import { useCVStore } from '../../store/cvStore';
import { cn } from '../../utils/dom';
import type { SectionId } from '../../types/cv';
import { getEssentialProgress, getSectionStatus } from '../../utils/progress';

export default function SectionSidebar() {
  const { document, activeSection, setActiveSection, moveSection, moveSectionToIndex, toggleSectionVisibility } = useCVStore();
  const [menuOpen, setMenuOpen] = useState(false);
  // On small screens the full reorder list pushes the editor off-screen, so it's tucked behind a toggle.
  const [manageOpen, setManageOpen] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<SectionId | null>(null);
  const [dropTargetSectionId, setDropTargetSectionId] = useState<SectionId | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const progress = useMemo(() => getEssentialProgress(document), [document]);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
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

  return (
    <aside className="relative rounded-[2rem] border border-[#d9e2ef] bg-transparent p-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <div className="px-2 pb-3 pt-6 lg:pt-8">
        <h3 className="text-[18px] font-bold uppercase tracking-[0.08em] text-[#6c7a92]">SECTIONS</h3>
        <div className="mt-3 rounded-[14px] border border-[#d9e2ef] bg-white px-3.5 py-3">
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
        </div>
        <p className="mt-2 hidden text-xs text-[#8a97ac] lg:block">Tip: drag sections to reorder, or use Alt + ↑ / ↓ on the focused section.</p>
      </div>

      <nav aria-label="CV sections" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:hidden">
        {orderedSections.map((sectionId) => {
          const active = activeSection === sectionId;
          const complete = getSectionStatus(document, sectionId) === 'complete';
          return (
            <button
              key={sectionId}
              type="button"
              onClick={() => setActiveSection(sectionId)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition',
                active ? 'border-[#111827] bg-[#111827] text-white' : 'border-[#d9e2ef] bg-white text-[#34425c]',
              )}
            >
              {complete && <Check className={cn('h-3.5 w-3.5', active ? 'text-emerald-300' : 'text-emerald-600')} aria-hidden="true" />}
              {sectionLabelMap[sectionId]}
              <span className="sr-only">{complete ? ', complete' : ', not started'}</span>
            </button>
          );
        })}
      </nav>
      <button
        type="button"
        className="mb-1 text-sm font-semibold text-[#45546e] underline-offset-2 hover:underline lg:hidden"
        aria-expanded={manageOpen}
        aria-controls="section-manager"
        onClick={() => setManageOpen((value) => !value)}
      >
        {manageOpen ? 'Done managing sections' : 'Reorder, hide or add sections'}
      </button>

      <div id="section-manager" className={cn(manageOpen ? 'block' : 'hidden', 'lg:block')}>
      <div className="space-y-2.5">
        {orderedSections.map((sectionId, index) => {
          const meta = sectionDefaults.find((section) => section.id === sectionId)!;
          const active = activeSection === sectionId;
          const canToggle = sectionId !== 'personalInfo';
          const isDragged = draggedSectionId === sectionId;
          const isDropTarget = dropTargetSectionId === sectionId;
          const complete = getSectionStatus(document, sectionId) === 'complete';

          return (
            <div
              key={sectionId}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', sectionId);
                setDraggedSectionId(sectionId);
              }}
              onDragEnd={resetDragState}
              onDragOver={(event) => {
                if (!draggedSectionId || draggedSectionId === sectionId) return;
                event.preventDefault();
                setDropTargetSectionId(sectionId);
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDropBefore(sectionId);
              }}
              aria-grabbed={isDragged}
              className={cn(
                'group flex items-center gap-2.5 rounded-[16px] border border-transparent p-1 transition',
                isDropTarget && 'border-brand-200 bg-brand-50/70',
                isDragged && 'opacity-60',
              )}
              title="Drag to reorder"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#b4bfd0] transition group-hover:text-[#111827]">
                <GripVertical className="h-5 w-5" />
              </div>

              <button
                ref={active ? activeRef : null}
                type="button"
                onClick={() => setActiveSection(sectionId)}
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
                aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                title="Alt+ArrowUp / Alt+ArrowDown to reorder"
                className={cn(
                  'flex h-[48px] flex-1 items-center rounded-[12px] border px-3.5 text-left transition sm:h-[55px] sm:px-4',
                  active
                    ? 'border-[#0c2b63] bg-[#111827] text-white shadow-[0_10px_28px_rgba(15,23,42,0.18)]'
                    : 'border-[#d9e2ef] bg-white text-[#34425c] shadow-none hover:border-[#bfcce0]',
                )}
              >
                {complete ? (
                  <Check className={cn('h-4 w-4 shrink-0', active ? 'text-emerald-300' : 'text-emerald-600')} aria-hidden="true" />
                ) : (
                  <span className={cn('h-3.5 w-3.5 shrink-0 rounded-full', active ? 'bg-[#f5c44e]' : 'bg-[#d4dbe6]')} aria-hidden="true" />
                )}
                <span className="ml-3 min-w-0 flex-1 truncate text-[15px] font-medium tracking-[-0.01em] sm:ml-4 sm:text-[17px]">
                  {meta.label}
                  <span className="sr-only">{complete ? ', complete' : ', not started'}</span>
                </span>
              </button>

              <div className="flex items-center gap-1.5 text-[#5f6d86]">
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-30"
                  onClick={() => moveSection(sectionId, 'up')}
                  disabled={index === 0}
                  aria-label={`Move ${meta.label} up`}
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-30"
                  onClick={() => moveSection(sectionId, 'down')}
                  disabled={index === orderedSections.length - 1}
                  aria-label={`Move ${meta.label} down`}
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-30',
                    canToggle ? 'hover:bg-rose-50 hover:text-rose-600' : 'cursor-not-allowed text-[#d2d9e6]',
                  )}
                  onClick={() => {
                    if (!canToggle) return;
                    toggleSectionVisibility(sectionId);
                  }}
                  disabled={!canToggle}
                  aria-label={canToggle ? `Hide ${meta.label}` : `${meta.label} cannot be hidden`}
                  title={canToggle ? 'Hide from CV. Your content is kept; add it back from "Add section".' : undefined}
                >
                  <EyeOff className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {draggedSectionId && (
        <button
          type="button"
          className="mt-2 w-full rounded-[14px] border border-dashed border-brand-200 bg-brand-50 px-4 py-2.5 text-left text-sm font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
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

      <div ref={menuRef} className="relative mt-5">
        <button
          type="button"
          className="flex h-[44px] w-full items-center justify-between rounded-[12px] border-2 border-dashed border-[#cfd9e8] px-4 text-[16px] font-semibold text-[#45546e] transition hover:border-[#b8c6d8] hover:bg-white"
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
          <div className="absolute left-0 right-0 top-[50px] z-20 overflow-hidden rounded-[16px] border border-[#d9e2ef] bg-white shadow-[0_18px_30px_rgba(15,23,42,0.08)]">
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
                  {getSectionStatus(document, section.id) === 'complete' && <span className="ml-2 text-xs font-normal text-[#8a97ac]">hidden, has content</span>}
                </span>
                <Plus className="h-4 w-4 shrink-0 text-[#8aa0be]" />
              </button>
            ))}
          </div>
        )}
      </div>
      </div>
    </aside>
  );
}
