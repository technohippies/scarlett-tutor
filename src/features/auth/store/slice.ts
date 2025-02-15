import { StateCreator } from 'zustand';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { OrbisDB } from '@useorbis/db-sdk';
import { OrbisEVMAuth } from '@useorbis/db-sdk/auth';
import type { IEVMProvider } from '@useorbis/db-sdk';
import type { AuthSlice, StoreState } from '../../../shared/types';
import { getAccount, watchAccount } from '@wagmi/core';
import { config, appKit } from '../../../shared/services/wagmi';
import { db } from '../../../shared/services/orbis';

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
      console.log('[connectWallet] Attempting to connect wallet...');
      
      // Set up account watcher before opening modal
      const unwatch = watchAccount(config, {
        onChange(account) {
          console.log('[connectWallet] Account changed:', account);
          if (account.isConnected && account.address) {
            console.log('[connectWallet] Successfully connected:', account.address);
            set({ isWalletConnected: true, address: account.address });
          } else {
            console.log('[connectWallet] Disconnected');
            set({ isWalletConnected: false, address: null });
          }
        },
      });

      // Open AppKit modal and wait for interaction
      console.log('[connectWallet] Opening AppKit modal...');
      await appKit.open({ view: 'Connect' });
      
      // Wait for potential connection (give it some time for the modal interaction)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Final check after modal interaction
      const account = getAccount(config);
      console.log('[connectWallet] Final account check:', account);
      
      if (account.isConnected && account.address) {
        console.log('[connectWallet] Connection confirmed:', account.address);
        set({ isWalletConnected: true, address: account.address });
      }

      // Clean up the watcher after a delay
      setTimeout(() => {
        unwatch();
      }, 2000);

    } catch (error) {
      console.error('[connectWallet] Failed to connect wallet:', error);
      set({ isWalletConnected: false, address: null });
      throw error;
    }
  },

  connectOrbis: async () => {
    try {
      console.log('[connectOrbis] Attempting to connect to Orbis...');
      
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found');
      }

      const provider = window.ethereum as unknown as IEVMProvider;
      const auth = new OrbisEVMAuth(provider);
      
      console.log('[connectOrbis] Connecting user...');
      const authResult = await db.connectUser({ auth });
      console.log('[connectOrbis] Auth result:', authResult);
      
      const isConnected = await db.isUserConnected();
      console.log('[connectOrbis] Connection status:', { isConnected });
      
      if (isConnected) {
        set({ isOrbisConnected: true, orbis: db });
        console.log('[connectOrbis] Successfully connected to Orbis');
      } else {
        throw new Error('Failed to connect to Orbis');
      }
    } catch (error) {
      console.error('[connectOrbis] Failed to connect:', error);
      set({ isOrbisConnected: false, orbis: null });
      throw error;
    }
  },
});
