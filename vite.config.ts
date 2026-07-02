import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The web-terminal extension is served by Envoy on :10000. We proxy its API
// endpoints so the browser talks same-origin to the Vite dev server (no CORS),
// and the extension needs no changes. The extension's own "/" (its bundled
// frontend) is intentionally NOT proxied — this app is the frontend.
const TARGET = process.env.WEB_TERMINAL_TARGET || 'http://localhost:10000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/stream': { target: TARGET, changeOrigin: true },
      '/input': { target: TARGET, changeOrigin: true },
      '/resize': { target: TARGET, changeOrigin: true },
    },
  },
});
