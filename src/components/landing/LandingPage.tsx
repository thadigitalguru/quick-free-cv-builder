import { ArrowRight, Download, ExternalLink, Lock, Palette, PencilLine, ShieldCheck, Upload } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from '../../utils/router';
import { Button } from '../shared/controls';
import { useCVStore } from '../../store/cvStore';
import { deleteCvFromBrowser, discardUnreadableDraft, getSavedDraftMeta, getUnreadableDraft, isPublicComputerMode, loadSavedCV, setPublicComputerMode } from '../../utils/storage';
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
  const [publicComputer, setPublicComputer] = useState(() => isPublicComputerMode());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [, rerender] = useState(0);
  const resetCV = useCVStore((state) => state.resetCV);
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
    if (saved) downloadCvJson(saved.document, saved.templateId, saved.accentColor);
  };

  const handleConfirmImport = () => {
    if (!importFlow.pending) return;
    loadImportedDocument(importFlow.pending.document, importFlow.pending.templateId, importFlow.pending.accentColor);
    // The set-aside copy is now the live draft again.
    if (importFlow.pending === restoredResult) discardUnreadableDraft();
    navigate('/builder');
  };

  const handleResumeDraft = () => {
    navigate('/builder');
  };

  const startLabel = draftMeta ? 'Start a new CV' : 'Start building';

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-slate-50 px-4 pb-12 pt-6 text-ink sm:pt-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" width={36} height={36} className="h-9 w-9" />
            <span className="text-[17px] font-bold tracking-[-0.02em]">Quick Free CV Builder</span>
          </div>
          <span className="hidden items-center gap-2 text-sm text-slate-600 sm:inline-flex">
            <Lock className="h-4 w-4" aria-hidden="true" /> Your CV never leaves your browser
          </span>
        </header>

        <section className="mt-10 grid items-center gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
              A polished CV in minutes. <span className="text-brand-500">Free.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg lg:mx-0">
              Fill in a simple form and watch your CV take shape. Pick a template, then download a clean PDF that recruiters and applicant tracking systems can read.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
              {draftMeta && (
                <Button className="h-12 min-w-48 px-6 text-base leading-none" onClick={handleResumeDraft}>
                  Continue my CV
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              <Button className="h-12 min-w-48 px-6 text-base leading-none" variant={draftMeta ? 'secondary' : 'primary'} onClick={handleStartFresh}>
                {startLabel}
                {!draftMeta && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </Button>
              <Button
                className="h-12 min-w-48 px-6 text-base leading-none"
                variant="secondary"
                onClick={() => {
                  setConfirmingFresh(false);
                  importFlow.openPicker();
                }}
                disabled={importFlow.isImporting}
                aria-busy={importFlow.isImporting}
              >
                <Upload className={`h-4 w-4 ${importFlow.isImporting ? 'animate-spin' : ''}`} aria-hidden="true" />
                {importFlow.isImporting ? 'Importing…' : 'Import my CV'}
              </Button>
              {importFlow.fileInput}
            </div>
            {draftMeta && <p className="mt-3 text-sm text-slate-600">Last saved {savedDraftLabel}{publicComputer ? ', kept only until this tab closes' : ''}</p>}

            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-slate-600 lg:justify-start">
              {['No sign-up', 'No watermark', 'No paywall', 'Nothing uploaded'].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <details className="mx-auto mt-5 max-w-xl text-left text-sm text-slate-600 lg:mx-0">
              <summary className="cursor-pointer text-center font-semibold text-brand-600 hover:text-brand-700 lg:text-left">What can I import?</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>A PDF or Word (DOCX) CV: its text is sorted into sections, and you review the result before anything is saved.</li>
                <li>A JSON backup from this app restores every field exactly.</li>
                <li>Scanned PDFs are pictures of text and can't be read; there is no OCR.</li>
                <li>An image only sets your profile photo. Files are read on your device and never uploaded.</li>
              </ul>
            </details>
            {importFlow.status && (
              <p className="mt-3 text-sm font-medium text-sky-900" role="status">
                {importFlow.status}
              </p>
            )}

            <div className="text-left">
              {confirmingFresh && draftMeta && (
                <div role="alert" className="mt-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
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

              {importFlow.error && (
                <div className="mt-5">
                  <ImportErrorNotice error={importFlow.error} fileName={importFlow.fileName} />
                </div>
              )}
            </div>
          </div>

          <CvIllustration />
        </section>

        {importFlow.pending && (
          <div className="mx-auto mt-10 max-w-3xl text-left">
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

        <section aria-labelledby="how-it-works" className="mt-16 lg:mt-20">
          <h2 id="how-it-works" className="sr-only">
            How it works
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: PencilLine, title: 'Add your details', text: 'A guided form, section by section. Or import the CV you already have.' },
              { icon: Palette, title: 'Choose a look', text: 'Four templates and eight colours, with a live preview as you type.' },
              { icon: Download, title: 'Download your PDF', text: 'Searchable text, clickable links, no watermark. An ATS version too.' },
            ].map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="rounded-2xl border border-border bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-slate-600">Step {index + 1}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-8 text-sm text-slate-600">
          <label className="flex max-w-xl items-start gap-3 text-left text-slate-600">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0"
              checked={publicComputer}
              onChange={(event) => {
                const on = event.target.checked;
                if (setPublicComputerMode(on)) setPublicComputer(on);
              }}
            />
            <span>
              <span className="font-semibold text-ink">Using a shared or public computer?</span> Keep my CV only in this tab. It's deleted when the tab closes, so download your PDF or a JSON copy before you leave.
            </span>
          </label>

          {draftMeta && (
            <div className="text-center">
              {confirmingDelete ? (
                <p role="alert" className="text-rose-800">
                  Delete your CV from this browser? This can't be undone.{' '}
                  <button type="button" className="font-semibold underline" onClick={handleDownloadSavedDraft}>
                    Download a JSON copy
                  </button>{' '}
                  ·{' '}
                  <button type="button" className="font-semibold underline" onClick={() => setConfirmingDelete(false)}>
                    Keep it
                  </button>{' '}
                  ·{' '}
                  <button
                    type="button"
                    className="font-semibold text-rose-700 underline"
                    onClick={() => {
                      // Clear the in-memory copy too, or opening the builder would save it straight back.
                      resetCV();
                      deleteCvFromBrowser();
                      setConfirmingDelete(false);
                      rerender((n) => n + 1);
                    }}
                  >
                    Delete it
                  </button>
                </p>
              ) : (
                <button type="button" className="font-medium text-slate-600 underline underline-offset-2 hover:text-ink" onClick={() => setConfirmingDelete(true)}>
                  Delete my CV from this browser
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-5">
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4" aria-hidden="true" /> Free, private and open source
            </span>
            <Link className="inline-flex items-center gap-2 font-medium text-brand-600 hover:text-brand-700" to="https://github.com/thadigitalguru/quick-free-cv-builder" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> GitHub
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

/** A finished CV, drawn in CSS: shows the result without loading the preview or any image. */
function CvIllustration() {
  const line = (width: string) => <div className="h-2 rounded-full bg-slate-200" style={{ width }} />;
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[420px]">
      <div className="absolute inset-x-8 -bottom-4 top-8 rotate-3 rounded-2xl bg-brand-100" />
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_30px_70px_rgba(15,23,42,0.16)]">
        <div className="flex items-center gap-4 bg-[#0f766e] px-6 py-6 text-white">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#0b4f4a] text-lg font-bold">AW</div>
          <div>
            <p className="text-xl font-bold leading-tight">Amina Wanjiru</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">Product Marketing Manager</p>
          </div>
        </div>
        <div className="space-y-5 px-6 py-6">
          {[
            ['Experience', ['92%', '84%', '70%']],
            ['Education', ['76%', '58%']],
          ].map(([title, widths]) => (
            <div key={title as string}>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0f766e]">{title as string}</p>
              <div className="mt-2.5 space-y-2">{(widths as string[]).map((width) => <div key={width}>{line(width)}</div>)}</div>
            </div>
          ))}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0f766e]">Skills</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {['Positioning', 'SEO', 'Research', 'HubSpot'].map((skill) => (
                <span key={skill} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 right-6 hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.14)] sm:flex">
        <Download className="h-4 w-4 text-brand-600" /> PDF ready · 1 page
      </div>
    </div>
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
