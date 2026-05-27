import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const LandingPage = lazy(() => import('./components/landing/LandingPage'));
const BuilderPage = lazy(() => import('./components/builder/BuilderPage'));

function AppLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f5f7fc] px-4 text-center text-sm text-slate-600">
      Loading app…
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<AppLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
