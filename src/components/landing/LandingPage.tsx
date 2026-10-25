import { ExternalLink, Lock, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../shared/controls';
import { useCVStore } from '../../store/cvStore';
import { discardUnreadableDraft, getSavedDraftMeta, getUnreadableDraft, loadSavedCV } from '../../utils/storage';
import { downloadBlob } from '../../utils/download';
import { downloadCvJson } from '../../utils/export';
import { ImportErrorNotice, ImportReview, useCvImport } from '../shared/ImportFlow';
import type { ImportResult } from '../../utils/importFile';

export default function LandingPage() {
  const navigate = useNavigate();
  const importFlow = useCvImport();
  const loadImportedDocument = useCVStore((state) => state.loadImportedDocument);
  const createNewCV = useCVStore((state) => state.createNewCV);
  const draftMeta = getSavedDraftMeta();
  const [confirmingFresh, setConfirmingFresh] = useState(false);
  const [unreadableDraft, setUnreadableDraft] = useState(() => getUnreadableDraft());
  // The review result produced from the set-aside draft; only confirming that one replaces the backup.
  const [restoredResult, setRestoredResult] = useState<ImportResult | null>(null);
  const savedDraftLabel = draftMeta ? new Date(draftMeta.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';

  const handleStartFresh = () => {
    // Starting fresh deletes the saved draft, so ask first when there is one.
    if (draftMeta && !confirmingFresh) {
      setConfirmingFresh(true);
      return;
    }
    createNewCV();
    navigate('/builder');
  };

  const handleDownloadSavedDraft = () => {
    const saved = loadSavedCV();
    if (saved) downloadCvJson(saved.document, saved.templateId);
  };

  const handleConfirmImport = () => {
    if (!importFlow.pending) return;
    loadImportedDocument(importFlow.pending.document, importFlow.pending.templateId);
    // The set-aside copy is now the live draft again.
    if (importFlow.pending === restoredResult) discardUnreadableDraft();
    navigate('/builder');
  };

  const handleResumeDraft = () => {
    navigate('/builder');
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <section className="w-full max-w-3xl rounded-[2rem] border border-border bg-white p-8 shadow-soft sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
              <Sparkles className="h-4 w-4" /> Privacy-first CV builder
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Quick Free CV Builder</h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Create a clean, trustworthy CV in minutes. No paywall, no sign-up, no data harvesting, and no watermark.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              {draftMeta && (
                <Button className="min-w-48 text-base leading-none" onClick={handleResumeDraft}>
                  Resume saved draft
                </Button>
              )}
              <Button className="min-w-48 text-base leading-none" variant={draftMeta ? 'secondary' : 'primary'} onClick={handleStartFresh}>
                {draftMeta ? 'Start a new CV' : 'Start building'}
              </Button>
              <Button
                className="min-w-48 text-base leading-none"
                variant="secondary"
                onClick={() => {
                  setConfirmingFresh(false);
                  importFlow.openPicker();
                }}
                disabled={importFlow.isImporting}
                aria-busy={importFlow.isImporting}
              >
                <Upload className={`h-4 w-4 ${importFlow.isImporting ? 'animate-spin' : ''}`} />
                {importFlow.isImporting ? 'Importing…' : 'Import CV'}
              </Button>
              {importFlow.fileInput}
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm text-sky-900">
              <p className="font-semibold">Import tips</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                <li>JSON exports from this app restore every field exactly.</li>
                <li>PDF and DOCX text is matched to sections. You review the result before anything is saved.</li>
                <li>Scanned PDFs have no readable text. There is no OCR, and files never leave your device.</li>
                <li>Image files only import the picture as a profile photo.</li>
              </ul>
              {importFlow.status && (
                <p className="mt-2 font-medium" role="status">
                  {importFlow.status}
                </p>
              )}
            </div>

            {confirmingFresh && draftMeta && (
              <div role="alert" className="mt-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
                <p>Starting a new CV deletes your saved draft from {savedDraftLabel}. This can't be undone.</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button variant="secondary" onClick={handleDownloadSavedDraft}>
                    Download draft as JSON
                  </Button>
                  <Button variant="secondary" onClick={() => setConfirmingFresh(false)}>
                    Keep my draft
                  </Button>
                  <Button className="bg-rose-600 hover:bg-rose-700" onClick={handleStartFresh}>
                    Delete draft and start new
                  </Button>
                </div>
              </div>
            )}

            {unreadableDraft && !importFlow.pending && (
              <UnreadableDraftNotice
                onDownload={() => downloadBlob('Quick-Free-CV-recovered-draft.json', new Blob([unreadableDraft], { type: 'application/json' }))}
                onRestore={() => {
                  void importFlow.importFile(new File([unreadableDraft], 'Recovered draft.json', { type: 'application/json' })).then(setRestoredResult);
                }}
                onDiscard={() => {
                  discardUnreadableDraft();
                  setUnreadableDraft(null);
                }}
              />
            )}

            {importFlow.pending && (
              <div className="mt-5">
                <ImportReview
                  result={importFlow.pending}
                  headingRef={importFlow.reviewHeadingRef}
                  replaceNotice={draftMeta ? `Opening this import replaces your saved draft from ${savedDraftLabel}.` : null}
                  onDownloadCurrent={handleDownloadSavedDraft}
                  onCancel={importFlow.dismiss}
                  onConfirm={handleConfirmImport}
                />
              </div>
            )}

            {draftMeta && (
              <p className="mt-4 text-sm text-slate-500">
                Saved draft: {new Date(draftMeta.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}

            {importFlow.error && (
              <div className="mt-5">
                <ImportErrorNotice error={importFlow.error} fileName={importFlow.fileName} />
              </div>
            )}

            <div className="mt-8 grid gap-3 rounded-[1.5rem] bg-slate-50 p-5 text-left text-sm text-slate-600 sm:grid-cols-2">
              {['No paywall', 'No sign-up', 'No data collection', 'No watermark'].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Lock className="h-4 w-4" /> All data stays in your browser
              </span>
              <Link className="inline-flex items-center gap-2 font-medium text-brand-600 hover:text-brand-700" to="https://github.com/thadigitalguru/quick-free-cv-builder" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> GitHub
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/** A draft the app couldn't open is set aside, not deleted; make that copy reachable. */
function UnreadableDraftNotice({ onDownload, onRestore, onDiscard }: { onDownload: () => void; onRestore: () => void; onDiscard: () => void }) {
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  return (
    <div role="alert" className="mt-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
      <p className="font-semibold">An earlier draft couldn't be opened</p>
      <p className="mt-1">It was set aside, not deleted. Try restoring it (you'll review what was recovered first), or download it to keep a copy.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button onClick={onRestore}>Try to restore</Button>
        <Button variant="secondary" onClick={onDownload}>
          Download it
        </Button>
        {confirmingDiscard ? (
          <Button className="bg-rose-600 hover:bg-rose-700" onClick={onDiscard}>
            Delete it permanently
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmingDiscard(true)}>
            Discard
          </Button>
        )}
      </div>
    </div>
  );
}
