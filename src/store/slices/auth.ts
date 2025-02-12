import { StateCreator } from 'zustand';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { OrbisDB } from '@useorbis/db-sdk';
import { StoreState } from '../types';
import { connect, getAccount } from '@wagmi/core';
import { injected } from 'wagmi/connectors';
import { config } from '../../lib/wagmi';

export interface AuthSlice {
  isWalletConnected: boolean;
  address: string | null;
  litNodeClient: LitNodeClient | null;
  orbis: OrbisDB | null;
  isOrbisConnected: boolean;
  setWalletConnection: (connected: boolean, address?: string) => void;
  setLitNodeClient: (client: LitNodeClient) => void;
  setOrbisConnection: (connected: boolean, orbis?: OrbisDB) => void;
  connectWallet: () => Promise<void>;
  connectOrbis: () => Promise<void>;
  checkWalletConnection: () => Promise<void>;
}

export const createAuthSlice: StateCreator<StoreState, [], [], AuthSlice> = (set) => ({
  isWalletConnected: false,
  address: null,
  litNodeClient: null,
  orbis: null,
  isOrbisConnected: false,

  setWalletConnection: (connected: boolean, address?: string) => {
    console.log('Setting wallet connection:', { connected, address });
    set({ isWalletConnected: connected, address: address || null });
  },

  setLitNodeClient: (client: LitNodeClient) => {
    set({ litNodeClient: client });
  },

  setOrbisConnection: (connected: boolean, orbis?: OrbisDB) => {
    set({ isOrbisConnected: connected, orbis: orbis || null });
  },

  checkWalletConnection: async () => {
    try {
      const account = getAccount(config);
      console.log('Checking wallet connection status:', account);
      if (account.isConnected && account.address) {
        console.log('Wallet already connected:', account.address);
        set({ isWalletConnected: true, address: account.address });
      } else {
        console.log('Wallet not connected');
        set({ isWalletConnected: false, address: null });
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      set({ isWalletConnected: false, address: null });
    }
  },

  connectWallet: async () => {
    try {
      console.log('Attempting to connect wallet...');
      const result = await connect(config, {
        connector: injected(),
      });
      console.log('Wallet connected successfully:', result);
      set({ isWalletConnected: true, address: result.accounts[0] });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ isWalletConnected: false, address: null });
    }
  },

  connectOrbis: async () => {
    try {
      // TODO: Implement Orbis connection
      // For now, just mock the connection
      set({ isOrbisConnected: true, orbis: {} as OrbisDB });
    } catch (error) {
      console.error('Failed to connect to Orbis:', error);
    }
  },
});
