import { ArrowLeft, Download, Save, Sparkles } from 'lucide-react';
import { Button } from '../shared/controls';

export default function TopBar({
  onBack,
  onDownload,
  statusLabel,
}: {
  onBack: () => void;
  onDownload: () => void;
  statusLabel: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onBack} aria-label="Back to start">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-brand-600" /> Quick Free CV Builder
            </div>
            <p className="text-sm text-slate-500">Free, privacy-first builder with live preview and PDF export.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-slate-50 px-4 py-2 text-sm text-slate-600">
            <Save className="h-4 w-4 text-emerald-600" /> {statusLabel}
          </div>
          <Button onClick={onDownload}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>
    </header>
  );
}
