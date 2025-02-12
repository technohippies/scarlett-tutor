import { Database } from '@tableland/sdk';
import { type Deck } from './idb/schema';
import { getAccount, getWalletClient } from '@wagmi/core';
import { config } from './wagmi';

// Table names - these are unique to your deployment
export const DECKS_TABLE = 'decks_v5_84532_103'; // You'll need to replace this with your actual table name

export class TablelandClient {
  private static instance: TablelandClient;
  private database: Database | null = null;

  private constructor() {}

  public static getInstance(): TablelandClient {
    if (!TablelandClient.instance) {
      TablelandClient.instance = new TablelandClient();
    }
    return TablelandClient.instance;
  }

  async connect(): Promise<void> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      const walletClient = await getWalletClient(config);
      if (!walletClient) {
        throw new Error('No wallet client available');
      }

      // Initialize database with connected account
      this.database = new Database({
        // @ts-ignore - Tableland types don't match Viem's wallet client type
        signer: walletClient
      });

      console.log('[TablelandClient] Connected successfully');
    } catch (error) {
      console.error('[TablelandClient] Failed to connect:', error);
      throw error;
    }
  }

  async getAllDecks(): Promise<Deck[]> {
    try {
      // Initialize database if needed, without requiring wallet connection
      if (!this.database) {
        this.database = new Database();
      }

      console.log('[TablelandClient] Getting all decks');
      
      const { results } = await this.database
        .prepare(`SELECT * FROM ${DECKS_TABLE} ORDER BY id DESC`)
        .all<Deck>();

      return results.map(deck => ({
        ...deck,
        id: Number(deck.id),
        price: Number(deck.price),
      }));
    } catch (error) {
      console.error('[TablelandClient] Failed to get all decks:', error);
      throw error;
    }
  }

  async getDeck(deckId: number): Promise<Deck | null> {
    try {
      // Initialize database if needed, without requiring wallet connection
      if (!this.database) {
        this.database = new Database();
      }

      const { results } = await this.database
        .prepare(`SELECT * FROM ${DECKS_TABLE} WHERE id = ?`)
        .bind(deckId)
        .all<Deck>();

      if (!results.length) return null;

      return {
        ...results[0],
        id: Number(results[0].id),
        price: Number(results[0].price),
      };
    } catch (error) {
      console.error('[TablelandClient] Failed to get deck:', error);
      throw error;
    }
  }
} 