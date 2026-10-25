import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { isUndoAvailable, useCVStore } from '../../store/cvStore';
import TopBar from './TopBar';
import SectionSidebar from './SectionSidebar';
import EditorPanel from './EditorPanel';
import ResumePreview from './ResumePreview';
import { hasBlockingIssues, validateDocument } from '../../utils/validation';
import { Button, Select } from '../shared/controls';
import { templateLabelMap } from '../../utils/templateConfig';
import { documentHasContent } from '../../utils/progress';
import { usePageCount } from '../../utils/pageCount';
import { canShareFile, downloadBlob, needsTapToSave } from '../../utils/download';
import { ImportErrorNotice, ImportReview, useCvImport } from '../shared/ImportFlow';

type PreviewTypography = {
  fullName: number;
  jobTitle: number;
  contact: number;
  sectionTitle: number;
  sectionItemTitle: number;
  sectionDetails: number;
};

const defaultTypography: PreviewTypography = {
  fullName: 28,
  jobTitle: 20,
  contact: 14,
  sectionTitle: 13,
  sectionItemTitle: 14,
  sectionDetails: 13,
};

const typographyMinMax: Record<keyof PreviewTypography, { min: number; max: number }> = {
  fullName: { min: 18, max: 48 },
  jobTitle: { min: 12, max: 30 },
  contact: { min: 10, max: 22 },
  sectionTitle: { min: 10, max: 20 },
  sectionItemTitle: { min: 11, max: 22 },
  sectionDetails: { min: 10, max: 20 },
};

export default function BuilderPage() {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [previewMode, setPreviewMode] = useState<'standard' | 'ats'>('standard');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [typography, setTypography] = useState<PreviewTypography>(defaultTypography);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  // On iPhone/iPad the finished PDF waits here for a tap, because Safari only downloads inside one.
  const [readyPdf, setReadyPdf] = useState<File | null>(null);
  const {
    document: cvDocument,
    hydrated,
    initFromStorage,
    persist,
    saveStatus,
    savedAt,
    saveError,
    templateId,
    setTemplateId,
    resetCV,
    loadImportedDocument,
    updateProfilePhoto,
  } = useCVStore();
  const importFlow = useCvImport();
  const pendingImport = importFlow.pending;
  const importIsPhoto = pendingImport?.report.sourceKind === 'image';

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => persist(), 450);
    return () => window.clearTimeout(timer);
  }, [cvDocument, hydrated, persist, templateId]);

  const hasContent = documentHasContent(cvDocument);
  const pageCount = usePageCount('resume-preview-root', { templateId, mode: previewMode, enabled: viewMode === 'preview' && hasContent }, [cvDocument, typography]);

  const validationIssues = useMemo(() => validateDocument(cvDocument), [cvDocument]);
  const blockingIssue = hasBlockingIssues(validationIssues);
  const exportReady = validationIssues.length === 0;
  const blockingMessages = validationIssues.filter((issue) => issue.field === 'fullName');
  const advisoryMessages = validationIssues.filter((issue) => issue.field !== 'fullName');
  const blockingCount = blockingMessages.length;
  const warningCount = advisoryMessages.length;

  const updateTypography = (key: keyof PreviewTypography, value: number) => {
    const { min, max } = typographyMinMax[key];
    setTypography((current) => ({ ...current, [key]: Math.max(min, Math.min(max, value)) }));
  };

  const resetTypography = () => setTypography(defaultTypography);

  const handleStartOver = () => {
    resetCV();
    resetTypography();
    setPreviewMode('standard');
    setViewMode('edit');
    setExportError(null);
  };

  const handleDownloadJson = async () => {
    try {
      const { buildCvFileName, downloadCvJson } = await import('../../utils/export');
      downloadCvJson(cvDocument, templateId);
      setExportError(null);
      return buildCvFileName(cvDocument, 'json');
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'JSON export failed.');
      return null;
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    // A photo only fills the photo slot; it shouldn't wipe the CV being edited.
    if (importIsPhoto) updateProfilePhoto(pendingImport.document.personalInfo.profilePhoto);
    else loadImportedDocument(pendingImport.document, pendingImport.templateId);
    importFlow.dismiss();
    setViewMode('edit');
  };

  const handleDownloadPdf = async () => {
    const node = window.document.getElementById('resume-preview-root');
    setIsExportingPdf(true);
    try {
      const { buildCvFileName } = await import('../../utils/export');
      const { exportPreviewAsPdf } = await import('../../utils/pdf');
      const fileName = buildCvFileName(cvDocument, 'pdf');
      const blob = await exportPreviewAsPdf(node, fileName, { templateId, mode: previewMode });
      if (needsTapToSave()) setReadyPdf(new File([blob], fileName, { type: 'application/pdf' }));
      else downloadBlob(fileName, blob);
      setExportError(null);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'PDF export failed.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!hydrated) {
    return <div className="grid min-h-screen place-items-center bg-[#f5f7fc] text-slate-600">Loading your workspace…</div>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fc] text-ink">
      <TopBar
        activeView={viewMode}
        onChangeView={setViewMode}
        saveStatus={saveStatus}
        savedAt={savedAt}
        exportReady={exportReady}
        blockingCount={blockingCount}
        warningCount={warningCount}
        onStartOver={handleStartOver}
        onDownloadJson={() => void handleDownloadJson()}
        onImport={importFlow.openPicker}
        isImporting={importFlow.isImporting}
      />
      {importFlow.fileInput}

      {(pendingImport || importFlow.error || importFlow.status) && (
        <div className="px-4 pt-2">
          <div className="mx-auto max-w-[1680px] space-y-2">
            {importFlow.status && (
              <p role="status" className="rounded-[1.25rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">
                {importFlow.status}
              </p>
            )}
            {importFlow.error && (
              <div className="relative">
                <ImportErrorNotice error={importFlow.error} fileName={importFlow.fileName} />
                <button type="button" className="absolute right-3 top-3 text-xs font-semibold text-rose-800 underline" onClick={importFlow.dismiss}>
                  Dismiss
                </button>
              </div>
            )}
            {pendingImport && (
              <ImportReview
                result={pendingImport}
                headingRef={importFlow.reviewHeadingRef}
                confirmLabel={importIsPhoto ? 'Use as profile photo' : hasContent ? 'Replace current CV' : 'Use this import'}
                replaceNotice={
                  importIsPhoto
                    ? cvDocument.personalInfo.profilePhoto
                      ? 'This replaces your current profile photo. The rest of your CV stays as it is.'
                      : null
                    : hasContent
                      ? 'Opening this import replaces the CV you are editing now.'
                      : null
                }
                onDownloadCurrent={() => void handleDownloadJson()}
                onCancel={importFlow.dismiss}
                onConfirm={handleConfirmImport}
              />
            )}
          </div>
        </div>
      )}

      {saveError && (
        <div className="px-4 pt-2">
          <div role="alert" className="mx-auto flex max-w-[1680px] flex-col gap-3 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between">
            <p>{saveError}</p>
            <Button variant="secondary" className="shrink-0" onClick={() => void handleDownloadJson()}>
              Download JSON backup
            </Button>
          </div>
        </div>
      )}

      <UndoBar />

      <section id="builder-workspace" className="mx-auto max-w-[1750px] px-4 pb-6 pt-6 md:pt-8 lg:pt-10">
        <div className={viewMode === 'edit' ? 'grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]' : 'block'}>
          <aside className={`${viewMode === 'preview' ? 'hidden' : 'block'} min-w-0`}>
            <SectionSidebar />
          </aside>

          <div className={`${viewMode === 'edit' ? 'block' : 'hidden'} min-w-0`}>
            <EditorPanel validationIssues={validationIssues} />
          </div>

          <div className={`${viewMode === 'preview' ? 'block' : 'hidden'} min-w-0`}>
            <AdvancedOptionsCard
              open={advancedOpen}
              onToggle={() => setAdvancedOpen((value) => !value)}
              onReset={resetTypography}
              typography={typography}
              templateId={templateId}
              onChangeTemplate={setTemplateId}
              onChange={updateTypography}
            />

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {templateId === 'compact' && (
                <div className="rounded-[1.15rem] border border-[#dbe4f0] bg-[#f7faff] px-3.5 py-2 text-sm text-[#5a6b83]">
                  Compact template uses tighter spacing and smaller PDF margins for longer CVs.
                </div>
              )}
              <div>
                <h2 className="text-[18px] font-bold uppercase tracking-[0.08em] text-[#6c7a92]">LIVE PREVIEW</h2>
                <p className="text-[15px] text-[#8b97aa]">This preview matches the PDF export.</p>
                {hasContent && pageCount !== null && (
                  <p className="mt-1 text-sm text-[#5d6b84]" aria-live="polite">
                    <span className="font-semibold text-[#374151]">
                      PDF: {pageCount} A4 page{pageCount === 1 ? '' : 's'}
                    </span>
                    {pageCount > 2 && templateId !== 'compact' && ' · Most CVs fit on 1–2 pages. The Compact template in Advanced options packs more onto each page.'}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                <div className="inline-flex shrink-0 overflow-hidden rounded-[12px] border border-[#c3cde0] bg-white p-1" role="tablist" aria-label="Preview mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewMode === 'standard'}
                    aria-pressed={previewMode === 'standard'}
                    aria-controls="resume-preview-root"
                    className={[
                      'rounded-[10px] px-4 py-2 text-sm font-semibold leading-none transition',
                      previewMode === 'standard' ? 'bg-[#111827] text-white' : 'text-[#5d6b84] hover:text-[#111827]',
                    ].join(' ')}
                    onClick={() => setPreviewMode('standard')}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewMode === 'ats'}
                    aria-pressed={previewMode === 'ats'}
                    aria-controls="resume-preview-root"
                    className={[
                      'rounded-[10px] px-4 py-2 text-sm font-semibold leading-none transition',
                      previewMode === 'ats' ? 'bg-[#111827] text-white' : 'text-[#5d6b84] hover:text-[#111827]',
                    ].join(' ')}
                    onClick={() => setPreviewMode('ats')}
                  >
                    ATS
                  </button>
                </div>
                <Button variant="secondary" className="h-11 rounded-[12px] border-[#c3cde0] bg-white px-4 text-[14px] font-semibold text-[#374151]" onClick={handleDownloadJson}>
                  Export JSON
                </Button>
                {templateId === 'compact' && (
                  <span className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#5a6b83]">
                    Compact PDF margins enabled
                  </span>
                )}
                <Button
                  className="h-11 rounded-[12px] px-4 text-[14px] font-semibold"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  aria-busy={isExportingPdf}
                >
                  {isExportingPdf ? 'Generating PDF…' : 'Export PDF'}
                </Button>
              </div>
            </div>

            {!exportReady && (
              <div className={`mt-3 rounded-[1.25rem] border px-4 py-3 text-sm ${blockingIssue ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                <p className="font-semibold">Export checklist</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  {blockingMessages.map((issue) => (
                    <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                  ))}
                  {advisoryMessages.map((issue) => (
                    <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {exportError && <p className="mt-3 text-sm text-rose-600">{exportError}</p>}

            {readyPdf && <ReadyPdfPanel file={readyPdf} onDone={() => setReadyPdf(null)} onError={setExportError} />}

            <div className="mt-3 rounded-[1.5rem] border border-[#d9e2ef] bg-[#dfe5ee] p-2 shadow-[0_18px_48px_rgba(15,23,42,0.06)] lg:p-4">
              <div className="rounded-[1.25rem] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.05)]">
                <ResumePreview mode={previewMode} typography={typography} />
              </div>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}

/** One tap deletes a role or clears a section, and autosave makes that stick, so offer a way back. */
function UndoBar() {
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

function ReadyPdfPanel({ file, onDone, onError }: { file: File; onDone: () => void; onError: (message: string) => void }) {
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

function AdvancedOptionsCard({
  open,
  onToggle,
  onReset,
  typography,
  templateId,
  onChangeTemplate,
  onChange,
}: {
  open: boolean;
  onToggle: () => void;
  onReset: () => void;
  typography: PreviewTypography;
  templateId: 'classic' | 'modern' | 'compact';
  onChangeTemplate: (templateId: 'classic' | 'modern' | 'compact') => void;
  onChange: (key: keyof PreviewTypography, value: number) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#d9e2ef] bg-white px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.06)] lg:px-5 lg:py-4">
      <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={onToggle} aria-expanded={open}>
        <div className="flex items-start gap-2.5">
          <ChevronDown className={`mt-0.5 h-4.5 w-4.5 shrink-0 text-[#6c7a92] transition ${open ? 'rotate-180' : ''}`} />
          <div>
            <h2 className="text-[16px] font-bold uppercase tracking-[0.08em] text-[#6c7a92]">Advanced options</h2>
            <p className="mt-0.5 text-[14px] text-[#7f8da4]">Template and font sizes. The defaults work for most CVs.</p>
          </div>
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onReset();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onReset();
            }
          }}
          className="pt-1 text-[15px] font-semibold text-[#2f5ee2]"
        >
          Restore defaults
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-6">
          <section>
            <h3 className="text-[16px] font-semibold text-[#374151]">Template</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Preview style</label>
                <Select value={templateId} onChange={(event) => onChangeTemplate(event.target.value as 'classic' | 'modern' | 'compact')}>
                  {Object.entries(templateLabelMap).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <p className="text-sm text-[#6f7c90]">
                {templateId === 'compact'
                  ? 'Compact tightens spacing in the editor and export.'
                  : 'Switch between the available preview styles.'}
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-[16px] font-semibold text-[#374151]">Personal Info Options</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <TypographyField
                label="Full name font size"
                description="Controls the name in the header."
                value={typography.fullName}
                min={typographyMinMax.fullName.min}
                max={typographyMinMax.fullName.max}
                onMinus={() => onChange('fullName', typography.fullName - 1)}
                onPlus={() => onChange('fullName', typography.fullName + 1)}
                onInput={(value) => onChange('fullName', value)}
              />
              <TypographyField
                label="Job title font size"
                description="Applies to the role beneath your name."
                value={typography.jobTitle}
                min={typographyMinMax.jobTitle.min}
                max={typographyMinMax.jobTitle.max}
                onMinus={() => onChange('jobTitle', typography.jobTitle - 1)}
                onPlus={() => onChange('jobTitle', typography.jobTitle + 1)}
                onInput={(value) => onChange('jobTitle', value)}
              />
              <TypographyField
                label="Contact details font size"
                description="Email, phone, and links in the header."
                value={typography.contact}
                min={typographyMinMax.contact.min}
                max={typographyMinMax.contact.max}
                onMinus={() => onChange('contact', typography.contact - 1)}
                onPlus={() => onChange('contact', typography.contact + 1)}
                onInput={(value) => onChange('contact', value)}
              />
            </div>
          </section>

          <section>
            <h3 className="text-[16px] font-semibold text-[#374151]">Section Typography</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <TypographyField
                label="Section title font size"
                description="Applies to headings like Experience or Skills."
                value={typography.sectionTitle}
                min={typographyMinMax.sectionTitle.min}
                max={typographyMinMax.sectionTitle.max}
                onMinus={() => onChange('sectionTitle', typography.sectionTitle - 1)}
                onPlus={() => onChange('sectionTitle', typography.sectionTitle + 1)}
                onInput={(value) => onChange('sectionTitle', value)}
              />
              <TypographyField
                label="Section item title font size"
                description="Used for job titles and project names."
                value={typography.sectionItemTitle}
                min={typographyMinMax.sectionItemTitle.min}
                max={typographyMinMax.sectionItemTitle.max}
                onMinus={() => onChange('sectionItemTitle', typography.sectionItemTitle - 1)}
                onPlus={() => onChange('sectionItemTitle', typography.sectionItemTitle + 1)}
                onInput={(value) => onChange('sectionItemTitle', value)}
              />
              <TypographyField
                label="Section details font size"
                description="Controls the text under each entry."
                value={typography.sectionDetails}
                min={typographyMinMax.sectionDetails.min}
                max={typographyMinMax.sectionDetails.max}
                onMinus={() => onChange('sectionDetails', typography.sectionDetails - 1)}
                onPlus={() => onChange('sectionDetails', typography.sectionDetails + 1)}
                onInput={(value) => onChange('sectionDetails', value)}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function TypographyField({
  label,
  description,
  value,
  min,
  max,
  onMinus,
  onPlus,
  onInput,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onMinus: () => void;
  onPlus: () => void;
  onInput: (value: number) => void;
}) {
  return (
    <div>
      <h4 className="text-[16px] font-semibold text-[#374151]">{label}</h4>
      <p className="mt-1 text-[14px] text-[#6f7c90]">{description}</p>
      <div className="mt-3 flex items-center gap-2.5">
        <button type="button" onClick={onMinus} className="grid h-[44px] w-[44px] place-items-center rounded-[12px] border border-[#cfd9e8] bg-white text-[28px] leading-none text-[#6f7c90] shadow-[0_1px_0_rgba(15,23,42,0.03)]">
          <Minus className="h-5 w-5" />
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onInput(Number(event.target.value) || min)}
          className="h-[44px] w-full rounded-[12px] border border-[#cfd9e8] bg-white px-3.5 text-[15px] text-[#334155] outline-none focus:border-brand-500"
        />
        <span className="text-[14px] font-medium text-[#6f7c90]">px</span>
        <button type="button" onClick={onPlus} className="grid h-[44px] w-[44px] place-items-center rounded-[12px] border border-[#cfd9e8] bg-white text-[#6f7c90] shadow-[0_1px_0_rgba(15,23,42,0.03)]">
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
