import { useEffect, useMemo, useState } from 'react';
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
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [tick, setTick] = useState(Date.now());
  const { document: cvDocument, hydrated, initFromStorage, persist, createNewCV, resetCV, saveStatus, savedAt } = useCVStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => persist(), 450);
    return () => window.clearTimeout(timer);
  }, [cvDocument, hydrated, persist]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const statusLabel = useMemo(() => {
    if (saveStatus === 'loaded') return 'Draft restored';
    if (saveStatus === 'saving') return 'Saving…';
    if (savedAt) {
      const elapsed = Math.max(0, Math.round((tick - new Date(savedAt).getTime()) / 1000));
      if (elapsed < 5) return 'Saved just now';
      if (elapsed < 60) return `Saved ${elapsed}s ago`;
      const minutes = Math.floor(elapsed / 60);
      if (minutes < 60) return `Saved ${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      return `Saved ${hours}h ago`;
    }
    if (saveStatus === 'saved') return 'Changes saved';
    return 'Ready';
  }, [saveStatus, savedAt, tick]);

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

          <div className="lg:hidden rounded-[1.75rem] border border-border bg-white p-2 shadow-soft">
            <div className="grid grid-cols-2 gap-2">
              <Button variant={viewMode === 'edit' ? 'primary' : 'secondary'} onClick={() => setViewMode('edit')}>Edit</Button>
              <Button variant={viewMode === 'preview' ? 'primary' : 'secondary'} onClick={() => setViewMode('preview')}>Preview</Button>
            </div>
          </div>

          <div className={`${viewMode === 'preview' ? 'hidden lg:flex' : 'flex'} flex-col gap-5`}>
            <SectionSidebar />
            <EditorPanel />
          </div>
        </aside>

        <div className={`${viewMode === 'edit' ? 'hidden lg:block' : 'block'} min-h-[calc(100vh-8rem)] rounded-[1.75rem] border border-border bg-slate-50 p-3 shadow-soft`}>
          <ResumePreview />
        </div>
      </section>
    </main>
  );
}
