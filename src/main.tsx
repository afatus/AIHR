import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.group('❌ Unhandled Promise Rejection');
  console.error('Promise rejection:', event.reason);
  console.trace('Stack trace');
  console.groupEnd();
  
  // Prevent the default browser behavior
  event.preventDefault();
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.group('❌ Global JavaScript Error');
  console.error('Error:', event.error);
  console.log('Filename:', event.filename);
  console.log('Line:', event.lineno);
  console.log('Column:', event.colno);
  console.groupEnd();
});

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  console.group('🚀 Application Startup');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('Supabase Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.time('app-mount');
  console.groupEnd();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

if (process.env.NODE_ENV === 'development') {
  console.timeEnd('app-mount');
  console.log('✅ Application mounted successfully');
}
