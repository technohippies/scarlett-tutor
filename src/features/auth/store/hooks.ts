import { useMemo } from 'react';
import { useStore } from '../../../store';

export const useWalletStatus = () => useStore((state) => state.isWalletConnected);
export const useWalletAddress = () => useStore((state) => state.address);
export const useAuthClients = () => {
  const state = useStore();
  return useMemo(() => ({
    litNodeClient: state.litNodeClient,
    orbis: state.orbis,
    isOrbisConnected: state.isOrbisConnected,
  }), [state.litNodeClient, state.orbis, state.isOrbisConnected]);
};

export const useAuthActions = () => {
  const state = useStore();
  return useMemo(() => ({
    connectWallet: state.connectWallet,
    connectOrbis: state.connectOrbis,
    checkWalletConnection: state.checkWalletConnection,
  }), [state]);
}; 