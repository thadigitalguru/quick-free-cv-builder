import { Button } from '../shared/controls';

export default function TopBar({
  activeView,
  onChangeView,
  saveStatus,
  savedAt,
  onCreateNewCV,
  onResetDraft,
}: {
  activeView: 'edit' | 'preview';
  onChangeView: (view: 'edit' | 'preview') => void;
  saveStatus: 'idle' | 'saved' | 'saving' | 'loaded';
  savedAt: string | null;
  onCreateNewCV: () => void;
  onResetDraft: () => void;
}) {
  const statusLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? savedAt
          ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
          : 'Saved'
        : saveStatus === 'loaded'
          ? 'Loaded draft'
          : 'Ready';

  const statusStyles = {
    saving: 'border-amber-200 bg-amber-50 text-amber-800',
    saved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    loaded: 'border-sky-200 bg-sky-50 text-sky-800',
    idle: 'border-[#d9e2ef] bg-white text-[#5d6b84]',
  }[saveStatus];

  return (
    <header className="sticky top-0 z-30 bg-[#f5f7fc]/90 px-4 pb-3 pt-4 backdrop-blur md:pt-6">
      <div className="mx-auto flex max-w-[1750px] flex-col gap-3 md:flex-row md:items-center md:justify-center">
        <div className="flex w-full max-w-[1680px] rounded-full border border-[#d9e2ef] bg-white p-1 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <button
            type="button"
            onClick={() => onChangeView('edit')}
            aria-pressed={activeView === 'edit'}
            aria-controls="builder-workspace"
            className={[
              'flex-1 rounded-full py-2.5 text-sm font-semibold leading-none transition sm:py-3',
              activeView === 'edit' ? 'bg-[#111827] text-white shadow-[0_10px_24px_rgba(15,23,42,0.22)]' : 'text-[#66768f] hover:text-[#111827]',
            ].join(' ')}
          >
            <span className="hidden sm:inline">CV Builder</span>
            <span className="sm:hidden">Builder</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeView('preview')}
            aria-pressed={activeView === 'preview'}
            aria-controls="builder-workspace"
            className={[
              'flex-1 rounded-full py-2.5 text-sm font-semibold leading-none transition sm:py-3',
              activeView === 'preview' ? 'bg-[#111827] text-white shadow-[0_10px_24px_rgba(15,23,42,0.22)]' : 'text-[#66768f] hover:text-[#111827]',
            ].join(' ')}
          >
            <span className="hidden sm:inline">Live preview</span>
            <span className="sm:hidden">Preview</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 md:justify-end">
          <span className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[0_6px_18px_rgba(15,23,42,0.04)] ${statusStyles}`}>
            {statusLabel}
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" className="h-9 rounded-full border-[#d9e2ef] bg-white px-4 text-xs font-semibold text-[#374151] leading-none" onClick={onCreateNewCV}>
              Start fresh
            </Button>
            <Button variant="secondary" className="h-9 rounded-full border-[#d9e2ef] bg-white px-4 text-xs font-semibold text-[#374151] leading-none" onClick={onResetDraft}>
              Clear saved draft
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
