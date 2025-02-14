import type { ReactNode } from 'react';
import type { LitNodeClient } from '@lit-protocol/lit-node-client';
import type { OrbisDB } from '@useorbis/db-sdk';
import type { Deck, Flashcard, DeckStats } from './index';
import type { AuthMethod } from '@lit-protocol/auth-browser';

// Auth slice
export interface AuthSlice {
  address: string | null;
  isWalletConnected: boolean;
  orbis: OrbisDB | null;
  isOrbisConnected: boolean;
  litNodeClient: LitNodeClient | null;
  connectWallet: () => Promise<void>;
  connectOrbis: () => Promise<void>;
  checkWalletConnection: () => Promise<void>;
}

// Decks slice
export interface DecksSlice {
  decks: Deck[];
  selectedDeck: Deck | null;
  isLoading: boolean;
  error: string | null;
  hasStudiedToday: boolean;
  fetchDecks: () => Promise<void>;
  selectDeck: (deckId: number) => Promise<void>;
  addDeck: (deck: Deck) => void;
  removeDeck: (deckId: number) => void;
  updateDeckStats: (deckId: number, stats: DeckStats) => void;
  updateDeckLastSynced: (deckId: number, timestamp: number) => void;
}

// Study slice
export interface StudySlice {
  deckId: number | null;
  cards: Flashcard[];
  currentCardIndex: number;
  isFlipped: boolean;
  studyAgainCards: Flashcard[];
  currentCard: Flashcard | null;
  isCompleted: boolean;
  isSessionComplete: boolean;
  startStudySession: (deckId: number) => Promise<void>;
  flipCard: () => void;
  answerCard: (answer: 'again' | 'good') => void;
  studyAgain: () => void;
  completeSession: () => Promise<void>;
}

// UI slice
export interface UISlice {
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  modalContent: ReactNode | null;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
}

// Combined store state
export interface StoreState extends AuthSlice, DecksSlice, StudySlice, UISlice {} 