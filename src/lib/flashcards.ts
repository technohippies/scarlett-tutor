import { Deck, Flashcard } from './idb/schema';
import { addFlashcards, getDeckFlashcards, getTodayStudyLog, updateStudyLog } from './idb';

interface FlashcardsResponse {
  flashcards: Omit<Flashcard, 'id'>[];
}

interface EncryptedFlashcardsResponse {
  encrypted_content: string;
  encryption_key: string;
  access_conditions: string;
}

export async function fetchAndStoreFlashcards(deck: Deck) {
  try {
    console.log('Fetching flashcards for deck:', deck.id);
    
    // First check if we already have the flashcards in IDB
    const existingCards = await getDeckFlashcards(deck.id);
    if (existingCards.length > 0) {
      console.log('Found existing flashcards in IDB:', existingCards.length);
      return existingCards;
    }

    // Fetch flashcards from IPFS
    const response = await fetch(`https://public.w3ipfs.storage/ipfs/${deck.flashcards_cid}`);
    if (!response.ok) {
      throw new Error('Failed to fetch flashcards from IPFS');
    }

    let flashcards: Omit<Flashcard, 'id'>[];

    if (deck.encryption_key) {
      console.log('Deck is encrypted, decrypting flashcards...');
      const encryptedData: EncryptedFlashcardsResponse = await response.json();
      // TODO: Implement Lit Protocol decryption
      // For now, throw an error
      throw new Error('Encrypted decks not yet implemented');
    } else {
      console.log('Deck is not encrypted, storing flashcards...');
      const data: FlashcardsResponse = await response.json();
      flashcards = data.flashcards;
    }

    // Store flashcards in IDB
    await addFlashcards(deck.id, flashcards);
    console.log('Stored flashcards in IDB:', flashcards.length);

    // Initialize study log for today if it doesn't exist
    const todayLog = await getTodayStudyLog(deck.id);
    if (!todayLog) {
      const date = new Date().toISOString().split('T')[0];
      await updateStudyLog({
        date,
        deck_id: deck.id,
        cards_studied: [],
        new_cards_remaining: 20, // Start with 20 new cards per day
      });
      console.log('Initialized study log for today');
    }

    // Return the stored flashcards
    return getDeckFlashcards(deck.id);
  } catch (error) {
    console.error('Failed to fetch and store flashcards:', error);
    throw error;
  }
} 