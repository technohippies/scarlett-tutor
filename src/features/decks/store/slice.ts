import { StateCreator } from 'zustand';
import type { StoreState } from '../../../shared/types';
import type { Deck } from '../../../shared/services/idb/schema';
import { TablelandClient } from '../../../shared/services/tableland';
import { getTodayStudyLog, getDeckStats, getAllDecks as getDecksFromIDB } from '../../../shared/services/idb';

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
  updateDeckStats: (deckId: number, stats: { new: number; due: number; review: number }) => void;
  updateDeckLastSynced: (deckId: number, timestamp: number) => void;
}

const tableland = TablelandClient.getInstance();

let fetchInProgress = false;

export const createDecksSlice: StateCreator<StoreState, [], [], DecksSlice> = (set, get) => ({
  decks: [],
  selectedDeck: null,
  isLoading: false,
  error: null,
  hasStudiedToday: false,

  fetchDecks: async () => {
    // Prevent multiple concurrent fetches
    if (fetchInProgress || get().isLoading) {
      return;
    }

    try {
      fetchInProgress = true;
      set({ isLoading: true, error: null });
      
      // First try to get decks from IDB
      let decks = await getDecksFromIDB();
      console.log('[DecksSlice] Loaded decks from IDB:', {
        count: decks.length,
        decks
      });

      // If online, try to fetch from Tableland and update IDB
      if (navigator.onLine) {
        try {
          const tablelandDecks = await tableland.getAllDecks();
          if (tablelandDecks.length > 0) {
            decks = tablelandDecks;
          }
        } catch (error) {
          console.warn('[DecksSlice] Failed to fetch from Tableland, using IDB data:', error);
        }
      }
      
      // Load stats for each deck
      const decksWithStats = await Promise.all(decks.map(async (deck) => {
        const stats = await getDeckStats(deck.id);
        return { ...deck, stats };
      }));
      
      // Only update if necessary
      if (JSON.stringify(get().decks) !== JSON.stringify(decksWithStats)) {
        set({ decks: decksWithStats, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[DecksSlice] Failed to fetch decks:', error);
      set({ error: 'Failed to load decks', isLoading: false });
    } finally {
      fetchInProgress = false;
    }
  },

  selectDeck: async (deckId: number) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get deck data and stats in parallel
      const [deck, stats] = await Promise.all([
        tableland.getDeck(deckId),
        getDeckStats(deckId)
      ]);
      
      if (!deck) {
        throw new Error('Deck not found');
      }

      // Check if deck has been studied today
      const todayLog = await getTodayStudyLog(deckId);
      const hasStudiedToday = todayLog ? todayLog.cards_studied.length > 0 : false;

      console.log('[DecksSlice] Updating deck:', {
        deckId,
        stats,
        hasStudiedToday,
        timestamp: new Date().toISOString()
      });

      set({ 
        selectedDeck: { ...deck, stats }, 
        isLoading: false,
        hasStudiedToday
      });
    } catch (error) {
      console.error('Failed to select deck:', error);
      set({ error: 'Failed to select deck', isLoading: false });
    }
  },

  addDeck: (deck: Deck) => {
    const { decks } = get();
    if (decks.some(d => d.id === deck.id)) {
      return;
    }
    set({ decks: [...decks, deck] });
  },

  removeDeck: (deckId: number) => {
    const { decks } = get();
    set({ decks: decks.filter((deck) => deck.id !== deckId) });
  },

  updateDeckStats: (deckId: number, stats: { new: number; due: number; review: number }) => {
    const { decks, selectedDeck } = get();
    const updatedDecks = decks.map((deck) =>
      deck.id === deckId ? { ...deck, stats } : deck
    );
    set({
      decks: updatedDecks,
      selectedDeck: selectedDeck?.id === deckId ? { ...selectedDeck, stats } : selectedDeck,
    });
  },

  updateDeckLastSynced: (deckId: number, timestamp: number) => {
    const { decks, selectedDeck } = get();
    console.log('[DecksSlice] Updating deck last_synced:', {
      deckId,
      timestamp,
      currentSelectedDeck: selectedDeck?.id
    });
    
    const updatedDecks = decks.map((deck) =>
      deck.id === deckId ? { ...deck, last_synced: timestamp } : deck
    );
    set({
      decks: updatedDecks,
      selectedDeck: selectedDeck?.id === deckId ? { ...selectedDeck, last_synced: timestamp } : selectedDeck,
    });
  },
});
