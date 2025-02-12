import { StateCreator } from 'zustand';
import { StoreState } from '../types';
import { Deck } from '../../lib/idb/schema';
import { TablelandClient } from '../../lib/tableland';

export interface DecksSlice {
  decks: Deck[];
  selectedDeck: Deck | null;
  isLoading: boolean;
  error: string | null;
  fetchDecks: () => Promise<void>;
  selectDeck: (deckId: number) => Promise<void>;
  addDeck: (deck: Deck) => void;
  removeDeck: (deckId: number) => void;
  updateDeckStats: (deckId: number, stats: { new: number; due: number; review: number }) => void;
}

const tableland = TablelandClient.getInstance();

let fetchInProgress = false;

export const createDecksSlice: StateCreator<StoreState, [], [], DecksSlice> = (set, get) => ({
  decks: [],
  selectedDeck: null,
  isLoading: false,
  error: null,

  fetchDecks: async () => {
    const state = get();
    // Prevent multiple concurrent fetches
    if (fetchInProgress || state.isLoading) {
      return;
    }

    try {
      fetchInProgress = true;
      set({ isLoading: true, error: null });
      
      const decks = await tableland.getAllDecks();
      
      // Only update if necessary
      if (JSON.stringify(state.decks) !== JSON.stringify(decks)) {
        set({ decks, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[DecksSlice] Failed to fetch decks:', error);
      set({ error: 'Failed to fetch decks', isLoading: false });
    } finally {
      fetchInProgress = false;
    }
  },

  selectDeck: async (deckId: number) => {
    const state = get();
    if (state.selectedDeck?.id === deckId) {
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const deck = await tableland.getDeck(deckId);
      if (!deck) {
        throw new Error('Deck not found');
      }
      set({ selectedDeck: deck, isLoading: false });
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
});
