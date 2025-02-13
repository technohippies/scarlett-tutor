// Load environment variables
export const CERAMIC_NODE_URL = import.meta.env.VITE_CERAMIC_NODE_URL || 'https://ceramic-orbisdb-mainnet-direct.hirenodes.io/';
export const ORBIS_NODE_URL = import.meta.env.VITE_ORBIS_NODE_URL || 'https://studio.useorbis.com/';
export const ORBIS_ENVIRONMENT_ID = import.meta.env.VITE_ORBIS_ENVIRONMENT_ID || 'did:pkh:eip155:1:0x25b4048c3b3c58973571db2dbbf87103f7406966';
export const CONTEXT_ID = import.meta.env.VITE_ORBIS_CONTEXT_ID || 'kjzl6kcym7w8y6v8xczuys0vm27mcatj3acgc1zjk0stqp9ac457uwzm2lbrzwm';
export const PROGRESS_MODEL = import.meta.env.VITE_ORBIS_USER_PROGRESS || 'kjzl6hvfrbw6c9nl7ovnm2984hwhe0bp1whiiqghwuhv71goef895vaflw5reb3';

export interface OrbisDocument {
  stream_id: string;
  controller: string;
  _metadata_context: string;
  indexed_at: string;
}

export interface OrbisProgressDocument extends OrbisDocument {
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
  last_synced: string;
}

export interface SaveResult {
  success: OrbisProgressDocument[];
  errors: Array<{
    document: OrbisProgressDocument;
    error?: { message: string };
  }>;
}

export interface SaveResults {
  success: OrbisProgressDocument[];
  errors: Array<{
    item: OrbisProgressDocument;
    error: string;
  }>;
} 