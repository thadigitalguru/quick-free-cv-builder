import { AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './controls';
import type { ImportResult } from '../../utils/importFile';

export const IMPORT_ACCEPT = 'application/json,.json,.txt,.pdf,.docx,image/*';

/** File picking, progress and review state shared by the landing page and the builder. */
export function useCvImport() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (pending) reviewHeadingRef.current?.focus();
  }, [pending]);

  const handleFile = async (file: File) => {
    setError(null);
    setPending(null);
    setStatus('Starting import…');
    setFileName(file.name);
    setIsImporting(true);
    try {
      const { buildImportedDocument } = await import('../../utils/importFile');
      const result = await buildImportedDocument(file, setStatus);
      if (!result) {
        setError(`We couldn't detect CV content in ${file.name}. Try a JSON export for the cleanest import, or open the original source file and export again.`);
        return;
      }
      setPending(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Import failed. Please try again.');
    } finally {
      setIsImporting(false);
      setStatus(null);
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={IMPORT_ACCEPT}
      className="hidden"
      onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (file) void handleFile(file);
      }}
    />
  );

  return {
    fileInput,
    openPicker: () => inputRef.current?.click(),
    reviewHeadingRef,
    isImporting,
    status,
    error,
    fileName,
    pending,
    dismiss: () => {
      setPending(null);
      setError(null);
    },
  };
}

export function ImportErrorNotice({ error, fileName }: { error: string; fileName: string | null }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p>{error}</p>
        {fileName && <p className="mt-1 text-xs text-rose-700">Last file tried: {fileName}</p>}
      </div>
    </div>
  );
}

export function ImportReview({
  result,
  headingRef,
  replaceNotice,
  confirmLabel = 'Open in builder',
  onDownloadCurrent,
  onCancel,
  onConfirm,
}: {
  result: ImportResult;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  /** Shown when confirming would overwrite an existing CV; null when nothing is lost. */
  replaceNotice: string | null;
  confirmLabel?: string;
  onDownloadCurrent: () => void;
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
    <section aria-labelledby="import-review-heading" className="rounded-[1.25rem] border border-border bg-white px-4 py-4 text-left text-sm text-slate-700 shadow-sm">
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

      {replaceNotice && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          <p>{replaceNotice}</p>
          <button type="button" className="mt-1 font-semibold underline underline-offset-2" onClick={onDownloadCurrent}>
            Download the current CV as JSON first
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel import
        </Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </section>
  );
}
