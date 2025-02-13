import type { Deck, Flashcard } from '../idb/schema';
import { addFlashcards, getDeckFlashcards, getTodayStudyLog, updateStudyLog } from '../idb';
import { readContract } from '@wagmi/core';
import { DECK_ACCESS_NFT_ABI, DECK_ACCESS_NFT_ADDRESS } from '../../constants';
import { getAddress } from 'viem';
import { config } from '../wagmi';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { SiweMessage } from 'siwe';
import { BrowserProvider } from 'ethers';
import { decryptToString } from '@lit-protocol/encryption';
import { LIT_NETWORKS } from '@lit-protocol/constants';
import type { LIT_NETWORKS_KEYS } from '@lit-protocol/types';

// Log available networks for debugging
console.log('Available Lit Networks:', Object.keys(LIT_NETWORKS));
console.log('Network details:', {
  availableNetworks: Object.keys(LIT_NETWORKS),
  selectedNetwork: 'datil-test',
  networkConfig: LIT_NETWORKS['datil-test']
});

interface FlashcardsResponse {
  flashcards: Omit<Flashcard, 'id'>[];
}

interface EncryptedFlashcardsResponse {
  encrypted_content: string;
  encryption_key: string;
  access_conditions: string;
}

// Cache the Lit client instance
let litNodeClient: LitNodeClient | null = null;

async function getLitNodeClient() {
  if (litNodeClient?.ready) {
    return litNodeClient;
  }

  console.log('[getLitNodeClient] Initializing Lit client...');
  const config = {
    alertWhenUnauthorized: false,
    debug: false,
    litNetwork: 'datil-test' as LIT_NETWORKS_KEYS
  };
  console.log('[getLitNodeClient] Config:', config);
  
  litNodeClient = new LitNodeClient(config);
  await litNodeClient.connect();
  return litNodeClient;
}

export async function fetchAndStoreFlashcards(deck: Deck, address?: string) {
  try {
    console.log('[fetchAndStoreFlashcards] Starting for deck:', {
      deckId: deck.id,
      name: deck.name,
      isPaid: deck.price > 0,
      isEncrypted: !!deck.encryption_key
    });
    
    // First check if we already have the flashcards in IDB
    const existingCards = await getDeckFlashcards(deck.id);
    console.log('[fetchAndStoreFlashcards] Existing cards in IDB:', {
      deckId: deck.id,
      count: existingCards.length
    });

    if (existingCards.length > 0) {
      console.log('[fetchAndStoreFlashcards] Using cached cards');
      return existingCards;
    }

    // For paid decks, verify NFT ownership
    if (deck.price > 0) {
      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet to access this deck.');
      }

      console.log('[fetchAndStoreFlashcards] Verifying NFT ownership:', {
        address,
        deckId: deck.id
      });

      const hasAccess = await readContract(config, {
        address: DECK_ACCESS_NFT_ADDRESS,
        abi: DECK_ACCESS_NFT_ABI,
        functionName: 'hasPurchased',
        args: [getAddress(address), BigInt(deck.id)],
      });

      if (!hasAccess) {
        throw new Error('You need to purchase this deck to access its content.');
      }
      console.log('[fetchAndStoreFlashcards] NFT ownership verified');
    }

    // Fetch flashcards from IPFS
    console.log('[fetchAndStoreFlashcards] Fetching from IPFS:', deck.flashcards_cid);
    const response = await fetch(`https://public.w3ipfs.storage/ipfs/${deck.flashcards_cid}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch flashcards from IPFS: ${response.statusText}`);
    }

    let flashcards: Omit<Flashcard, 'id'>[];

    if (deck.encryption_key) {
      console.log('[fetchAndStoreFlashcards] Attempting to decrypt cards');
      
      const data: EncryptedFlashcardsResponse = await response.json();
      console.log('[fetchAndStoreFlashcards] Raw encrypted data:', {
        hasEncryptedContent: !!data.encrypted_content,
        contentLength: data.encrypted_content?.length,
        hasAccessConditions: !!data.access_conditions,
        encryptionKey: deck.encryption_key
      });

      // Parse and validate access conditions
      let accessControlConditions;
      try {
        // First try to parse if it's a string
        if (typeof data.access_conditions === 'string') {
          accessControlConditions = JSON.parse(data.access_conditions);
        } else {
          accessControlConditions = data.access_conditions;
        }

        // Ensure we have the correct structure
        if (!Array.isArray(accessControlConditions) || !accessControlConditions[0]?.accessControlConditions) {
          console.error('[fetchAndStoreFlashcards] Invalid access conditions structure:', accessControlConditions);
          throw new Error('Invalid access conditions structure');
        }

        // Update the parameters array to use the current deck ID
        if (accessControlConditions[0].accessControlConditions[0]) {
          const condition = accessControlConditions[0].accessControlConditions[0];
          condition.parameters = [deck.id.toString()];
          condition.chain = 'baseSepolia';
          condition.returnValueTest = {
            comparator: "=",
            value: ":userAddress"
          };
        }

        console.log('[fetchAndStoreFlashcards] Access conditions:', {
          parsed: accessControlConditions,
          firstCondition: accessControlConditions[0],
          firstConditionDetails: {
            chain: accessControlConditions[0]?.accessControlConditions[0]?.chain,
            contractAddress: accessControlConditions[0]?.accessControlConditions[0]?.contractAddress,
            standardContractType: accessControlConditions[0]?.accessControlConditions[0]?.standardContractType,
            method: accessControlConditions[0]?.accessControlConditions[0]?.method,
            parameters: accessControlConditions[0]?.accessControlConditions[0]?.parameters,
            returnValueTest: accessControlConditions[0]?.accessControlConditions[0]?.returnValueTest,
            fullCondition: JSON.stringify(accessControlConditions[0]?.accessControlConditions[0], null, 2)
          }
        });
      } catch (e) {
        console.error('[fetchAndStoreFlashcards] Failed to process access conditions:', e);
        throw new Error('Invalid access conditions format');
      }

      // Get or initialize Lit client
      const litNodeClient = await getLitNodeClient();

      // Generate SIWE message for authentication
      const domain = window.location.hostname;
      const origin = window.location.origin;
      const statement = 'Sign this message to decrypt the flashcards.';
      const nonce = Date.now().toString();
      const uri = `${origin}/study/${deck.id}`;

      const siweMessage = new SiweMessage({
        domain,
        address: address!,
        statement,
        uri,
        version: '1',
        chainId: 84532,
        nonce,
        expirationTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        issuedAt: new Date().toISOString(),
        resources: [`ipfs://${deck.flashcards_cid}`]
      });

      const messageToSign = siweMessage.prepareMessage();
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(messageToSign);

      const authSig = {
        sig: signature,
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: messageToSign,
        address: address!.toLowerCase(),
        algo: 'eth-personal-sign'
      };

      try {
        // Create decryption config matching the encryption format
        const decryptConfig = {
          accessControlConditions: accessControlConditions[0].accessControlConditions,
          ciphertext: data.encrypted_content,
          dataToEncryptHash: deck.encryption_key,
          chain: 'baseSepolia',
          authSig
        };

        // Log the configuration before attempting decryption
        console.log('[fetchAndStoreFlashcards] Attempting decryption with:', {
          accessControlConditions: {
            count: accessControlConditions[0].accessControlConditions.length,
            first: accessControlConditions[0].accessControlConditions[0],
            chain: accessControlConditions[0].accessControlConditions[0].chain,
            contractAddress: accessControlConditions[0].accessControlConditions[0].contractAddress,
            method: accessControlConditions[0].accessControlConditions[0].method,
            parameters: accessControlConditions[0].accessControlConditions[0].parameters,
            returnValueTest: accessControlConditions[0].accessControlConditions[0].returnValueTest
          },
          ciphertext: {
            length: data.encrypted_content.length,
            type: typeof data.encrypted_content,
            preview: data.encrypted_content.substring(0, 50) + '...'
          },
          encryptionKey: {
            length: deck.encryption_key.length,
            type: typeof deck.encryption_key,
            value: deck.encryption_key
          },
          chain: 'baseSepolia',
          authSig: {
            address: authSig.address,
            signedMessage: authSig.signedMessage,
            sigLength: authSig.sig.length
          },
          litClient: {
            ready: litNodeClient.ready,
            network: 'datil-test'
          }
        });

        const decryptedString = await decryptToString(
          decryptConfig,
          litNodeClient
        );

        if (!decryptedString) {
          console.error('[fetchAndStoreFlashcards] Decryption returned null/empty');
          throw new Error('Decryption returned null or empty string');
        }

        console.log('[fetchAndStoreFlashcards] Raw decrypted content:', {
          type: typeof decryptedString,
          length: decryptedString.length,
          preview: decryptedString.substring(0, 100),
          isString: typeof decryptedString === 'string',
          isObject: typeof decryptedString === 'object',
          constructor: decryptedString?.constructor?.name
        });

        let decryptedData: FlashcardsResponse;
        try {
          decryptedData = JSON.parse(decryptedString);
          console.log('[fetchAndStoreFlashcards] Successfully parsed decrypted JSON:', {
            hasFlashcards: !!decryptedData.flashcards,
            flashcardsCount: decryptedData.flashcards?.length
          });
        } catch (parseError) {
          console.error('[fetchAndStoreFlashcards] Failed to parse decrypted content:', {
            error: parseError,
            contentPreview: decryptedString.substring(0, 100),
            contentLength: decryptedString.length
          });
          throw new Error('Failed to parse decrypted content');
        }

        flashcards = decryptedData.flashcards;
      } catch (decryptError: any) {
        console.error('[fetchAndStoreFlashcards] Detailed decryption error:', {
          error: decryptError,
          message: decryptError.message,
          stack: decryptError.stack,
          name: decryptError.name,
          code: decryptError.code,
          config: {
            accessControlConditions: accessControlConditions[0].accessControlConditions,
            chain: 'baseSepolia',
            authSig: {
              address: authSig.address,
              signedMessage: authSig.signedMessage
            }
          }
        });
        throw new Error(`Failed to decrypt: ${decryptError.message || decryptError}`);
      }

      // Store flashcards in IDB
      console.log('[fetchAndStoreFlashcards] Storing cards in IDB:', {
        deckId: deck.id,
        count: flashcards.length
      });
      
      await addFlashcards(deck.id, flashcards);
      
      // Verify storage
      const storedCards = await getDeckFlashcards(deck.id);
      console.log('[fetchAndStoreFlashcards] Verified stored cards:', {
        deckId: deck.id,
        count: storedCards.length,
        expected: flashcards.length
      });

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
        console.log('[fetchAndStoreFlashcards] Initialized study log');
      }

      // Return the stored flashcards
      return getDeckFlashcards(deck.id);
    } else {
      console.log('[fetchAndStoreFlashcards] Processing unencrypted cards');
      const data: FlashcardsResponse = await response.json();
      flashcards = data.flashcards;
    }

    // Store flashcards in IDB
    console.log('[fetchAndStoreFlashcards] Storing cards in IDB:', {
      deckId: deck.id,
      count: flashcards.length
    });
    
    await addFlashcards(deck.id, flashcards);
    
    // Verify storage
    const storedCards = await getDeckFlashcards(deck.id);
    console.log('[fetchAndStoreFlashcards] Verified stored cards:', {
      deckId: deck.id,
      count: storedCards.length,
      expected: flashcards.length
    });

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
      console.log('[fetchAndStoreFlashcards] Initialized study log');
    }

    // Return the stored flashcards
    return getDeckFlashcards(deck.id);
  } catch (error) {
    console.error('[fetchAndStoreFlashcards] Failed:', error);
    throw error;
  }
}