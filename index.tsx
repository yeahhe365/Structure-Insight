import React from 'react';
import ReactDOM from 'react-dom/client';
import { marked } from 'marked';
import App from './App';

// Configure marked for markdown rendering with syntax highlighting
marked.setOptions({
    langPrefix: 'hljs language-',
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
    <App />
  </React.StrictMode>
);