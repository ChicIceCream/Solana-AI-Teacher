import { Toaster } from 'react-hot-toast';
import Desktop from './components/Desktop/Desktop.jsx';

export default function App() {
  return (
    <>
      <Desktop />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(22,27,34,0.95)',
            color: '#e6edf3',
            border: '1px solid rgba(48,54,61,0.8)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
    </>
  );
}
