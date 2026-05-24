import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': { target: 'http://localhost:5001', changeOrigin: true },
      '/user': { target: 'http://localhost:5001', changeOrigin: true },
      '/admin': { target: 'http://localhost:5001', changeOrigin: true },
      '/shop': { target: 'http://localhost:5001', changeOrigin: true },
      '/gamification': { target: 'http://localhost:5001', changeOrigin: true },
      '/challenges': { target: 'http://localhost:5001', changeOrigin: true },
      '/config': { target: 'http://localhost:5001', changeOrigin: true },
      '/notification': { target: 'http://localhost:5001', changeOrigin: true },
      '/health': { target: 'http://localhost:5001', changeOrigin: true },
      '/nutrition': { target: 'http://localhost:5001', changeOrigin: true },
      '/referral': { target: 'http://localhost:5001', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
