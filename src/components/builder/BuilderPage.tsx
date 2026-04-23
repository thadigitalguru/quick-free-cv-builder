import { useEffect, useMemo } from 'react';
import { Download, RotateCcw, Save, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/controls';
import { useCVStore } from '../../store/cvStore';
import TopBar from './TopBar';
import SectionSidebar from './SectionSidebar';
import EditorPanel from './EditorPanel';
import ResumePreview from './ResumePreview';

export default function BuilderPage() {
  const navigate = useNavigate();
  const { document: cvDocument, hydrated, initFromStorage, persist, createNewCV, resetCV, saveStatus, savedAt } = useCVStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => persist(), 450);
    return () => window.clearTimeout(timer);
  }, [cvDocument, hydrated, persist]);

  const statusLabel = useMemo(() => {
    if (saveStatus === 'loaded') return 'Draft restored';
    if (saveStatus === 'saving') return 'Saving…';
    if (saveStatus === 'saved') return 'Changes saved';
    if (savedAt) return 'Saved locally';
    return 'Ready';
  }, [saveStatus, savedAt]);

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-600">
        Loading your CV workspace…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-ink">
      <TopBar
        onBack={() => navigate('/')}
        onDownload={() => window.document.getElementById('resume-preview-root')?.dispatchEvent(new CustomEvent('download-pdf'))}
        statusLabel={statusLabel}
      />

      <section className="mx-auto grid max-w-[1600px] gap-5 px-4 py-4 lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="flex min-h-[calc(100vh-8rem)] flex-col gap-5">
          <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Builder workspace</h2>
                <p className="mt-1 text-sm text-slate-500">Edit sections on the left and preview the CV on the right.</p>
              </div>
              <Button variant="secondary" onClick={resetCV} title="Reset CV">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={createNewCV} variant="secondary" className="flex-1">
                New CV
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => navigate('/') }>
                Back to start
              </Button>
            </div>
          </div>

          <SectionSidebar />
          <EditorPanel />
        </aside>

        <div className="min-h-[calc(100vh-8rem)] rounded-[1.75rem] border border-border bg-slate-50 p-3 shadow-soft">
          <ResumePreview />
        </div>
      </section>
    </main>
  );
}
