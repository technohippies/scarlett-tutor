import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './shared/services/wagmi';
import { useAppKitProvider } from '@reown/appkit/react';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        type: 'module'
      });
      console.log('SW registered:', registration);
    } catch (error) {
      console.log('SW registration failed:', error);
    }
  });
}

// AppKit Provider wrapper
function AppKitWrapper({ children }: { children: React.ReactNode }) {
  useAppKitProvider('eip155');
  return children;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppKitWrapper>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AppKitWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
