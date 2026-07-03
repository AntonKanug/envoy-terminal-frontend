import { useState } from 'react';
import { WebTerminal } from './WebTerminal';

export default function App() {
  const [connected, setConnected] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 12px',
          background: '#241247',
          color: '#e6dcff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          borderBottom: '2px solid #00e5c0',
        }}
      >
        <strong style={{ color: '#00e5c0' }}>React · xterm.js 5.5.0</strong>
        {connected ? (
          <button onClick={() => setConnected(false)}>Disconnect</button>
        ) : (
          <button onClick={() => setConnected(true)}>Connect</button>
        )}
        <span style={{ marginLeft: 'auto', opacity: 0.6 }}>WebSocket → localhost:10000</span>
      </header>

      <main style={{ flex: 1, minHeight: 0, background: '#1a1030', padding: 4 }}>
        {connected ? (
          <WebTerminal onClose={() => setConnected(false)} />
        ) : (
          <div style={{ color: '#888', fontFamily: 'system-ui, sans-serif', padding: 16, lineHeight: 1.6 }}>
            Start the web-terminal network filter (Envoy on :10000), then click <b>Connect</b>:
            <pre style={{ color: '#aaa' }}>
{`# in built-on-envoy/extensions/web-terminal
./run-dev.sh`}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
