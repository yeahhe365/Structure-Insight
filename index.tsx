import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
import { marked } from 'marked';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { registerAppServiceWorker } from './services/pwa';

// Configure marked for markdown rendering with syntax highlighting
marked.setOptions({
    gfm: true,
    breaks: true,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

registerAppServiceWorker();
