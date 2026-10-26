import { Component, type ErrorInfo, type ReactNode } from 'react';
import { APP_UPDATED_MESSAGE, isChunkLoadError } from '../../utils/appUpdate';
import { downloadBlob } from '../../utils/download';
import { CORRUPT_BACKUP_KEY, STORAGE_KEY } from '../../utils/storageKeys';

const readRawDraft = () => {
  try {
    // Public-computer mode keeps the CV in sessionStorage instead.
    for (const store of [window.sessionStorage, window.localStorage]) {
      const value = store?.getItem(STORAGE_KEY) ?? store?.getItem(CORRUPT_BACKUP_KEY);
      if (value) return value;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Without this, any render error leaves a blank page, which in a browser-only app looks exactly
 * like "my CV is gone". The draft is still in storage, so say so and offer a raw copy of it.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Quick Free CV Builder crashed', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const updated = isChunkLoadError(error);
    const draft = readRawDraft();
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7fc] px-4 py-10 text-ink">
        <section role="alert" className="w-full max-w-lg rounded-[1.5rem] border border-border bg-white p-6 shadow-soft">
          <h1 className="text-xl font-semibold">{updated ? 'A new version is available' : 'Something went wrong'}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {updated
              ? APP_UPDATED_MESSAGE
              : draft
                ? 'Your CV is still saved in this browser. Reloading usually fixes this. If it keeps happening, download a backup of your CV first.'
                : 'Reloading usually fixes this.'}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button type="button" className="rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" onClick={() => window.location.reload()}>
              Reload
            </button>
            {draft && (
              <button
                type="button"
                className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50"
                onClick={() => downloadBlob('Quick-Free-CV-backup.json', new Blob([draft], { type: 'application/json' }))}
              >
                Download CV backup
              </button>
            )}
            <button type="button" className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-ink" onClick={() => window.location.assign('/')}>
              Go to home
            </button>
          </div>
          {draft && <p className="mt-4 text-xs text-slate-500">The backup is a JSON file you can import again from the home page.</p>}
        </section>
      </main>
    );
  }
}
