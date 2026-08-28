import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminApp } from './AdminApp';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../index.css';

const rootElement = document.getElementById('admin-root')!;

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <AdminApp />
    </ErrorBoundary>
  </StrictMode>
);
