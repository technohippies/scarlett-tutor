import { openDB, IDBPDatabase } from 'idb';
import { AnkiDB, Deck, Flashcard, StudyProgress, DailyStudyLog } from './schema';

const DB_NAME = 'far-anki';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<AnkiDB> | null = null;

export async function initDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<AnkiDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create decks store
      const deckStore = db.createObjectStore('decks', { keyPath: 'id' });
      deckStore.createIndex('by-name', 'name');
      deckStore.createIndex('by-category', 'category');

      // Create flashcards store
      const flashcardStore = db.createObjectStore('flashcards', { keyPath: 'id' });
      flashcardStore.createIndex('by-deck', 'deck_id');

      // Create progress store
      const progressStore = db.createObjectStore('progress', { keyPath: ['deck_id', 'flashcard_id'] });
      progressStore.createIndex('by-deck', 'deck_id');
      progressStore.createIndex('by-next-review', 'next_review');

      // Create study log store
      const studyLogStore = db.createObjectStore('study_log', { keyPath: ['date', 'deck_id'] });
      studyLogStore.createIndex('by-date', 'date');
    },
  });

  return dbInstance;
}

// Deck operations
export async function addDeck(deck: Deck) {
  const db = await initDB();
  return db.put('decks', deck);
}

export async function getDeck(id: number) {
  const db = await initDB();
  return db.get('decks', id);
}

export async function getAllDecks() {
  const db = await initDB();
  return db.getAll('decks');
}

export async function updateDeckLastSynced(deckId: number, timestamp: number) {
  const db = await initDB();
  console.log('[updateDeckLastSynced] Updating deck:', { deckId, timestamp });
  const deck = await db.get('decks', deckId);
  console.log('[updateDeckLastSynced] Current deck:', deck);
  if (deck) {
    const updatedDeck = { ...deck, last_synced: timestamp };
    console.log('[updateDeckLastSynced] Saving updated deck:', updatedDeck);
    return db.put('decks', updatedDeck);
  } else {
    console.warn('[updateDeckLastSynced] Deck not found:', deckId);
  }
}

// Flashcard operations
export async function addFlashcards(deckId: number, flashcards: Omit<Flashcard, 'id'>[]) {
  const db = await initDB();
  const tx = db.transaction('flashcards', 'readwrite');
  
  const promises = flashcards.map(async (card, index) => {
    const id = Date.now() + index; // Simple way to generate unique IDs
    return tx.store.add({ ...card, id, deck_id: deckId });
  });

  await Promise.all([...promises, tx.done]);
}

export async function getDeckFlashcards(deckId: number) {
  const db = await initDB();
  return db.getAllFromIndex('flashcards', 'by-deck', deckId);
}

// Progress operations
export async function updateProgress(progress: StudyProgress) {
  const db = await initDB();
  return db.put('progress', progress);
}

export async function getProgress(deckId: number, flashcardId: number) {
  const db = await initDB();
  return db.get('progress', [deckId, flashcardId]);
}

export async function getDeckProgress(deckId: number) {
  const db = await initDB();
  return db.getAllFromIndex('progress', 'by-deck', deckId);
}

// Study log operations
export async function updateStudyLog(log: DailyStudyLog) {
  const db = await initDB();
  return db.put('study_log', log);
}

export async function getStudyLog(date: string, deckId: number) {
  const db = await initDB();
  return db.get('study_log', [date, deckId]);
}

export async function getTodayStudyLog(deckId: number) {
  const today = new Date().toISOString().split('T')[0];
  return getStudyLog(today, deckId);
}

// Utility functions
export async function getDeckStats(deckId: number) {
  const [flashcards, progress, todayLog] = await Promise.all([
    getDeckFlashcards(deckId),
    getDeckProgress(deckId),
    getTodayStudyLog(deckId)
  ]);

  console.log('[getDeckStats] Raw data:', {
    deckId,
    flashcardsCount: flashcards.length,
    progressCount: progress.length,
    todayLog
  });

  const now = new Date();
  const studiedToday = todayLog?.cards_studied || [];
  const cardProgress = new Map(progress.map(p => [`${p.deck_id}-${p.flashcard_id}`, p]));

  // Filter cards into categories
  const { newCards, dueCards } = flashcards.reduce((acc, card) => {
    if (studiedToday.includes(card.id)) {
      return acc;
    }

    const cardProg = cardProgress.get(`${deckId}-${card.id}`);
    if (!cardProg) {
      acc.newCards.push(card);
    } else if (new Date(cardProg.next_review) <= now) {
      acc.dueCards.push(card);
    }
    return acc;
  }, { newCards: [] as typeof flashcards, dueCards: [] as typeof flashcards });

  // Calculate stats
  const stats = {
    new: newCards.length,          // Total number of cards without progress
    due: dueCards.length,          // Number of cards due for review
    review: progress.length        // Total number of cards with progress
  };

  console.log('[getDeckStats] Calculated stats:', {
    deckId,
    stats,
    studiedTodayCount: studiedToday.length,
    newCardsCount: newCards.length,
    dueCardsCount: dueCards.length,
    totalProgressCount: progress.length,
    remainingNewToday: todayLog?.new_cards_remaining ?? 20
  });

  return stats;
}
