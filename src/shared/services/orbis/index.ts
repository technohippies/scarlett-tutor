import { OrbisDB } from '@useorbis/db-sdk';
import type { StudyProgress } from "../idb/schema";
import { updateProgress, updateDeckLastSynced } from "../idb";
import { 
  CONTEXT_ID, 
  PROGRESS_MODEL, 
  CERAMIC_NODE_URL,
  ORBIS_NODE_URL,
  ORBIS_ENVIRONMENT_ID,
  OrbisProgressDocument, 
  SaveResult, 
  SaveResults 
} from './models';
import { useStore } from '../../../store';

interface OrbisConnectResult {
  user: {
    did: string;
    [key: string]: any;
  };
  [key: string]: any;
}

console.log('Initializing OrbisDB...');
export const db = new OrbisDB({
    ceramic: {
        gateway: CERAMIC_NODE_URL
    },
    nodes: [
        {
            gateway: ORBIS_NODE_URL,
            env: ORBIS_ENVIRONMENT_ID
        }
    ]
});

console.log('OrbisDB initialized:', db);

// Session management
let storageSession: Promise<void> | null = null;

export async function initStorageSession(authResult?: OrbisConnectResult) {
  if (!storageSession) {
    storageSession = (async () => {
      try {
        console.log('Initializing Orbis storage session...');
        
        // Get the current user's DID from the auth result or existing session
        const details = authResult?.user || await db.getConnectedUser();
        console.log('Got user details:', details);
        
        if (!details) {
          throw new Error('No authenticated user found');
        }

        // Get the user's DID from the details object
        const did = 'user' in details ? details.user.did : details.did;
        if (!did) {
          throw new Error('No DID found in auth result');
        }
        console.log('Current user DID:', did);
        
        // Session is now initialized
        console.log('Orbis storage session initialized successfully');
      } catch (error) {
        console.error('Failed to initialize storage session:', error);
        storageSession = null; // Reset so we can try again
        throw error;
      }
    })();
  }
  return storageSession;
}

export async function clearStorageSession() {
  console.log('Clearing Orbis storage session...');
  try {
    await db.disconnectUser();
    storageSession = null;
    console.log('Orbis storage session cleared successfully');
  } catch (error) {
    console.error('Failed to clear storage session:', error);
    throw error;
  }
}

// Helper to check if a session is expired (older than 3 months)
export function isSessionExpired(lastAuthenticated: string): boolean {
  const lastAuth = new Date(lastAuthenticated);
  const now = new Date();
  const threeMonths = 1000 * 60 * 60 * 24 * 90; // 90 days in milliseconds
  return now.getTime() - lastAuth.getTime() > threeMonths;
}

// Type definitions for Orbis models
export interface OrbisProgress {
  difficulty: number;
  deck_id: number;
  flashcard_id: number;
  reps: number;
  lapses: number;
  stability: number;
  last_review: string;
  next_review: string;
  correct_reps: number;
  last_interval: number;
  retrievability: number;
  last_synced: string;
}

// Helper functions to convert between Orbis and app models
export function appToOrbisProgress(progress: StudyProgress): {
  deck_id: number;
  flashcard_id: number;
  reps: number;
  lapses: number;
  stability: number;
  difficulty: number;
  last_review: string;
  next_review: string;
  correct_reps: number;
  last_interval: number;
  retrievability: number;
} {
  // Only include fields that are in the model schema
  const orbisProgress = {
    deck_id: progress.deck_id,
    flashcard_id: progress.flashcard_id,
    reps: progress.reps,
    lapses: progress.lapses,
    stability: progress.stability,
    difficulty: progress.difficulty,
    last_review: progress.last_review,
    next_review: progress.next_review,
    correct_reps: progress.reps - progress.lapses,
    last_interval: progress.last_interval || 0,
    retrievability: progress.retrievability || 0
  };

  console.log('[appToOrbisProgress] Converting progress:', {
    input: progress,
    output: orbisProgress
  });

  return orbisProgress;
}

export function orbisToAppProgress(orbisProgress: OrbisProgressDocument): Omit<StudyProgress, 'last_synced'> & { last_synced: string } {
  return {
    deck_id: orbisProgress.deck_id,
    flashcard_id: orbisProgress.flashcard_id,
    reps: orbisProgress.reps,
    lapses: orbisProgress.lapses,
    stability: orbisProgress.stability,
    difficulty: orbisProgress.difficulty,
    last_review: orbisProgress.last_review,
    next_review: orbisProgress.next_review,
    last_interval: orbisProgress.last_interval,
    retrievability: orbisProgress.retrievability,
    last_synced: orbisProgress.last_synced
  };
}

// Progress management functions
export async function saveProgress(progress: StudyProgress[]): Promise<boolean> {
  const MAX_RETRIES = 3;
  const BATCH_SIZE = 1; // Save one at a time to reduce load
  let lastError: Error | null = null;

  // Ensure we have an active session
  const user = await db.getConnectedUser();
  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Convert app progress to Orbis format
  const orbisProgress = progress.map(p => appToOrbisProgress(p));

  // Try to save with retries
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[saveProgress] Attempt ${attempt + 1}/${MAX_RETRIES} to save progress:`, {
        count: orbisProgress.length,
        firstEntry: orbisProgress[0],
        modelId: PROGRESS_MODEL,
        contextId: CONTEXT_ID
      });
      
      // Wait a bit longer after connection before trying to save
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const results: SaveResults = { success: [], errors: [] };

      // Save one at a time with delay between each
      for (let i = 0; i < orbisProgress.length; i += BATCH_SIZE) {
        const batch = orbisProgress.slice(i, i + BATCH_SIZE);
        
        try {
          // Add delay between saves
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          console.log(`[saveProgress] Saving batch ${i / BATCH_SIZE + 1}:`, {
            batch,
            modelId: PROGRESS_MODEL,
            contextId: CONTEXT_ID
          });

          const result = await db.insertBulk(PROGRESS_MODEL)
            .values(batch)
            .context(CONTEXT_ID)
            .run() as unknown as SaveResult;

          if (result.success?.length) {
            results.success.push(...result.success);
            console.log(`[saveProgress] Successfully saved batch ${i / BATCH_SIZE + 1}`);
          }
          
          if (result.errors?.length) {
            results.errors.push(...result.errors.map(err => ({
              item: err.document as OrbisProgressDocument,
              error: err.error?.message || 'Unknown error'
            })));
            console.error(`[saveProgress] Batch ${i / BATCH_SIZE + 1} had errors:`, result.errors);
          }
        } catch (batchError) {
          console.error(`[saveProgress] Batch ${i / BATCH_SIZE + 1} failed:`, batchError);
          results.errors.push(...batch.map(item => ({ 
            item: item as OrbisProgressDocument, 
            error: batchError instanceof Error ? batchError.message : 'Unknown error' 
          })));
        }
      }

      if (results.errors.length > 0) {
        console.error('[saveProgress] Some entries failed:', results.errors);
        throw new Error(`Failed to save ${results.errors.length} entries. First error: ${results.errors[0].error}`);
      }

      // If we get here, all saves were successful
      console.log('[saveProgress] All entries saved successfully');

      // Update local progress with sync timestamp
      const now = new Date().toISOString();
      const timestamp = Date.now();
      console.log('[saveProgress] Updating timestamps:', {
        isoString: now,
        timestamp,
        deckId: progress[0].deck_id
      });

      const updatedProgress = progress.map(p => ({
        ...p,
        last_synced: now
      } as StudyProgress & { last_synced: string }));

      // Update progress and deck in IDB with sync timestamp
      console.log('[saveProgress] Updating IDB:', {
        progressCount: updatedProgress.length,
        firstProgress: updatedProgress[0],
        deckId: updatedProgress[0].deck_id,
        timestamp
      });

      try {
        // Update IDB
        await Promise.all([
          ...updatedProgress.map(p => updateProgress(p)),
          updateDeckLastSynced(updatedProgress[0].deck_id, timestamp)
        ]);
        console.log('[saveProgress] Successfully updated IDB timestamps');

        // Update store
        const store = useStore.getState();
        store.updateDeckLastSynced(updatedProgress[0].deck_id, timestamp);
      } catch (error) {
        console.error('[saveProgress] Failed to update timestamps:', error);
      }

      return true;
    } catch (error) {
      console.error('[saveProgress] Failed to save progress:', error);
      return false;
    }
  }

  // If we get here, all retries failed
  console.error('[saveProgress] All attempts failed:', lastError);
  throw lastError;
}

export async function getProgress(deckId: number): Promise<(StudyProgress & { last_synced: string })[]> {
  try {
    console.log('[getProgress] Fetching progress for deck:', deckId);
    
    const result = await db.select('*')
      .from(PROGRESS_MODEL)
      .where({ deck_id: deckId })
      .run();

    const progress = result.rows.map(row => orbisToAppProgress(row as OrbisProgressDocument));
    console.log('[getProgress] Fetched progress:', progress);
    return progress;
  } catch (error) {
    console.error('[getProgress] Failed to fetch progress:', error);
    throw error;
  }
} 