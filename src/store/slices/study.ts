import { StateCreator } from 'zustand';
import { StoreState } from '../types';
import { StudyCard, StudyStats } from '../types';
import { TablelandClient } from '../../lib/tableland';

export interface StudySlice {
  deckId: number | null;
  cards: StudyCard[];
  currentCardIndex: number;
  isFlipped: boolean;
  isLoading: boolean;
  error: string | null;
  isCompleted: boolean;
  studyAgainCards: StudyCard[];
  stats: StudyStats | null;
  currentCard: StudyCard | null;
  isSessionComplete: boolean;
  startStudySession: (deckId: number) => Promise<void>;
  flipCard: () => void;
  answerCard: (answer: 'again' | 'good') => void;
  studyAgain: () => void;
  completeSession: () => Promise<void>;
}

const tableland = new TablelandClient();

export const createStudySlice: StateCreator<StoreState, [], [], StudySlice> = (set, get) => ({
  deckId: null,
  cards: [],
  currentCardIndex: 0,
  isFlipped: false,
  isLoading: false,
  error: null,
  isCompleted: false,
  studyAgainCards: [],
  stats: null,
  currentCard: null,
  isSessionComplete: false,

  startStudySession: async (deckId: number) => {
    try {
      set({ isLoading: true, error: null, deckId });
      const deck = await tableland.getDeck(deckId);
      if (!deck) {
        throw new Error('Deck not found');
      }

      // TODO: Load cards from IDB or decrypt from IPFS
      // For now, just mock some cards
      const mockCards: StudyCard[] = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        deckId,
        sort_order: i + 1,
        front_text: `Front ${i + 1}`,
        back_text: `Back ${i + 1}`,
        front_language: 'eng',
        back_language: 'eng',
        notes: null,
        front_image_cid: null,
        back_image_cid: null,
        audio_tts_cid: null,
        state: 'new',
        due: null,
        interval: 0,
        ease: 2.5,
        reps: 0,
        lapses: 0,
      }));

      set({
        cards: mockCards,
        currentCardIndex: 0,
        currentCard: mockCards[0],
        isFlipped: false,
        isLoading: false,
        isCompleted: false,
        studyAgainCards: [],
        stats: {
          total: mockCards.length,
          correct: 0,
          again: 0,
          timeSpent: '0m',
        },
      });
    } catch (error) {
      console.error('Failed to start study session:', error);
      set({ error: 'Failed to start study session', isLoading: false });
    }
  },

  flipCard: () => {
    set({ isFlipped: true });
  },

  answerCard: (answer: 'again' | 'good') => {
    const { cards, currentCardIndex, stats, studyAgainCards } = get();
    const currentCard = cards[currentCardIndex];

    if (answer === 'again') {
      // Add card to study again pile
      set({
        studyAgainCards: [...studyAgainCards, currentCard],
        stats: stats ? { ...stats, again: stats.again + 1 } : null,
      });
    } else {
      set({
        stats: stats ? { ...stats, correct: stats.correct + 1 } : null,
      });
    }

    // Move to next card
    const nextIndex = currentCardIndex + 1;
    if (nextIndex < cards.length) {
      set({
        currentCardIndex: nextIndex,
        currentCard: cards[nextIndex],
        isFlipped: false,
      });
    } else if (studyAgainCards.length > 0) {
      // Start reviewing cards that need to be studied again
      set({
        cards: studyAgainCards,
        studyAgainCards: [],
        currentCardIndex: 0,
        currentCard: studyAgainCards[0],
        isFlipped: false,
      });
    } else {
      // Session complete
      set({
        isCompleted: true,
        isSessionComplete: true,
      });
    }
  },

  studyAgain: () => {
    const { cards } = get();
    set({
      currentCardIndex: 0,
      currentCard: cards[0],
      isFlipped: false,
      isCompleted: false,
      isSessionComplete: false,
      studyAgainCards: [],
      stats: {
        total: cards.length,
        correct: 0,
        again: 0,
        timeSpent: '0m',
      },
    });
  },

  completeSession: async () => {
    try {
      set({ isLoading: true, error: null });
      // TODO: Save progress to Ceramic
      // For now, just mock the save
      await new Promise((resolve) => setTimeout(resolve, 1000));
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to save progress:', error);
      set({ error: 'Failed to save progress', isLoading: false });
    }
  },
});
