import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sectionDefaults } from '../../data/sectionMeta';
import { useCVStore } from '../../store/cvStore';
import { cn } from '../../utils/dom';

export default function SectionSidebar() {
  const { document, activeSection, setActiveSection, moveSection, toggleSectionVisibility } = useCVStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeRef = useRef<HTMLButtonElement | null>(null);
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

  return (
    <aside className="relative rounded-[2rem] border border-[#d9e2ef] bg-transparent p-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <div className="px-2 pb-3 pt-6 lg:pt-8">
        <h3 className="text-[18px] font-bold uppercase tracking-[0.08em] text-[#6c7a92]">SECTIONS</h3>
      </div>

      <div className="space-y-2.5">
        {orderedSections.map((sectionId, index) => {
          const meta = sectionDefaults.find((section) => section.id === sectionId)!;
          const active = activeSection === sectionId;
          const visible = document.sectionVisibility[sectionId];
          const canToggle = sectionId !== 'personalInfo';

          return (
            <div key={sectionId} className="flex items-center gap-2.5">
              <button
                ref={active ? activeRef : null}
                type="button"
                onClick={() => setActiveSection(sectionId)}
                className={cn(
                  'flex h-[48px] flex-1 items-center rounded-[12px] border px-3.5 text-left transition sm:h-[55px] sm:px-4',
                  active
                    ? 'border-[#0c2b63] bg-[#111827] text-white shadow-[0_10px_28px_rgba(15,23,42,0.18)]'
                    : 'border-[#d9e2ef] bg-white text-[#34425c] shadow-none hover:border-[#bfcce0]',
                )}
              >
                <span className={cn('h-3.5 w-3.5 rounded-full', active ? 'bg-[#f5c44e]' : 'bg-[#d4dbe6]')} />
                <span className="ml-3 min-w-0 flex-1 truncate text-[15px] font-medium tracking-[-0.01em] sm:ml-4 sm:text-[17px]">
                  {meta.label}
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
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
                <span>{section.label}</span>
                <Plus className="h-4 w-4 shrink-0 text-[#8aa0be]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
