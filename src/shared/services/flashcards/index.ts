import type { Deck, Flashcard } from '../idb/schema';
import { addFlashcards, getDeckFlashcards, getTodayStudyLog, updateStudyLog } from '../idb';
import { readContract } from '@wagmi/core';
import { DECK_ACCESS_NFT_ABI, DECK_ACCESS_NFT_ADDRESS } from '../../constants';
import { getAddress } from 'viem';
import { config } from '../wagmi';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';

interface FlashcardsResponse {
  flashcards: Omit<Flashcard, 'id'>[];
}

interface EncryptedFlashcardsResponse {
  encrypted_content: string;
  encryption_key: string;
  access_conditions: string;
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
      const accessControlConditions = JSON.parse(data.access_conditions);

      // Initialize Lit client
      const litNodeClient = new LitNodeClient({
        litNetwork: 'datil-test',
        debug: false
      });
      await litNodeClient.connect();

      // Generate SIWE message for authentication
      const domain = window.location.hostname;
      const origin = window.location.origin;
      const statement = 'Sign this message to decrypt the flashcards.';
      const nonce = Date.now().toString();

      const siweMessage = new SiweMessage({
        domain,
        address: address!,
        statement,
        uri: origin,
        version: '1',
        chainId: 84532, // Base Sepolia
        nonce,
      });

      const messageToSign = siweMessage.prepareMessage();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(messageToSign);

      const authSig = {
        sig: signature,
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: messageToSign,
        address: address!,
      };

      // Get encryption key
      const symmetricKey = await litNodeClient.getEncryptionKey({
        accessControlConditions: accessControlConditions[0].accessControlConditions,
        toDecrypt: deck.encryption_key,
        chain: 'baseSepolia',
        authSig,
      });

      // Decrypt the content
      const decryptedContent = await litNodeClient.decrypt(
        data.encrypted_content,
        symmetricKey
      );

      const decryptedData: FlashcardsResponse = JSON.parse(new TextDecoder().decode(decryptedContent));
      flashcards = decryptedData.flashcards;
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