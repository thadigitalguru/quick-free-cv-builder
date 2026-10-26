import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Upload } from 'lucide-react';
import { Button } from '../shared/controls';

export default function TopBar({
  activeView,
  onChangeView,
  saveStatus,
  savedAt,
  exportReady,
  blockingCount,
  warningCount,
  onStartOver,
  onDownloadJson,
  onImport,
  isImporting,
}: {
  activeView: 'edit' | 'preview';
  onChangeView: (view: 'edit' | 'preview') => void;
  saveStatus: 'idle' | 'saved' | 'saving' | 'loaded' | 'error';
  savedAt: string | null;
  exportReady: boolean;
  blockingCount: number;
  warningCount: number;
  onStartOver: () => void;
  onDownloadJson: () => void;
  onImport: () => void;
  isImporting: boolean;
}) {
  const [confirmingStartOver, setConfirmingStartOver] = useState(false);
  const startOverButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  // Keyboard users land on the safe choice; Escape backs out to where they were.
  useEffect(() => {
    if (confirmingStartOver) cancelButtonRef.current?.focus();
  }, [confirmingStartOver]);

  const closeStartOver = () => {
    setConfirmingStartOver(false);
    startOverButtonRef.current?.focus();
  };

  const statusLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? savedAt
          ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
          : 'Saved'
        : saveStatus === 'loaded'
          ? 'Loaded draft'
          : saveStatus === 'error'
            ? 'Not saved'
            : 'Ready';

  const statusStyles = {
    saving: 'border-amber-200 bg-amber-50 text-amber-800',
    saved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    loaded: 'border-sky-200 bg-sky-50 text-sky-800',
    idle: 'border-[#d9e2ef] bg-white text-[#5d6b84]',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
  }[saveStatus];

  const exportLabel = exportReady
    ? 'Export ready'
    : blockingCount > 0
      ? 'Name needed to export'
      : `${warningCount} warning${warningCount === 1 ? '' : 's'}`;

  const exportStyles = exportReady
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : blockingCount > 0
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <header className="z-30 bg-[#f5f7fc] px-4 pb-3 pt-4 md:sticky md:top-0 md:pt-6">
      <div className="mx-auto flex max-w-[1750px] flex-col gap-3 md:flex-row md:items-center md:justify-center">
        <div className="flex w-full max-w-[1680px] rounded-full border border-[#d9e2ef] bg-white p-1 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <button
            type="button"
            onClick={() => onChangeView('edit')}
            aria-pressed={activeView === 'edit'}
            aria-controls="builder-workspace"
            className={[
              'flex-1 rounded-full py-2.5 text-sm font-semibold leading-none transition sm:py-3',
              activeView === 'edit' ? 'bg-[#111827] text-white shadow-[0_10px_24px_rgba(15,23,42,0.22)]' : 'text-[#5d6b84] hover:text-[#111827]',
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
              activeView === 'preview' ? 'bg-[#111827] text-white shadow-[0_10px_24px_rgba(15,23,42,0.22)]' : 'text-[#5d6b84] hover:text-[#111827]',
            ].join(' ')}
          >
            <span className="hidden sm:inline">Live preview</span>
            <span className="sm:hidden">Preview</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 md:justify-end">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[0_6px_18px_rgba(15,23,42,0.04)] ${statusStyles}`}>
              {statusLabel}
            </span>
            <span className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[0_6px_18px_rgba(15,23,42,0.04)] ${exportStyles}`}>
              {exportLabel}
            </span>
          </div>
          <div className="relative flex flex-wrap justify-end gap-2">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#d9e2ef] bg-white px-3.5 text-xs font-semibold leading-none text-[#374151] transition hover:bg-slate-50"
              title="Home"
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              Home
            </Link>
            <Button
              variant="secondary"
              className="h-9 rounded-full border-[#d9e2ef] bg-white px-3.5 text-xs font-semibold text-[#374151] leading-none"
              onClick={onImport}
              disabled={isImporting}
              aria-busy={isImporting}
              title="Import a CV file or add a photo"
            >
              <Upload className={`h-3.5 w-3.5 ${isImporting ? 'animate-spin' : ''}`} aria-hidden="true" />
              {isImporting ? 'Importing…' : 'Import'}
            </Button>
            <Button
              ref={startOverButtonRef}
              variant="secondary"
              className="h-9 rounded-full border-[#d9e2ef] bg-white px-4 text-xs font-semibold text-[#374151] leading-none"
              onClick={() => setConfirmingStartOver((value) => !value)}
              aria-expanded={confirmingStartOver}
              aria-controls="start-over-confirm"
            >
              Start over
            </Button>
            {confirmingStartOver && (
              <div
                id="start-over-confirm"
                role="alertdialog"
                aria-label="Confirm start over"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.stopPropagation();
                    closeStartOver();
                  }
                }}
                className="absolute right-0 top-11 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-[1rem] border border-amber-200 bg-white p-3 text-left text-sm text-[#374151] shadow-[0_18px_30px_rgba(15,23,42,0.12)]"
              >
                <p>This deletes your CV from this browser. It can't be undone.</p>
                <div className="mt-3 grid gap-2">
                  <Button variant="secondary" onClick={onDownloadJson}>
                    Download JSON backup
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button ref={cancelButtonRef} variant="secondary" onClick={closeStartOver}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-rose-600 hover:bg-rose-700"
                      onClick={() => {
                        setConfirmingStartOver(false);
                        onStartOver();
                      }}
                    >
                      Delete CV
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
