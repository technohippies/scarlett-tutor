import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Deck, Flashcard } from '../lib/idb/schema';

export interface Deck {
  id: number;
  name: string;
  description: string;
  creator: string;
  price: number;
  category: string;
  language: string;
  img_cid: string | null;
  flashcards_cid: string;
  encryption_key: string | null;
  access_conditions: string | null;
  stats?: DeckStats;
}

export interface DeckStats {
  new: number;
  due: number;
  review: number;
}

export interface Flashcard {
  sort_order: number;
  front_text: string;
  back_text: string;
  front_language: string;
  back_language: string;
  notes: string | null;
  front_image_cid: string | null;
  back_image_cid: string | null;
  audio_tts_cid: string | null;
}

export interface StudyCard extends Flashcard {
  id: number;
  deckId: number;
  state: 'new' | 'learning' | 'review';
  due: Date | null;
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
}

export interface StudyStats {
  total: number;
  correct: number;
  again: number;
  timeSpent: string;
}

export interface StoreState {
  // Auth
  address: string | null;
  isWalletConnected: boolean;
  orbis: any | null; // TODO: Add proper Orbis type when package is installed
  isOrbisConnected: boolean;
  litNodeClient: any | null; // TODO: Add proper Lit Protocol type
  
  // Decks
  decks: Deck[];
  selectedDeck: Deck | null;
  isLoading: boolean;
  error: string | null;
  hasStudiedToday: boolean;
  
  // Study
  deckId: number | null;
  cards: Flashcard[];
  currentCardIndex: number;
  isFlipped: boolean;
  studyAgainCards: Flashcard[];
  currentCard: Flashcard | null;
  isCompleted: boolean;
  isSessionComplete: boolean;

  // UI
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
}

export type Store = StoreState; 