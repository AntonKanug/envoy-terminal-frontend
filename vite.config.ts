import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The web-terminal network filter listens on Envoy :10000. Proxy the WebSocket
// so the browser talks same-origin to the Vite dev server (no CORS). ws:true
// upgrades the proxied connection.
const TARGET = process.env.WEB_TERMINAL_TARGET || 'http://localhost:10000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ws': { target: TARGET, changeOrigin: true, ws: true },
    },
  },
});
