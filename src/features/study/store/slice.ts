import { StateCreator } from 'zustand';
import type { StudySlice, StoreState } from '../../../shared/types';
import type { Flashcard, StudyProgress } from '../../../shared/services/idb/schema';
import { getTodayStudyLog, updateStudyLog, getDeckProgress, updateProgress } from '../../../shared/services/idb';
import { fetchAndStoreFlashcards } from '../../../shared/services/flashcards';
import { saveProgress } from '../../../shared/services/orbis';

export const createStudySlice: StateCreator<StoreState, [], [], StudySlice> = (set, get) => ({
  deckId: null,
  cards: [],
  currentCardIndex: 0,
  isFlipped: false,
  isLoading: false,
  error: null,
  isCompleted: false,
  studyAgainCards: [],
  currentCard: null,
  isSessionComplete: false,

  startStudySession: async (deckId: number) => {
    try {
      console.log('[startStudySession] Starting:', {
        deckId,
        currentState: {
          currentDeckId: get().deckId,
          cardsCount: get().cards.length
        }
      });
      
      set({ isLoading: true, error: null });

      // Get the selected deck
      const deck = get().selectedDeck;
      if (!deck) {
        throw new Error('Deck not found');
      }

      // Get user's address for paid decks
      const { address } = get();
      const userAddress = address || undefined;

      // Cache the address in session storage for persistence
      if (address) {
        sessionStorage.setItem('lastConnectedAddress', address);
      }

      // Only fetch flashcards if we don't already have them for this deck
      const currentCards = get().cards;
      const currentDeckId = get().deckId;
      
      console.log('[startStudySession] Cache check:', {
        currentDeckId,
        newDeckId: deckId,
        currentCardsCount: currentCards.length,
        shouldFetch: currentCards.length === 0 || currentDeckId !== deckId
      });

      if (currentCards.length === 0 || currentDeckId !== deckId) {
        // Fetch and store flashcards if needed
        const flashcards = await fetchAndStoreFlashcards(deck, userAddress);
        console.log('[startStudySession] Fetched cards:', {
          deckId,
          count: flashcards.length
        });

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

        console.log('[startStudySession] Study status:', {
          deckId,
          studiedToday: studiedToday.size,
          newCardsRemaining: todayLog.new_cards_remaining,
          totalProgress: progress.length,
          totalCards: flashcards.length
        });

        // If we've studied today, allow reviewing all cards
        const isStudyingAgain = studiedToday.size > 0;

        let cardsForStudy: Flashcard[];

        if (isStudyingAgain) {
          // When studying again, show all cards that were studied today
          cardsForStudy = flashcards
            .filter(card => studiedToday.has(card.id))
            .sort((a, b) => a.sort_order - b.sort_order);

          console.log('[startStudySession] Study again mode:', {
            deckId,
            totalCards: cardsForStudy.length,
            firstCard: cardsForStudy[0]?.id
          });
        } else {
          // First time studying today - normal new/due card selection
          const { newCards, dueCards } = flashcards.reduce((acc, card) => {
            if (studiedToday.has(card.id)) {
              console.log(`[startStudySession] Card ${card.id} already studied today`);
              return acc;
            }

            const cardProg = cardProgress.get(`${deckId}-${card.id}`);
            if (!cardProg) {
              acc.newCards.push(card);
            } else if (new Date(cardProg.next_review) <= now) {
              acc.dueCards.push(card);
            }
            return acc;
          }, { newCards: [] as Flashcard[], dueCards: [] as Flashcard[] });

          console.log('[startStudySession] Card distribution:', {
            deckId,
            totalNewCards: newCards.length,
            totalDueCards: dueCards.length,
            newCardsLimit: todayLog.new_cards_remaining
          });

          // Take only up to new_cards_remaining from new cards
          const selectedNewCards = newCards
            .sort((a, b) => a.sort_order - b.sort_order)
            .slice(0, todayLog.new_cards_remaining);

          // Combine with due cards
          cardsForStudy = [
            ...selectedNewCards,
            ...dueCards.sort((a, b) => a.sort_order - b.sort_order)
          ];
        }

        console.log('[startStudySession] Final selection:', {
          deckId,
          totalSelected: cardsForStudy.length,
          firstCard: cardsForStudy[0]?.id,
          isStudyingAgain
        });

        set({
          deckId,
          cards: cardsForStudy,
          currentCardIndex: 0,
          currentCard: cardsForStudy[0] || null,
          isFlipped: false,
          isLoading: false,
          isCompleted: cardsForStudy.length === 0,
          studyAgainCards: [],
        });
      } else {
        console.log('[startStudySession] Using existing cards:', {
          deckId,
          count: currentCards.length
        });
        // Just reset loading state if we already have the cards
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[startStudySession] Failed:', error);
      set({ error: 'Failed to start study session', isLoading: false });
      throw error;
    }
  },

  flipCard: () => {
    set({ isFlipped: true });
  },

  answerCard: async (answer: 'again' | 'good') => {
    const { cards, currentCardIndex, studyAgainCards, deckId } = get();
    console.log('[answerCard] Processing answer:', {
      answer,
      currentCardIndex,
      totalCards: cards.length,
    });

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

      // Move to next card or complete session
      const nextIndex = currentCardIndex + 1;
      const isLastCard = nextIndex >= cards.length;
      const hasCardsToReview = studyAgainCards.length > 0;

      console.log('[answerCard] Session status:', {
        nextIndex,
        cardsLength: cards.length,
        studyAgainCount: studyAgainCards.length,
        isLastCard,
        hasCardsToReview
      });

      if (!isLastCard) {
        // Continue with next card
        set({
          currentCardIndex: nextIndex,
          currentCard: cards[nextIndex],
          isFlipped: false,
        });
      } else if (hasCardsToReview) {
        // Start reviewing cards that need to be studied again
        console.log('[answerCard] Starting review of again cards:', {
          count: studyAgainCards.length
        });
        
        set({
          cards: studyAgainCards,
          studyAgainCards: [],
          currentCardIndex: 0,
          currentCard: studyAgainCards[0],
          isFlipped: false,
        });
      } else {
        // Session complete - navigate to completion page
        console.log('[answerCard] Session complete:', {
          totalCards: cards.length,
          studiedCards: currentCardIndex + 1
        });
        
        // Set flag in sessionStorage to prevent direct access to completion page
        sessionStorage.setItem('hasCompletedStudy', 'true');
        
        set({
          isCompleted: true,
          isSessionComplete: true,
        });
      }
    } catch (error) {
      console.error('[answerCard] Failed to process answer:', error);
      set({ error: 'Failed to process answer' });
    }
  },

  studyAgain: () => {
    const { cards } = get();
    console.log('[studyAgain] Current state:', {
      cardsCount: cards.length,
      isCompleted: get().isCompleted,
      isSessionComplete: get().isSessionComplete
    });

    set({
      currentCardIndex: 0,
      currentCard: cards[0],
      isFlipped: false,
      isCompleted: false,
      isSessionComplete: false,
      studyAgainCards: [],
    });

    console.log('[studyAgain] State after reset:', {
      isCompleted: get().isCompleted,
      isSessionComplete: get().isSessionComplete
    });
  },

  completeSession: async () => {
    const { isCompleted, isSessionComplete, cards, deckId } = get();
    console.log('[completeSession] Starting with state:', {
      isCompleted,
      isSessionComplete,
      totalCards: cards.length
    });

    if (!isCompleted || !isSessionComplete) {
      console.warn('[completeSession] Called before session was complete');
      return;
    }

    try {
      set({ isLoading: true, error: null });
      
      // Get progress from IDB
      if (!deckId) {
        throw new Error('No deck ID found');
      }

      const progress = await getDeckProgress(deckId);
      console.log('[completeSession] Saving to Ceramic:', {
        totalCards: cards.length,
        progressEntries: progress.length
      });

      // Get Orbis instance
      const orbis = get().orbis;
      if (!orbis) {
        throw new Error('Orbis not connected');
      }

      // Save progress to Orbis
      await saveProgress(progress);
      console.log('[completeSession] Progress saved to Orbis');
      
      // Reset study state and clear session storage
      sessionStorage.removeItem('hasCompletedStudy');
      
      // Update hasStudiedToday flag
      const todayLog = await getTodayStudyLog(deckId);
      set({ hasStudiedToday: todayLog ? todayLog.cards_studied.length > 0 : false });
      
      set({
        isLoading: false,
        cards: [],
        currentCardIndex: 0,
        currentCard: null,
        isFlipped: false,
        studyAgainCards: [],
        isCompleted: false,
        isSessionComplete: false,
      });
    } catch (error) {
      console.error('[completeSession] Failed:', error);
      set({ error: 'Failed to save progress', isLoading: false });
      throw error;
    }
  },
});
