import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createAuthSlice, AuthSlice } from './slices/auth';
import { createDecksSlice, DecksSlice } from './slices/decks';
import { createStudySlice, StudySlice } from './slices/study';
import { createUISlice, UISlice } from './slices/ui';
import { useMemo } from 'react';

type Store = AuthSlice & DecksSlice & StudySlice & UISlice;

export const useStore = create<Store>()(
  devtools(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createDecksSlice(...a),
      ...createStudySlice(...a),
      ...createUISlice(...a),
    }),
    { name: 'Anki Store' }
  )
);

// Auth selectors
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

// Decks selectors
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

// Study selectors
export const useStudyData = () => {
  const state = useStore();
  return useMemo(() => ({
    deckId: state.deckId,
    cards: state.cards,
    currentCardIndex: state.currentCardIndex,
    currentCard: state.currentCard,
    studyAgainCards: state.studyAgainCards,
    stats: state.stats,
  }), [
    state.deckId,
    state.cards,
    state.currentCardIndex,
    state.currentCard,
    state.studyAgainCards,
    state.stats
  ]);
};

export const useStudyStatus = () => {
  const state = useStore();
  return useMemo(() => ({
    isFlipped: state.isFlipped,
    isLoading: state.isLoading,
    error: state.error,
    isCompleted: state.isCompleted,
    isSessionComplete: state.isSessionComplete,
  }), [
    state.isFlipped,
    state.isLoading,
    state.error,
    state.isCompleted,
    state.isSessionComplete
  ]);
};

// UI selectors
export const useIsDarkMode = () => useStore((state) => state.isDarkMode);
export const useUIState = () => {
  const state = useStore();
  return useMemo(() => ({
    isSidebarOpen: state.isSidebarOpen,
    isModalOpen: state.isModalOpen,
    modalContent: state.modalContent,
  }), [state.isSidebarOpen, state.isModalOpen, state.modalContent]);
};

// Actions
export const useAuthActions = () => {
  const state = useStore();
  return useMemo(() => ({
    connectWallet: state.connectWallet,
    connectOrbis: state.connectOrbis,
    checkWalletConnection: state.checkWalletConnection,
  }), [state]);
};

export const useStudyActions = () => {
  const state = useStore();
  return useMemo(() => ({
    startStudySession: state.startStudySession,
    flipCard: state.flipCard,
    answerCard: state.answerCard,
    studyAgain: state.studyAgain,
    completeSession: state.completeSession,
  }), [state]);
};

export const useUIActions = () => {
  const state = useStore();
  return useMemo(() => ({
    toggleDarkMode: state.toggleDarkMode,
    toggleSidebar: state.toggleSidebar,
    openModal: state.openModal,
    closeModal: state.closeModal,
  }), [state]);
};
