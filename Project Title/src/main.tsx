import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Polyfills required for Solana in browser
if (typeof (window as unknown as Record<string, unknown>).global === 'undefined') {
  (window as unknown as Record<string, unknown>).global = window;
}
if (typeof (window as unknown as Record<string, unknown>).Buffer === 'undefined') {
  import('buffer').then(({ Buffer }) => {
    (window as unknown as Record<string, unknown>).Buffer = Buffer;
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
