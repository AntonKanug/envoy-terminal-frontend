# web-terminal frontend

<img width="1145" height="707" alt="Screenshot 2026-07-02 at 5 35 10 PM" src="https://github.com/user-attachments/assets/4e8ed80a-a158-4c44-9535-30724952145f" />

A React + Vite + TypeScript frontend (xterm.js) for the **web-terminal**
[Built-On-Envoy](https://github.com/tetratelabs/built-on-envoy) extension.

The extension hosts an interactive shell **inside the Envoy process** and exposes
it over a **WebSocket** (an L4 network-filter dynamic module — no backend server).
This app is a client for that socket.

## Wire protocol

A single WebSocket to `/ws`, binary frames:

- client → server: opcode byte `'0'` + keystrokes (input), or `'1'` + JSON
  `{"cols","rows"}` (resize)
- server → client: raw PTY output

Vite proxies `/ws` to `http://localhost:10000` (see `vite.config.ts`) with
`ws: true`, so the browser talks same-origin to the dev server — no CORS.

## Run it

The extension uses the newer dynamic-modules ABI, so it needs the Envoy **dev**
binary. `dev/run-dev.sh` builds the module from your `built-on-envoy` checkout and
runs Envoy dev with it on `:10000`.

**1. Start Envoy + the extension** (needs a `built-on-envoy` checkout; default
`~/built-on-envoy`, override with `WEB_TERMINAL_EXT`):

```bash
./dev/run-dev.sh
```

**2. Start this app:**

```bash
npm install
npm run dev
```

Open the printed Vite URL and click **Connect**. Try `vim`, `htop`, `ls --color`,
and resize the window.

## Notes

- Requires Node.js 18+ and a `built-on-envoy` checkout.
- Point at a different Envoy: `WEB_TERMINAL_TARGET=http://host:port npm run dev`.
- The reusable piece is `src/WebTerminal.tsx` — an xterm.js terminal wired to the
  WebSocket; drop it into any React app.
- No auth yet: the terminal is remote code execution by design, so keep the
  listener local.
