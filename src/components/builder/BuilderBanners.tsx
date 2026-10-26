import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { isUndoAvailable, useCVStore } from '../../store/cvStore';
import { Button } from '../shared/controls';
import { canShareFile, downloadBlob } from '../../utils/download';

/** Two tabs editing one CV would otherwise overwrite each other silently on every autosave. */
export function TabConflictBanner() {
  const conflict = useCVStore((state) => state.conflict);
  const resolveConflict = useCVStore((state) => state.resolveConflict);
  const navigate = useNavigate();
  if (!conflict) return null;
  return (
    <div className="px-4 pt-2">
      <div role="alert" className="mx-auto flex max-w-[1680px] flex-col gap-3 rounded-[1.25rem] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold">{conflict === 'changed' ? 'This CV was changed in another tab.' : 'This CV was deleted in another tab.'}</span>{' '}
          Changes in this tab aren't being saved until you choose.
        </p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {conflict === 'changed' ? (
            <Button variant="secondary" onClick={() => resolveConflict('theirs')}>
              Load the other tab's version
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                resolveConflict('theirs');
                navigate('/');
              }}
            >
              Go to home
            </Button>
          )}
          <Button onClick={() => resolveConflict('mine')}>Keep this tab's version</Button>
        </div>
      </div>
    </div>
  );
}

/** One tap deletes a role or clears a section, and autosave makes that stick, so offer a way back. */
export function UndoBar() {
  const message = useCVStore((state) => (isUndoAvailable(state) ? state.undo!.message : null));
  const undoRemoval = useCVStore((state) => state.undoRemoval);
  const dismissUndo = useCVStore((state) => state.dismissUndo);

  useEffect(() => {
    if (!message) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Text fields keep their own undo.
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undoRemoval();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [message, undoRemoval]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
      <div role="status" aria-live="polite" className="w-full max-w-lg">
        {message && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-[#111827] px-4 py-3 text-sm text-white shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
            <p className="min-w-0 flex-1">{message}.</p>
            <button type="button" className="shrink-0 rounded-xl bg-white px-3 py-1.5 font-semibold text-[#111827] hover:bg-slate-100" onClick={undoRemoval}>
              Undo
            </button>
            <button type="button" className="shrink-0 rounded-xl px-2 py-1.5 text-white/70 hover:text-white" onClick={dismissUndo} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReadyPdfPanel({ file, onDone, onError }: { file: File; onDone: () => void; onError: (message: string) => void }) {
  const canShare = useMemo(() => canShareFile(file), [file]);

  // Both handlers reach the browser API synchronously inside the tap; an await first would lose it.
  const save = () => {
    downloadBlob(file.name, file, { forceDownload: true });
    onDone();
  };
  const share = async () => {
    try {
      await navigator.share({ files: [file], title: file.name });
      onDone();
    } catch (error) {
      // Closing the share sheet isn't an error worth showing.
      if (!(error instanceof DOMException && error.name === 'AbortError')) onError('Sharing failed. Use Save PDF instead.');
    }
  };

  return (
    <div role="status" className="mt-3 flex flex-col gap-3 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
      <p>
        <span className="font-semibold">Your PDF is ready.</span> Tap Save PDF to download {file.name}.
      </p>
      <div className="flex shrink-0 gap-2">
        {canShare && (
          <Button variant="secondary" onClick={() => void share()}>
            Share…
          </Button>
        )}
        <Button onClick={save}>Save PDF</Button>
      </div>
    </div>
  );
}
