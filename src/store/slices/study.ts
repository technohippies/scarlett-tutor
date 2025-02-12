import { StateCreator } from 'zustand';
import { StoreState } from '../types';
import { Flashcard, StudyProgress } from '../../lib/idb/schema';
import { getDeckFlashcards, getTodayStudyLog, updateStudyLog, getDeckProgress, updateProgress } from '../../lib/idb';
import { fetchAndStoreFlashcards } from '../../lib/flashcards';

export interface StudySlice {
  deckId: number | null;
  cards: Flashcard[];
  currentCardIndex: number;
  isFlipped: boolean;
  isLoading: boolean;
  error: string | null;
  isCompleted: boolean;
  studyAgainCards: Flashcard[];
  stats: {
    total: number;
    correct: number;
    again: number;
    timeSpent: string;
  } | null;
  currentCard: Flashcard | null;
  isSessionComplete: boolean;
  startStudySession: (deckId: number) => Promise<void>;
  flipCard: () => void;
  answerCard: (answer: 'again' | 'good') => void;
  studyAgain: () => void;
  completeSession: () => Promise<void>;
}

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
      console.log('Starting study session for deck:', deckId);
      set({ isLoading: true, error: null, deckId });

      // Get the selected deck
      const deck = get().selectedDeck;
      if (!deck) {
        throw new Error('Deck not found');
      }

      // Fetch and store flashcards if needed
      const flashcards = await fetchAndStoreFlashcards(deck);
      console.log('Fetched flashcards:', flashcards.length);

      // Get today's study log
      const todayLog = await getTodayStudyLog(deckId);
      if (!todayLog) {
        throw new Error('Study log not found');
      }

      // Get deck progress
      const progress = await getDeckProgress(deckId);
      const now = new Date();

      // Filter cards for study:
      // 1. New cards (up to remaining limit)
      // 2. Due cards (next_review <= now)
      const studiedToday = new Set(todayLog.cards_studied);
      const cardProgress = new Map(progress.map(p => [`${p.deck_id}-${p.flashcard_id}`, p]));

      const cardsForStudy = flashcards
        .filter(card => {
          // If card has been studied today, skip it
          if (studiedToday.has(card.id)) {
            return false;
          }

          const cardProg = cardProgress.get(`${deckId}-${card.id}`);
          if (!cardProg) {
            // New card - check if we've hit the daily limit
            return todayLog.new_cards_remaining > 0;
          }

          // Due card
          return new Date(cardProg.next_review) <= now;
        })
        .sort((a, b) => a.sort_order - b.sort_order);

      console.log('Cards selected for study:', cardsForStudy.length);

      set({
        cards: cardsForStudy,
        currentCardIndex: 0,
        currentCard: cardsForStudy[0] || null,
        isFlipped: false,
        isLoading: false,
        isCompleted: false,
        studyAgainCards: [],
        stats: {
          total: cardsForStudy.length,
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

  answerCard: async (answer: 'again' | 'good') => {
    const { cards, currentCardIndex, stats, studyAgainCards, deckId } = get();
    if (!deckId) return;

    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    try {
      // Update progress
      const now = new Date();
      const progress = await getDeckProgress(deckId);
      const cardProg = progress?.find(p => p.flashcard_id === currentCard.id);

      if (answer === 'again') {
        // Add card to study again pile
        set({
          studyAgainCards: [...studyAgainCards, currentCard],
          stats: stats ? { ...stats, again: stats.again + 1 } : null,
        });

        // Update progress with increased difficulty
        await updateProgress({
          deck_id: deckId,
          flashcard_id: currentCard.id,
          reps: (cardProg?.reps || 0) + 1,
          lapses: (cardProg?.lapses || 0) + 1,
          stability: cardProg?.stability || 0,
          difficulty: Math.min((cardProg?.difficulty || 0) + 1, 10),
          last_review: now.toISOString(),
          next_review: now.toISOString(), // Review again in this session
          last_interval: cardProg?.last_interval || null,
          retrievability: cardProg?.retrievability || null,
        });
      } else {
        // Update progress with success
        const interval = cardProg?.last_interval ? cardProg.last_interval * 2.5 : 24; // Hours
        const nextReview = new Date(now.getTime() + interval * 60 * 60 * 1000);

        await updateProgress({
          deck_id: deckId,
          flashcard_id: currentCard.id,
          reps: (cardProg?.reps || 0) + 1,
          lapses: cardProg?.lapses || 0,
          stability: (cardProg?.stability || 0) + 1,
          difficulty: Math.max((cardProg?.difficulty || 0) - 0.5, 1),
          last_review: now.toISOString(),
          next_review: nextReview.toISOString(),
          last_interval: interval,
          retrievability: 1,
        });

        set({
          stats: stats ? { ...stats, correct: stats.correct + 1 } : null,
        });
      }

      // Update study log
      const todayLog = await getTodayStudyLog(deckId);
      if (todayLog && !todayLog.cards_studied.includes(currentCard.id)) {
        await updateStudyLog({
          ...todayLog,
          cards_studied: [...todayLog.cards_studied, currentCard.id],
          new_cards_remaining: todayLog.new_cards_remaining - 1,
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
    } catch (error) {
      console.error('Failed to process answer:', error);
      set({ error: 'Failed to process answer' });
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
