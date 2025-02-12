import { DBSchema } from 'idb';

export interface Flashcard {
  id: number;
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
  last_synced?: number;
  stats?: {
    new: number;
    due: number;
    review: number;
  };
}

export interface StudyProgress {
  deck_id: number;
  flashcard_id: number;
  reps: number;
  lapses: number;
  stability: number;
  difficulty: number;
  last_review: string;
  next_review: string;
  last_interval: number | null;
  retrievability: number | null;
}

export interface DailyStudyLog {
  date: string; // YYYY-MM-DD
  deck_id: number;
  cards_studied: number[];
  new_cards_remaining: number;
}

export interface AnkiDB extends DBSchema {
  decks: {
    key: number;
    value: Deck;
    indexes: {
      'by-name': string;
      'by-category': string;
    };
  };
  flashcards: {
    key: number;
    value: Flashcard & { deck_id: number };
    indexes: {
      'by-deck': number;
    };
  };
  progress: {
    key: [number, number]; // [deck_id, flashcard_id]
    value: StudyProgress;
    indexes: {
      'by-deck': number;
      'by-next-review': string;
    };
  };
  study_log: {
    key: [string, number]; // [date, deck_id]
    value: DailyStudyLog;
    indexes: {
      'by-date': string;
    };
  };
}
