import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const targetBackend = process.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: targetBackend,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return;
            console.warn('[api proxy error]', err.message);
          });
        },
      },
      '/socket.io': {
        target: targetBackend,
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Suppress benign ECONNABORTED/ECONNRESET on page reload or client disconnect
            if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET') return;
            console.warn('[socket proxy error]', err.message);
          });
        },
      },
    },
  },
});
