import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, FileJson, Printer } from 'lucide-react';
import { accentSwatches, defaultAccent, templateLabelMap } from '../../utils/templateConfig';
import { useCVStore } from '../../store/cvStore';
import TopBar from './TopBar';
import SectionSidebar from './SectionSidebar';
import ResumePreview from './ResumePreview';
import { hasBlockingIssues, validateDocument } from '../../utils/validation';
import { Button } from '../shared/controls';
import { documentHasContent } from '../../utils/progress';
import { usePageCount } from '../../utils/pageCount';
import { getExportClasses } from '../../utils/exportGeometry';
import { findUnsupportedCharacters } from '../../utils/fontCoverage';
import { downloadBlob, needsTapToSave } from '../../utils/download';
import { describeError } from '../../utils/appUpdate';
import { STORAGE_KEY } from '../../utils/storageKeys';
import { isPublicComputerMode } from '../../utils/storage';
import { ImportErrorNotice, ImportReview, useCvImport } from '../shared/ImportFlow';
import { AdvancedOptionsCard } from './AdvancedOptionsCard';
import { ReadyPdfPanel, TabConflictBanner, UndoBar } from './BuilderBanners';
import { defaultTypography, typographyMinMax, type PreviewTypography } from './typography';
import { DesignBar, PREVIEW_PAGE_WIDTH, ZoomControls, useMediaQuery, usePreviewZoom } from './PreviewToolbar';

export default function BuilderPage() {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [previewMode, setPreviewMode] = useState<'standard' | 'ats'>('standard');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // Phones: template and colour fold into one line above the page.
  const [designOpen, setDesignOpen] = useState(false);
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
    accentColor,
    setAccentColor,
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
  }, [cvDocument, hydrated, persist, templateId, accentColor]);

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
  // Wide screens show the editor and the preview side by side; phones switch between them.
  const isWide = useMediaQuery('(min-width: 1024px)');
  const previewVisible = isWide || viewMode === 'preview';
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const previewZoom = usePreviewZoom(canvasRef, isWide && hydrated);
  const pageCount = usePageCount('resume-preview-root', { templateId, mode: previewMode, enabled: previewVisible && hasContent, document: cvDocument, typography });

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
  const nothingToExport = 'Add your details first: the preview is showing an example CV.';
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
      downloadCvJson(cvDocument, templateId, accentColor);
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
    else loadImportedDocument(pendingImport.document, pendingImport.templateId, pendingImport.accentColor);
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
        hasContent={hasContent}
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

      <section id="builder-workspace" className="mx-auto max-w-[1750px] px-4 pb-6 pt-4 lg:pt-5">
        <div className="lg:grid lg:grid-cols-[minmax(400px,480px)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <aside className={`${viewMode === 'preview' ? 'hidden lg:block' : 'block'} min-w-0`} aria-label="CV editor">
            {/* No checks on a blank CV: guidance first, warnings once there's something to check. */}
            <SectionSidebar validationIssues={hasContent ? validationIssues : []} />
          </aside>

          <div className={`print-cv-container ${viewMode === 'preview' ? 'flex' : 'hidden lg:flex'} min-w-0 flex-col gap-3 lg:sticky lg:top-[84px] lg:h-[calc(100vh-100px)]`}>
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="sr-only">Live preview</h2>
                <ZoomControls {...previewZoom} />
                <div className="inline-flex shrink-0 overflow-hidden rounded-xl border border-[#d9e2ef] bg-[#f5f7fc] p-0.5" role="group" aria-label="Preview mode">
                  {(['standard', 'ats'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={previewMode === mode}
                      aria-controls="resume-preview-root"
                      className={[
                        'rounded-[10px] px-3.5 py-1.5 text-sm font-semibold transition',
                        previewMode === mode ? 'bg-[#111827] text-white' : 'text-[#5d6b84] hover:text-[#111827]',
                      ].join(' ')}
                      onClick={() => setPreviewMode(mode)}
                    >
                      {mode === 'standard' ? 'Standard' : 'ATS'}
                    </button>
                  ))}
                </div>
                {hasContent && pageCount !== null && (
                  <span
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${pageCount > 2 ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-[#d9e2ef] bg-[#f5f7fc] text-[#374151]'}`}
                    aria-live="polite"
                    title={pageCount > 2 && templateId !== 'compact' ? 'Most CVs fit on 1–2 pages. The Compact template packs more onto each page.' : 'Pages in the exported PDF'}
                  >
                    PDF: {pageCount} A4 page{pageCount === 1 ? '' : 's'}
                  </span>
                )}
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Button variant="secondary" className="h-9 rounded-xl border-[#d9e2ef] bg-white px-3 text-[13px] font-semibold text-[#374151]" onClick={handleDownloadJson} disabled={!hasContent} title={hasContent ? 'Download an editable backup you can import later' : nothingToExport}>
                    <FileJson className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">JSON</span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-9 rounded-xl border-[#d9e2ef] bg-white px-3 text-[13px] font-semibold text-[#374151]"
                    onClick={() => window.print()}
                    disabled={!hasContent}
                    title={hasContent ? "Uses your browser's print dialog: choose Save as PDF. Keeps every character, including emoji and non-Latin scripts." : nothingToExport}
                  >
                    <Printer className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">Print</span>
                    <span className="hidden 2xl:inline">&nbsp;/ Save as PDF</span>
                  </Button>
                  <Button className="h-9 rounded-xl px-3.5 text-[13px] font-semibold" onClick={handleDownloadPdf} disabled={isExportingPdf || !hasContent} aria-busy={isExportingPdf} title={hasContent ? undefined : nothingToExport}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {isExportingPdf ? 'Generating PDF…' : 'Download PDF'}
                  </Button>
                </div>
              </div>
              {!isWide && (
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-between gap-3 border-t border-[#e6ecf4] pt-3 text-left text-sm"
                  onClick={() => setDesignOpen((open) => !open)}
                  aria-expanded={designOpen}
                  aria-controls="design-options"
                >
                  <span className="flex min-w-0 items-center gap-2 text-[#374151]">
                    <span className="font-semibold">Design:</span>
                    <span className="truncate">{templateLabelMap[templateId]}</span>
                    <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: accentColor ?? defaultAccent }} aria-hidden="true" />
                    <span className="truncate">{accentSwatches.find((swatch) => swatch.value === (accentColor ?? defaultAccent))?.name ?? 'Custom'}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-600">
                    {designOpen ? 'Done' : 'Change'}
                    <ChevronDown className={`h-4 w-4 transition ${designOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </span>
                </button>
              )}
              {(isWide || designOpen) && (
                <div id="design-options">
                  <div className="mt-3 border-t border-[#e6ecf4] pt-3">
                    <DesignBar templateId={templateId} onChangeTemplate={setTemplateId} accentColor={accentColor} onChangeAccent={setAccentColor} atsMode={previewMode === 'ats'} />
                  </div>
                  <AdvancedOptionsCard
                    open={advancedOpen}
                    onToggle={() => setAdvancedOpen((value) => !value)}
                    onReset={resetTypography}
                    typography={typography}
                    onChange={updateTypography}
                  />
                </div>
              )}
            </div>

            {/* One line until opened, so the page stays in view; shown once there's a CV to check. */}
            {hasContent && !exportReady && (
              <details className={`group rounded-2xl border px-4 py-2.5 text-sm ${blockingIssue ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
                  <span>
                    Before you export: {blockingMessages.length + advisoryMessages.length} thing{blockingMessages.length + advisoryMessages.length === 1 ? '' : 's'} to check
                  </span>
                  <span className="shrink-0 text-xs font-semibold underline underline-offset-2 group-open:hidden">Show</span>
                  <span className="hidden shrink-0 text-xs font-semibold underline underline-offset-2 group-open:inline">Hide</span>
                </summary>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  {blockingMessages.map((issue) => (
                    <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                  ))}
                  {advisoryMessages.map((issue) => (
                    <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              </details>
            )}

            {exportError && <p className="text-sm text-rose-600">{exportError}</p>}

            {readyPdf && <ReadyPdfPanel file={readyPdf} onDone={() => setReadyPdf(null)} onError={setExportError} />}

            {/* The page on a dotted canvas. On wide screens it's laid out at a fixed width and zoomed;
                zoom sits outside #resume-preview-root, so the PDF and page count never see it. */}
            <div
              ref={canvasRef}
              className="print-cv-sheet preview-canvas min-h-0 rounded-2xl border border-[#d9e2ef] p-3 lg:flex-1 lg:overflow-auto lg:p-6"
            >
              <div
                className="mx-auto overflow-hidden rounded-[4px] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.12)]"
                style={isWide ? { width: PREVIEW_PAGE_WIDTH, zoom: previewZoom.zoom } : undefined}
              >
                <ResumePreview mode={previewMode} typography={typography} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
