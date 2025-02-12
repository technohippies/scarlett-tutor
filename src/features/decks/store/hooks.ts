import { useMemo } from 'react';
import { useStore } from '../../../store';

export const useDecks = () => useStore((state) => state.decks);
export const useSelectedDeck = () => useStore((state) => state.selectedDeck);
export const useDecksStatus = () => {
  const state = useStore();
  return useMemo(() => ({
    isLoading: state.isLoading,
    error: state.error,
    hasStudiedToday: state.hasStudiedToday,
  }), [state.isLoading, state.error, state.hasStudiedToday]);
};

export const useDecksActions = () => {
  const state = useStore();
  return useMemo(() => ({
    fetchDecks: state.fetchDecks,
    selectDeck: state.selectDeck,
    addDeck: state.addDeck,
    removeDeck: state.removeDeck,
    updateDeckStats: state.updateDeckStats,
  }), [state]);
}; 