import { ExternalLink, Lock, ShieldCheck, Sparkles, Upload, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../shared/controls';
import { useCVStore } from '../../store/cvStore';
import { getSavedDraftMeta, loadSavedCV } from '../../utils/storage';
import type { ImportResult } from '../../utils/importFile';

export default function LandingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [selectedImportFileName, setSelectedImportFileName] = useState<string | null>(null);
  const loadImportedDocument = useCVStore((state) => state.loadImportedDocument);
  const createNewCV = useCVStore((state) => state.createNewCV);
  const draftMeta = getSavedDraftMeta();
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<ImportResult | null>(null);
  const [confirmingFresh, setConfirmingFresh] = useState(false);
  const reviewHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const savedDraftLabel = draftMeta ? new Date(draftMeta.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';

  useEffect(() => {
    if (pendingImport) reviewHeadingRef.current?.focus();
  }, [pendingImport]);

  const handleStartFresh = () => {
    // Starting fresh deletes the saved draft, so ask first when there is one.
    if (draftMeta && !confirmingFresh) {
      setConfirmingFresh(true);
      return;
    }
    createNewCV();
    navigate('/builder');
  };

  const handleDownloadSavedDraft = async () => {
    const saved = loadSavedCV();
    if (!saved) return;
    const { downloadCvJson } = await import('../../utils/export');
    downloadCvJson(saved.document);
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    loadImportedDocument(pendingImport.document);
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
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                aria-busy={isImporting}
              >
                <Upload className={`h-4 w-4 ${isImporting ? 'animate-spin' : ''}`} />
                {isImporting ? 'Importing…' : 'Import CV'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json,.txt,.pdf,.docx,image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.currentTarget.files?.[0];
                  if (!file) return;
                  setImportError(null);
                  setPendingImport(null);
                  setConfirmingFresh(false);
                  setImportStatus('Starting import…');
                  setSelectedImportFileName(file.name);
                  setIsImporting(true);
                  try {
                    const { buildImportedDocument } = await import('../../utils/importFile');
                    const result = await buildImportedDocument(file, setImportStatus);
                    if (!result) {
                      setImportError(
                        `We couldn't detect CV content in ${file.name}. Try a JSON export for the cleanest import, or open the original source file and export again.`,
                      );
                      return;
                    }
                    setPendingImport(result);
                  } catch (error) {
                    setImportError(error instanceof Error ? error.message : 'Import failed. Please try again.');
                  } finally {
                    setIsImporting(false);
                    setImportStatus(null);
                    event.target.value = '';
                  }
                }}
              />
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm text-sky-900">
              <p className="font-semibold">Import tips</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                <li>JSON exports from this app restore every field exactly.</li>
                <li>PDF and DOCX text is matched to sections. You review the result before anything is saved.</li>
                <li>Scanned PDFs have no readable text. There is no OCR, and files never leave your device.</li>
                <li>Image files only import the picture as a profile photo.</li>
              </ul>
              {importStatus && (
                <p className="mt-2 font-medium" role="status">
                  {importStatus}
                </p>
              )}
            </div>

            {confirmingFresh && draftMeta && (
              <div role="alert" className="mt-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
                <p>Starting a new CV deletes your saved draft from {savedDraftLabel}. This can't be undone.</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button variant="secondary" onClick={() => void handleDownloadSavedDraft()}>
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

            {pendingImport && (
              <ImportReview
                result={pendingImport}
                headingRef={reviewHeadingRef}
                savedDraftLabel={draftMeta ? savedDraftLabel : null}
                onDownloadDraft={() => void handleDownloadSavedDraft()}
                onCancel={() => setPendingImport(null)}
                onConfirm={handleConfirmImport}
              />
            )}

            {draftMeta && (
              <p className="mt-4 text-sm text-slate-500">
                Saved draft: {new Date(draftMeta.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}

            {importError && (
              <div className="mt-5 flex items-start gap-3 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>{importError}</p>
                  {selectedImportFileName && <p className="mt-1 text-xs text-rose-700">Last file tried: {selectedImportFileName}</p>}
                </div>
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

function ImportReview({
  result,
  headingRef,
  savedDraftLabel,
  onDownloadDraft,
  onCancel,
  onConfirm,
}: {
  result: ImportResult;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  savedDraftLabel: string | null;
  onDownloadDraft: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { report } = result;
  const [copied, setCopied] = useState(false);
  const unplacedText = report.unplaced.join('\n');

  const copyUnplaced = async () => {
    try {
      await navigator.clipboard.writeText(unplacedText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-labelledby="import-review-heading" className="mt-5 rounded-[1.25rem] border border-border bg-white px-4 py-4 text-left text-sm text-slate-700 shadow-sm">
      <h2 id="import-review-heading" ref={headingRef} tabIndex={-1} className="text-base font-semibold text-ink outline-none">
        Review import from {report.fileName}
      </h2>
      <p className="mt-1 text-slate-500">Nothing has been saved yet. This is what we found:</p>

      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Imported sections">
        {report.found.map((row) => (
          <li key={row.label} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            {row.label}
            {row.count > 1 ? ` · ${row.count}` : ''}
          </li>
        ))}
      </ul>

      {report.warnings.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 rounded-xl bg-amber-50 py-2 pl-8 pr-3 text-amber-900">
          {report.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {report.unplaced.length > 0 && (
        <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" open>
          <summary className="cursor-pointer font-medium text-ink">
            {report.unplaced.length} line{report.unplaced.length === 1 ? '' : 's'} couldn't be placed and won't be added
          </summary>
          <p className="mt-2 text-slate-500">Copy this text so you can paste it into the right section in the builder.</p>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-2 text-xs text-slate-700">{unplacedText}</pre>
          <Button variant="secondary" className="mt-2" onClick={() => void copyUnplaced()}>
            {copied ? 'Copied' : 'Copy unplaced text'}
          </Button>
        </details>
      )}

      {savedDraftLabel && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          <p>Opening this import replaces your saved draft from {savedDraftLabel}.</p>
          <button type="button" className="mt-1 font-semibold underline underline-offset-2" onClick={onDownloadDraft}>
            Download the current draft as JSON first
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel import
        </Button>
        <Button onClick={onConfirm}>Open in builder</Button>
      </div>
    </section>
  );
}
