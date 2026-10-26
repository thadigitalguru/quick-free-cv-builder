import { useEffect, useMemo, useState } from 'react';
import { useCVStore } from '../../store/cvStore';
import TopBar from './TopBar';
import SectionSidebar from './SectionSidebar';
import EditorPanel from './EditorPanel';
import ResumePreview from './ResumePreview';
import { hasBlockingIssues, validateDocument } from '../../utils/validation';
import { Button } from '../shared/controls';
import { documentHasContent } from '../../utils/progress';
import { usePageCount } from '../../utils/pageCount';
import { getExportClasses } from '../../utils/pdf';
import { findUnsupportedCharacters } from '../../utils/fontCoverage';
import { downloadBlob, needsTapToSave } from '../../utils/download';
import { describeError } from '../../utils/appUpdate';
import { STORAGE_KEY } from '../../utils/storageKeys';
import { isPublicComputerMode } from '../../utils/storage';
import { ImportErrorNotice, ImportReview, useCvImport } from '../shared/ImportFlow';
import { AdvancedOptionsCard } from './AdvancedOptionsCard';
import { ReadyPdfPanel, TabConflictBanner, UndoBar } from './BuilderBanners';
import { defaultTypography, typographyMinMax, type PreviewTypography } from './typography';

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

  // Another tab saving this CV fires a storage event here (never for this tab's own saves).
  useEffect(() => {
    if (!hydrated) return;
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || (event.key !== STORAGE_KEY && event.key !== null)) return;
      useCVStore.getState().syncFromOtherTab();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => persist(), 450);
    return () => window.clearTimeout(timer);
  }, [cvDocument, hydrated, persist, templateId]);

  const hasContent = documentHasContent(cvDocument);
  const publicComputer = isPublicComputerMode();

  // Printing (the button or Ctrl/Cmd+P) gets the same export clean-ups as the PDF, e.g. no placeholders.
  useEffect(() => {
    const root = () => window.document.getElementById('resume-preview-root');
    let added: string[] = [];
    const onBeforePrint = () => {
      added = getExportClasses(previewMode);
      root()?.classList.add(...added);
    };
    const onAfterPrint = () => root()?.classList.remove(...added);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [previewMode]);

  // On a shared computer, closing the tab deletes the CV, so confirm before it goes.
  useEffect(() => {
    if (!publicComputer || !hasContent) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [publicComputer, hasContent]);
  const pageCount = usePageCount('resume-preview-root', { templateId, mode: previewMode, enabled: viewMode === 'preview' && hasContent, document: cvDocument, typography });

  const validationIssues = useMemo(() => validateDocument(cvDocument), [cvDocument]);
  const unsupportedCharacters = useMemo(() => findUnsupportedCharacters(cvDocument), [cvDocument]);
  const blockingIssue = hasBlockingIssues(validationIssues);
  const exportReady = validationIssues.length === 0 && unsupportedCharacters.length === 0;
  const blockingMessages = validationIssues.filter((issue) => issue.field === 'fullName');
  const advisoryMessages = [
    ...validationIssues.filter((issue) => issue.field !== 'fullName'),
    // Said before export: the PDF font can't draw these, so they'd silently come out blank.
    ...(unsupportedCharacters.length
      ? [{ field: 'unsupportedCharacters', sectionId: 'personalInfo' as const, message: `These characters can't be shown in the PDF and would be left blank: ${unsupportedCharacters.slice(0, 12).join(' ')}${unsupportedCharacters.length > 12 ? ' …' : ''}. The PDF supports Latin (with accents), Greek, Cyrillic and Vietnamese, not emoji, Arabic, Chinese or other scripts. Replace them (e.g. "->" for "→"), or use Print / Save as PDF, which keeps every character.` }]
      : []),
  ];
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
      setExportError(describeError(error, 'JSON export failed.'));
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
      setExportError(describeError(error, 'PDF export failed.'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!hydrated) {
    return <div className="grid min-h-screen place-items-center bg-[#f5f7fc] text-slate-600">Loading your workspace…</div>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fc] text-ink">
      <h1 className="sr-only">CV builder</h1>
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
        tabOnly={publicComputer}
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
      <TabConflictBanner />

      <section id="builder-workspace" className="mx-auto max-w-[1750px] px-4 pb-6 pt-6 md:pt-8 lg:pt-10">
        <div className={viewMode === 'edit' ? 'grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]' : 'block'}>
          <aside className={`${viewMode === 'preview' ? 'hidden' : 'block'} min-w-0`}>
            <SectionSidebar />
          </aside>

          <div className={`${viewMode === 'edit' ? 'block' : 'hidden'} min-w-0`}>
            <EditorPanel validationIssues={validationIssues} />
          </div>

          <div className={`print-cv-container ${viewMode === 'preview' ? 'block' : 'hidden'} min-w-0`}>
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
                <h2 className="text-[18px] font-bold uppercase tracking-[0.08em] text-[#5d6b84]">LIVE PREVIEW</h2>
                <p className="text-[15px] text-[#5d6b84]">This preview matches the PDF export.</p>
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
                <div className="inline-flex shrink-0 overflow-hidden rounded-[12px] border border-[#c3cde0] bg-white p-1" role="group" aria-label="Preview mode">
                  <button
                    type="button"
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
                <Button
                  variant="secondary"
                  className="h-11 rounded-[12px] border-[#c3cde0] bg-white px-4 text-[14px] font-semibold text-[#374151]"
                  onClick={() => window.print()}
                  title="Uses your browser's print dialog: choose Save as PDF. Keeps every character, including emoji and non-Latin scripts."
                >
                  Print / Save as PDF
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

            <div className="print-cv-sheet mt-3 rounded-[1.5rem] border border-[#d9e2ef] bg-[#dfe5ee] p-2 shadow-[0_18px_48px_rgba(15,23,42,0.06)] lg:p-4">
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
