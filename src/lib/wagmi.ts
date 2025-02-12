import { createConfig, http, createStorage } from '@wagmi/core';
import { baseSepolia } from '@wagmi/core/chains';
import { injected } from '@wagmi/connectors';

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

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(),
  },
  storage,
}); 