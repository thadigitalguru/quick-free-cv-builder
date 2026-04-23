import { ExternalLink, Lock, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../shared/controls';
import { useCVStore } from '../../store/cvStore';
import { buildImportedDocument } from '../../utils/importFile';
import { getSavedDraftMeta } from '../../utils/storage';

export default function LandingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadImportedDocument = useCVStore((state) => state.loadImportedDocument);
  const draftMeta = getSavedDraftMeta();

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

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row sm:flex-wrap">
              <Button className="min-w-48 text-base" onClick={() => navigate('/builder')}>
                Create New CV
              </Button>
              {draftMeta && (
                <Button className="min-w-48 text-base" variant="secondary" onClick={() => navigate('/builder')}>
                  Resume last draft
                </Button>
              )}
              <Button className="min-w-48 text-base" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload Existing CV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json,.txt,.pdf,.docx,image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const document = await buildImportedDocument(file);
                  if (document) {
                    loadImportedDocument(document);
                    navigate('/builder');
                  }
                }}
              />
            </div>

            <div className="mt-8 grid gap-3 rounded-[1.5rem] bg-slate-50 p-5 text-left text-sm text-slate-600 sm:grid-cols-2">
              {['No paywall', 'No sign-up', 'No data harvesting', 'No watermark'].map((item) => (
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
              <Link className="inline-flex items-center gap-2 font-medium text-brand-600 hover:text-brand-700" to="https://github.com" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> GitHub
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
