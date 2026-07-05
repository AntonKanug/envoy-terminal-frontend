import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

type Props = {
  /** Base URL for the WebSocket. Empty = same-origin (via the Vite proxy). */
  base?: string;
  /** Called when the socket closes. */
  onClose?: () => void;
};

const encoder = new TextEncoder();

// frame builds a [opcode-byte, ...utf8(payload)] message: '0'=input, '1'=resize.
function frame(opcode: string, payload: string): Uint8Array {
  const p = encoder.encode(payload);
  const m = new Uint8Array(p.length + 1);
  m[0] = opcode.charCodeAt(0);
  m.set(p, 1);
  return m;
}

// Distinctive theme so it's visibly xterm.js rendering escapes.
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
  const B = '\x1b[1m', R = '\x1b[0m', M = '\x1b[35m', C = '\x1b[96m';
  term.writeln(`${B}${M}┌────────────────────────────────────────────┐${R}`);
  term.writeln(`${B}${M}│ ${C}React + xterm.js  ·  WebSocket terminal${M}`.padEnd(56) + `│${R}`);
  term.writeln(`${B}${M}└────────────────────────────────────────────┘${R}`);
  let bar = '';
  for (let i = 16; i < 52; i++) bar += `\x1b[48;5;${i}m `;
  term.writeln(bar + R);
  term.writeln(`\x1b[90mColors + box above ⇒ xterm.js is rendering escapes.\x1b[0m`);
  term.writeln('');
}

/**
 * WebTerminal renders an xterm.js terminal over a single WebSocket to the
 * in-Envoy web-terminal network filter. Client->server frames are opcode-tagged
 * ('0'=input, '1'=resize JSON); server->client frames are raw PTY output.
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

    const wsBase = base || `${location.protocol === 'https:' ? 'wss://' : 'ws://'}${location.host}`;
    const ws = new WebSocket(`${wsBase}/ws`);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => ws.send(frame('1', JSON.stringify({ cols: term.cols, rows: term.rows })));
    ws.onmessage = (e) => term.write(new Uint8Array(e.data as ArrayBuffer));
    ws.onclose = () => {
      term.write('\r\n\x1b[31m[connection closed]\x1b[0m\r\n');
      finish();
    };
    ws.onerror = () => {
      term.write('\r\n\x1b[31m[connection error]\x1b[0m\r\n');
      finish();
    };

    const dataDisp = term.onData((d) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(frame('0', d));
    });
    const resizeDisp = term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(frame('1', JSON.stringify({ cols, rows })));
    });

    const ro = new ResizeObserver(() => fit.fit());
    ro.observe(el);
    term.focus();

    return () => {
      ro.disconnect();
      dataDisp.dispose();
      resizeDisp.dispose();
      ws.close();
      term.dispose();
    };
  }, [base]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
