import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    {
      name: 'strip-fontawesome-ttf',
      enforce: 'pre',
      transform(code, id) {
        if (!id.includes('@fortawesome/fontawesome-free/css/')) {
          return null;
        }

        return code.replace(/,url\(\.\.\/webfonts\/[^)]+\.ttf\) format\("truetype"\)/g, '');
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'framer-motion': ['framer-motion'],
          'file-tree-vendor': ['react-virtuoso'],
          'code-view-vendor': ['highlight.js/lib/common', 'marked', 'dompurify'],
        }
      }
    }
  },
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
