import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

if (typeof (window as unknown as Record<string, unknown>).global === 'undefined') {
  (window as unknown as Record<string, unknown>).global = window;
}
if (typeof (window as unknown as Record<string, unknown>).Buffer === 'undefined') {
  import('buffer').then(({ Buffer }) => {
    (window as unknown as Record<string, unknown>).Buffer = Buffer;
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
