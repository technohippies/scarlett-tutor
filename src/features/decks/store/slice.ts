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
      addDebugLog('Fetch already in progress, skipping', 'warning');
      return;
    }

    try {
      fetchInProgress = true;
      set({ isLoading: true, error: null });
      
      // First try to get decks from IDB
      addDebugLog('Attempting to load decks from IDB...');
      let decks = await getDecksFromIDB();
      addDebugLog(`IDB Load Result: ${decks.length} decks found${
        decks.length > 0 ? `: [${decks.map(d => `${d.id}:${d.name}`).join(', ')}]` : ''
      }`);

      // If online, try to fetch from Tableland
      if (navigator.onLine) {
        try {
          addDebugLog('Online - fetching from Tableland...');
          const tablelandDecks = await tableland.getAllDecks();
          if (tablelandDecks.length > 0) {
            decks = tablelandDecks;
            addDebugLog(`Tableland fetch successful: ${tablelandDecks.length} decks`);
          } else {
            addDebugLog('Tableland returned no decks', 'warning');
          }
        } catch (error) {
          addDebugLog(`Tableland fetch failed: ${error}`, 'warning');
        }
      } else {
        addDebugLog('Offline - skipping Tableland fetch');
      }
      
      // Load stats for each deck
      addDebugLog('Loading stats for decks...');
      const decksWithStats = await Promise.all(decks.map(async (deck) => {
        const stats = await getDeckStats(deck.id);
        addDebugLog(`Stats for deck ${deck.id} (${deck.name}): new=${stats?.new || 0}, review=${stats?.review || 0}, due=${stats?.due || 0}`);
        return { ...deck, stats };
      }));
      
      // Only update if necessary
      const currentDecks = get().decks;
      if (JSON.stringify(currentDecks) !== JSON.stringify(decksWithStats)) {
        addDebugLog(`State update needed: current=${currentDecks.length} decks, new=${decksWithStats.length} decks`);
        set({ decks: decksWithStats, isLoading: false });
      } else {
        addDebugLog('No state update needed - decks unchanged');
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
      addDebugLog(`Attempting to load deck ${deckId} from IDB...`);
      const decks = await getDecksFromIDB();
      let deck: Deck | null = decks.find(d => d.id === deckId) ?? null;
      
      if (deck) {
        addDebugLog(`Found deck in IDB: ${deck.id} (${deck.name})`);
      } else {
        addDebugLog(`Deck ${deckId} not found in IDB`);
      }
      
      // If not in IDB and online, try Tableland
      if (!deck && navigator.onLine) {
        try {
          addDebugLog('Online - attempting Tableland fetch...');
          deck = await tableland.getDeck(deckId);
          if (deck) {
            addDebugLog(`Retrieved deck from Tableland: ${deck.id} (${deck.name})`);
          } else {
            addDebugLog('Tableland returned null for deck', 'warning');
          }
        } catch (error) {
          addDebugLog(`Tableland fetch failed: ${error}`, 'warning');
        }
      } else if (!deck) {
        addDebugLog('Offline - skipping Tableland fetch');
      }

      if (!deck) {
        throw new Error('Deck not found in IDB or Tableland');
      }

      // Get stats and study log in parallel
      addDebugLog('Loading deck stats and study log...');
      const [stats, todayLog] = await Promise.all([
        getDeckStats(deckId),
        getTodayStudyLog(deckId)
      ]);

      const hasStudiedToday = todayLog ? todayLog.cards_studied.length > 0 : false;
      const studyCount = todayLog?.cards_studied.length ?? 0;

      addDebugLog(`Deck ${deckId} (${deck.name}) details:
• Stats: new=${stats?.new || 0}, review=${stats?.review || 0}, due=${stats?.due || 0}
• Study progress: ${hasStudiedToday ? `${studyCount} cards studied today` : 'not studied today'}`);

      set({ 
        selectedDeck: { ...deck, stats }, 
        isLoading: false,
        hasStudiedToday
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addDebugLog(`Failed to select deck ${deckId}: ${errorMsg}`, 'error');
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
