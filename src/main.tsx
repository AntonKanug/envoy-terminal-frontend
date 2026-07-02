import ReactDOM from 'react-dom/client';
import App from './App';

// Note: no <React.StrictMode> — it double-invokes effects in dev, which would
// open two SSE streams (and spawn two PTYs) on every connect.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
