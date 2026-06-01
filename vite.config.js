import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const apiTarget = env.VITE_API_ENDPOINT || 'http://localhost:5001';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/auth': { target: apiTarget, changeOrigin: true },
        '/user': { target: apiTarget, changeOrigin: true },
        '/admin': { target: apiTarget, changeOrigin: true },
        '/shop': { target: apiTarget, changeOrigin: true },
        '/gamification': { target: apiTarget, changeOrigin: true },
        '/challenges': { target: apiTarget, changeOrigin: true },
        '/config': { target: apiTarget, changeOrigin: true },
        '/notification': { target: apiTarget, changeOrigin: true },
        '/health': { target: apiTarget, changeOrigin: true },
        '/nutrition': { target: apiTarget, changeOrigin: true },
        '/referral': { target: apiTarget, changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
