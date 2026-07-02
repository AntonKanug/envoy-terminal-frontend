# envoy-terminal-frontend

<img width="1145" height="707" alt="Screenshot 2026-07-02 at 5 35 10 PM" src="https://github.com/user-attachments/assets/4e8ed80a-a158-4c44-9535-30724952145f" />

A React + Vite + TypeScript frontend (xterm.js) for the **web-terminal**
[Built-On-Envoy](https://github.com/tetratelabs/built-on-envoy) extension.

The extension hosts an interactive shell inside Envoy and exposes it over a plain
HTTP API. This app is a client for that API:

- `GET /stream?sid=&cols=&rows=` — SSE stream of base64-encoded PTY output
- `POST /input?sid=` — request body written to the PTY
- `POST /resize?sid=&cols=&rows=` — resize the PTY

Vite proxies those paths to `http://localhost:10000` (see `vite.config.ts`), so
the browser talks same-origin to the dev server — no CORS.

## Run it

**1. Start the extension backend** (in the `built-on-envoy` repo):

```bash
./boe run --local extensions/composer/web-terminal --config '{"command":"/bin/bash"}'
```

**2. Start this app:**

```bash
npm install
npm run dev
```

Open the printed Vite URL and click **Connect**. Try `vim`, `htop`, `ls --color`,
and resize the window.

## Notes

- Requires Node.js 18+.
- Point at a different backend: `WEB_TERMINAL_TARGET=http://host:port npm run dev`.
- The reusable piece is `src/WebTerminal.tsx` — an xterm.js terminal wired to the
  SSE/POST API; drop it into any React app.
- Transport is Server-Sent Events (output) + HTTP POST (input/resize). The
  extension is an in-Envoy HTTP filter, so it can't use WebSockets.
