import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

type Props = {
  /** Base URL for the endpoints. Empty = same-origin (via the Vite proxy). */
  base?: string;
  /** Called when the stream ends. */
  onClose?: () => void;
};

function randomSid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// A distinctive theme so this app is visibly different from the plain built-in
// page — if these colors render, it's xterm.js interpreting escape sequences.
const XTERM_THEME = {
  background: '#1a1030',
  foreground: '#e6dcff',
  cursor: '#00e5c0',
  cursorAccent: '#1a1030',
  selectionBackground: '#4b2f7a',
  black: '#2a1f45',
  red: '#ff5f87',
  green: '#5fffaf',
  yellow: '#ffd75f',
  blue: '#5fafff',
  magenta: '#d787ff',
  cyan: '#5fe0e0',
  white: '#e6dcff',
  brightBlack: '#6c5a99',
  brightRed: '#ff87af',
  brightGreen: '#87ffd7',
  brightYellow: '#ffe787',
  brightBlue: '#87cfff',
  brightMagenta: '#e7afff',
  brightCyan: '#87ffff',
  brightWhite: '#ffffff',
};

function writeBanner(term: Terminal): void {
  const B = '\x1b[1m';
  const R = '\x1b[0m';
  const M = '\x1b[35m';
  const C = '\x1b[96m';
  term.writeln(`${B}${M}┌────────────────────────────────────────────┐${R}`);
  term.writeln(`${B}${M}│ ${C}React + xterm.js  ·  SSE terminal${M}`.padEnd(56) + `│${R}`);
  term.writeln(`${B}${M}└────────────────────────────────────────────┘${R}`);
  let bar = '';
  for (let i = 16; i < 52; i++) bar += `\x1b[48;5;${i}m `;
  term.writeln(bar + R);
  term.writeln(`\x1b[90mColors + box above ⇒ xterm.js is rendering escapes.\x1b[0m`);
  term.writeln('');
}

/**
 * WebTerminal renders an xterm.js terminal wired to the web-terminal extension:
 *   - output: an SSE stream (GET /stream) of base64-encoded PTY chunks
 *   - input:  POST /input  (request body = keystrokes)
 *   - resize: POST /resize (cols/rows query params)
 * All requests are correlated by a per-connection session id.
 */
export function WebTerminal({ base = '', onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 14,
      theme: XTERM_THEME,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    fit.fit();
    writeBanner(term);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onCloseRef.current?.();
    };

    const ro = new ResizeObserver(() => fit.fit());
    ro.observe(el);
    term.focus();

    const sid = randomSid();
    const qs = (extra?: Record<string, string | number>): string => {
      const p = new URLSearchParams({ sid });
      for (const k in extra) p.set(k, String(extra[k]));
      return p.toString();
    };

    const es = new EventSource(`${base}/stream?${qs({ cols: term.cols, rows: term.rows })}`);
    es.onmessage = (e) => {
      if (e.data) term.write(base64ToBytes(e.data));
    };
    es.addEventListener('exit', () => {
      term.write('\r\n\x1b[33m[process exited]\x1b[0m\r\n');
      es.close();
      finish();
    });
    es.onerror = () => {
      term.write('\r\n\x1b[31m[connection closed]\x1b[0m\r\n');
      es.close();
      finish();
    };

    const dataDisp = term.onData((d) => void fetch(`${base}/input?${qs()}`, { method: 'POST', body: d }));
    const resizeDisp = term.onResize(
      ({ cols, rows }) => void fetch(`${base}/resize?${qs({ cols, rows })}`, { method: 'POST' }),
    );

    return () => {
      ro.disconnect();
      dataDisp.dispose();
      resizeDisp.dispose();
      es.close();
      term.dispose();
    };
  }, [base]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
