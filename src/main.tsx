/**
 * KLSI 4.0 - Application Entry Point
 * Task 2: Setup TooltipProvider untuk mengaktifkan tooltips di seluruh aplikasi
 * 
 * Guidelines.md:
 * - Bagian 5: Arsitektur UI Deklaratif
 * - Bagian 6: Manajemen State (SSOT)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TooltipProvider } from './components/ui/tooltip';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </React.StrictMode>
);
