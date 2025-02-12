import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { OrbisDB } from '@useorbis/db-sdk';

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
  // Auth slice
  isWalletConnected: boolean;
  address: string | null;
  litNodeClient: LitNodeClient | null;
  orbis: OrbisDB | null;
  isOrbisConnected: boolean;

  // Decks slice
  decks: Deck[];
  selectedDeck: Deck | null;
  isLoading: boolean;
  error: string | null;

  // Study slice
  deckId: number | null;
  cards: StudyCard[];
  currentCardIndex: number;
  isFlipped: boolean;
  studyAgainCards: StudyCard[];
  stats: StudyStats | null;
  isCompleted: boolean;

  // UI slice
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
} 