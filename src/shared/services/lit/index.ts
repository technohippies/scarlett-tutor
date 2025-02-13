import { LitNodeClient } from '@lit-protocol/lit-node-client';
import type { LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { decryptToString } from '@lit-protocol/encryption';

// Cache the Lit client instance and its connection promise
let litNodeClient: LitNodeClient | null = null;
let connectionPromise: Promise<LitNodeClient> | null = null;

export async function getLitNodeClient() {
  // If we have a connected client, return it
  if (litNodeClient?.ready) {
    return litNodeClient;
  }

  // If we're already connecting, wait for that to finish
  if (connectionPromise) {
    return connectionPromise;
  }

  console.log('[getLitNodeClient] Initializing Lit client...');
  const config = {
    alertWhenUnauthorized: false,
    debug: false,
    litNetwork: 'datil-test' as LIT_NETWORKS_KEYS
  };
  console.log('[getLitNodeClient] Config:', config);
  
  // Create new client if we don't have one
  if (!litNodeClient) {
    litNodeClient = new LitNodeClient(config);
  }

  // Start connection and cache the promise
  connectionPromise = (async () => {
    try {
      await litNodeClient!.connect();
      return litNodeClient!;
    } finally {
      // Clear the promise so we can try again if it failed
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

export async function decryptWithLit(config: {
  accessControlConditions: any[];
  ciphertext: string;
  dataToEncryptHash: string;
  chain: string;
  authSig: {
    sig: string;
    derivedVia: string;
    signedMessage: string;
    address: string;
    algo?: string;
  };
}) {
  try {
    const client = await getLitNodeClient();
    return decryptToString(config, client);
  } catch (error: any) {
    console.error('[decryptWithLit] Failed:', error);
    // Clear the client if we had a connection error
    if (error.message?.includes('not ready') || error.message?.includes('connect')) {
      litNodeClient = null;
      connectionPromise = null;
    }
    throw error;
  }
} 