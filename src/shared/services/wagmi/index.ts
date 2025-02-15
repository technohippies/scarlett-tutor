import { createConfig, http, createStorage } from '@wagmi/core';
import { baseSepolia } from '@wagmi/core/chains';
import { WagmiAdapter, authConnector } from '@reown/appkit-adapter-wagmi';
import { createAppKit } from '@reown/appkit';

console.log('[wagmi] Initializing wagmi services...');

// Create a persistent storage
const storage = createStorage({
  storage: {
    getItem: (key) => {
      const item = window.localStorage.getItem(key);
      return item === null ? null : JSON.parse(item);
    },
    setItem: (key, value) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key) => {
      window.localStorage.removeItem(key);
    },
  },
});

// Create metadata
const metadata = {
  name: 'Scarlett Tutor',
  description: 'AI tutor with flashcards',
  url: window.location.origin,
  icons: [],
};

// Initialize Wagmi Adapter
console.log('[wagmi] Creating WagmiAdapter...');
const wagmiAdapter = new WagmiAdapter({
  networks: [{
    id: baseSepolia.id,
    name: baseSepolia.name,
    rpcUrls: {
      default: { http: [baseSepolia.rpcUrls.default.http[0]] }
    },
    nativeCurrency: baseSepolia.nativeCurrency,
    chainNamespace: 'eip155',
  }],
  projectId: import.meta.env.VITE_REOWN_PROJECT_ID || 'far-anki',
});
console.log('[wagmi] WagmiAdapter created with config:', wagmiAdapter.wagmiConfig);

// Create auth connector
console.log('[wagmi] Creating auth connector...');
const connector = authConnector({
  chains: [baseSepolia],
  options: {
    projectId: import.meta.env.VITE_REOWN_PROJECT_ID || 'far-anki',
    enableAuthLogger: true,
  },
});
console.log('[wagmi] Auth connector created');

// Create Wagmi config
console.log('[wagmi] Creating Wagmi config...');
export const config = createConfig({
  chains: [baseSepolia],
  connectors: [connector],
  transports: {
    [baseSepolia.id]: http(),
  },
  storage,
});
console.log('[wagmi] Wagmi config created with connectors:', config.connectors);

// Initialize Reown AppKit
console.log('[wagmi] Creating AppKit...');
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [{
    id: baseSepolia.id,
    name: baseSepolia.name,
    rpcUrls: {
      default: { http: [baseSepolia.rpcUrls.default.http[0]] }
    },
    nativeCurrency: baseSepolia.nativeCurrency,
    chainNamespace: 'eip155',
  }],
  projectId: import.meta.env.VITE_REOWN_PROJECT_ID || 'far-anki',
  metadata,
  features: {
    analytics: true,
    connectMethodsOrder: ['social', 'email', 'wallet'],
    onramp: false,
    swaps: false,
  },
  showWallets: true,
  defaultAccountTypes: {
    eip155: 'smartAccount',
  },
  coinbasePreference: 'all',
  allowUnsupportedChain: false,
}); 