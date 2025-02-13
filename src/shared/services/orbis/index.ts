import { OrbisDB } from "@useorbis/db-sdk";
import type { StudyProgress } from "../idb/schema";
import { updateProgress } from "../idb";

interface OrbisConnectResult {
  user: {
    did: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Load environment variables
const CERAMIC_NODE_URL = import.meta.env.VITE_CERAMIC_NODE_URL || 'https://ceramic-orbisdb-mainnet-direct.hirenodes.io/';
const ORBIS_NODE_URL = import.meta.env.VITE_ORBIS_NODE_URL || 'https://studio.useorbis.com/';
const ORBIS_ENVIRONMENT_ID = import.meta.env.VITE_ORBIS_ENVIRONMENT_ID || 'did:pkh:eip155:1:0x25b4048c3b3c58973571db2dbbf87103f7406966';
const ORBIS_CONTEXT_ID = import.meta.env.VITE_ORBIS_CONTEXT_ID || 'kjzl6kcym7w8y6v8xczuys0vm27mcatj3acgc1zjk0stqp9ac457uwzm2lbrzwm';
const ORBIS_PROGRESS_MODEL_ID = import.meta.env.VITE_ORBIS_USER_PROGRESS || 'kjzl6hvfrbw6c9nl7ovnm2984hwhe0bp1whiiqghwuhv71goef895vaflw5reb3';

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

// Export constants for use in other files
export const CONTEXT_ID = ORBIS_CONTEXT_ID;
export const PROGRESS_MODEL = ORBIS_PROGRESS_MODEL_ID;

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
  stream_id: string;
  controller: string;
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
  _metadata_context: string;
  indexed_at: string;
}

// Helper functions to convert between Orbis and app models
export function appToOrbisProgress(progress: StudyProgress): Omit<OrbisProgress, 'stream_id' | 'controller' | '_metadata_context' | 'indexed_at'> {
  return {
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
    retrievability: progress.retrievability || 0,
  };
}

export function orbisToAppProgress(orbisProgress: OrbisProgress): StudyProgress {
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
  };
}

// Progress management functions
export async function saveProgress(progress: StudyProgress[]) {
  try {
    console.log('[saveProgress] Saving progress to Orbis:', progress);
    
    // Ensure we have an active session
    const user = await db.getConnectedUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Convert app progress to Orbis format and add sync timestamp
    const now = new Date().toISOString();
    const orbisProgress = progress.map(p => ({
      ...appToOrbisProgress(p),
      last_synced: now
    }));

    // Save each progress entry using bulk insert
    const { success, errors } = await db.insertBulk(PROGRESS_MODEL)
      .values(orbisProgress)
      .context(CONTEXT_ID)
      .run();

    if (errors.length > 0) {
      console.error('[saveProgress] Some entries failed:', errors);
    }

    // Update local progress with sync timestamp
    const updatedProgress = progress.map(p => ({
      ...p,
      last_synced: now
    }));

    // Update progress in IDB with sync timestamp
    for (const p of updatedProgress) {
      await updateProgress(p);
    }

    console.log('[saveProgress] Saved successfully:', success);
    return success;
  } catch (error) {
    console.error('[saveProgress] Failed to save progress:', error);
    throw error;
  }
}

export async function getProgress(deckId: number): Promise<StudyProgress[]> {
  try {
    console.log('[getProgress] Fetching progress for deck:', deckId);
    
    const result = await db.select('*')
      .from(PROGRESS_MODEL)
      .where({ deck_id: deckId })
      .run();

    const progress = result.rows.map(row => orbisToAppProgress(row as OrbisProgress));
    console.log('[getProgress] Fetched progress:', progress);
    return progress;
  } catch (error) {
    console.error('[getProgress] Failed to fetch progress:', error);
    throw error;
  }
} 