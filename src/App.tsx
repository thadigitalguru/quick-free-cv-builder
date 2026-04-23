import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import BuilderPage from './components/builder/BuilderPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/builder" element={<BuilderPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
