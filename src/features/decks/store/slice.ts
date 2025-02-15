import { StateCreator } from 'zustand';
import type { StoreState } from '../../../shared/types';
import type { Deck } from '../../../shared/services/idb/schema';
import { TablelandClient } from '../../../shared/services/tableland';
import { getTodayStudyLog, getDeckStats, getAllDecks as getDecksFromIDB } from '../../../shared/services/idb';
import { addDebugLog } from '../../../shared/components/debug-info';

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
    if (fetchInProgress || get().isLoading) {
      return;
    }

    try {
      fetchInProgress = true;
      set({ isLoading: true, error: null });
      
      // First try to get decks from IDB
      let decks = await getDecksFromIDB();
      addDebugLog(`Loaded ${decks.length} decks from IDB`);

      // If online, try to fetch from Tableland and update IDB
      if (navigator.onLine) {
        try {
          const tablelandDecks = await tableland.getAllDecks();
          if (tablelandDecks.length > 0) {
            decks = tablelandDecks;
            addDebugLog(`Updated with ${tablelandDecks.length} decks from Tableland`);
          }
        } catch (error) {
          addDebugLog('Failed to fetch from Tableland, using IDB data', 'warning');
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
        addDebugLog(`Updated decks state with ${decksWithStats.length} decks`);
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      addDebugLog(`Failed to fetch decks: ${error}`, 'error');
      set({ error: 'Failed to load decks', isLoading: false });
    } finally {
      fetchInProgress = false;
    }
  },

  selectDeck: async (deckId: number) => {
    try {
      set({ isLoading: true, error: null });
      
      // First try to get the deck from IDB
      const decks = await getDecksFromIDB();
      let deck: Deck | null = decks.find(d => d.id === deckId) ?? null;
      
      if (deck) {
        addDebugLog(`Found deck ${deckId} in IDB`);
      }
      
      // If not in IDB and online, try Tableland
      if (!deck && navigator.onLine) {
        try {
          deck = await tableland.getDeck(deckId);
          if (deck) {
            addDebugLog(`Retrieved deck ${deckId} from Tableland`);
          }
        } catch (error) {
          addDebugLog(`Failed to fetch deck ${deckId} from Tableland`, 'warning');
        }
      }

      if (!deck) {
        throw new Error('Deck not found');
      }

      // Get stats and study log in parallel
      const [stats, todayLog] = await Promise.all([
        getDeckStats(deckId),
        getTodayStudyLog(deckId)
      ]);

      const hasStudiedToday = todayLog ? todayLog.cards_studied.length > 0 : false;

      addDebugLog(`Deck ${deckId} stats: ${JSON.stringify({
        new: stats?.new || 0,
        review: stats?.review || 0,
        due: stats?.due || 0,
        hasStudiedToday
      })}`);

      set({ 
        selectedDeck: { ...deck, stats }, 
        isLoading: false,
        hasStudiedToday
      });
    } catch (error) {
      addDebugLog(`Failed to select deck ${deckId}: ${error}`, 'error');
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
