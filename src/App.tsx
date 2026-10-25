import { Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { APP_UPDATED_MESSAGE, lazyWithReload } from './utils/appUpdate';

const LandingPage = lazyWithReload(() => import('./components/landing/LandingPage'));
const BuilderPage = lazyWithReload(() => import('./components/builder/BuilderPage'));

function AppLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f5f7fc] px-4 text-center text-sm text-slate-600">
      Loading app…
    </div>
  );
}

/** Vite fires this when a lazily loaded file is missing, which after a deploy means "reload". */
function UpdateBanner() {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    const onPreloadError = () => setStale(true);
    window.addEventListener('vite:preloadError', onPreloadError);
    return () => window.removeEventListener('vite:preloadError', onPreloadError);
  }, []);
  if (!stale) return null;
  return (
    <div role="alert" className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}>
      <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 shadow-soft">
        <p className="flex-1">{APP_UPDATED_MESSAGE}</p>
        <button type="button" className="shrink-0 rounded-xl bg-sky-700 px-3 py-1.5 font-semibold text-white hover:bg-sky-800" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <UpdateBanner />
      <Suspense fallback={<AppLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
