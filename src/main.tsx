import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
// The CV is set in Noto Sans in both preview and PDF; only the weights the PDF embeds are loaded,
// so the browser and jsPDF pick the same face for every weight.
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/700.css';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
