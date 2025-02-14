import { LitAuthClient } from '@lit-protocol/auth-browser';
import type { LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { decryptToString } from '@lit-protocol/encryption';

// Cache the Lit client instance and its connection promise
let litNodeClient: LitAuthClient | null = null;
let connectionPromise: Promise<LitAuthClient> | null = null;
let lastAuthSig: string | null = null;

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
    litNodeClient = new LitAuthClient(config);
  }

  // Start connection and cache the promise
  connectionPromise = (async () => {
    try {
      await litNodeClient!.connect();
      return litNodeClient!;
    } catch (error) {
      console.error('[getLitNodeClient] Connection failed:', error);
      litNodeClient = null;
      throw error;
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
    // Check if we've already used this auth sig
    const authSigHash = JSON.stringify(config.authSig);
    if (authSigHash === lastAuthSig) {
      console.log('[decryptWithLit] Reusing existing auth sig');
    } else {
      console.log('[decryptWithLit] New auth sig detected');
      lastAuthSig = authSigHash;
    }

    const client = await getLitNodeClient();
    return decryptToString(config, client);
  } catch (error: any) {
    console.error('[decryptWithLit] Failed:', error);
    // Only clear the client for actual connection errors
    if (error.message?.includes('Failed to connect to Lit nodes') || 
        error.message?.includes('Failed to connect to any Lit node')) {
      console.log('[decryptWithLit] Connection error detected, clearing client');
      litNodeClient = null;
      connectionPromise = null;
    }
    throw error;
  }
} 