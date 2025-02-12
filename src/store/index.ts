import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { createAuthSlice } from '../features/auth/store/slice';
import { createDecksSlice } from '../features/decks/store/slice';
import { createStudySlice } from '../features/study/store/slice';
import { createUISlice } from '../features/ui/store/slice';

import type { StoreState } from '../shared/types/store';

// Create the store
export const useStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createDecksSlice(...a),
      ...createStudySlice(...a),
      ...createUISlice(...a),
    }),
    { name: 'Anki Store' }
  )
);

// Re-export all store hooks
export * from '../features/auth/store/hooks';
export * from '../features/decks/store/hooks';
export * from '../features/study/store/hooks';
export * from '../features/ui/store/hooks';
