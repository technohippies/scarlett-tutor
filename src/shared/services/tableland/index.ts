import { type Deck } from '../idb/schema';
import { addDebugLog } from '../../components/debug-info';

// Table names - these are unique to your deployment
export const DECKS_TABLE = 'decks_v5_84532_103';

// Convert TableLand price (in whole numbers) to Wei
// e.g., 7 in TableLand = 0.0007 ETH = 700000000000000 Wei
function convertTableLandPriceToWei(price: number): bigint {
  // Convert price to ETH (divide by 10000 to get ETH value)
  // e.g., 7 / 10000 = 0.0007 ETH
  const ethPrice = price / 10000;
  // Convert to Wei (multiply by 10^18)
  return BigInt(Math.floor(ethPrice * 1e18));
}

export class TablelandClient {
  private static instance: TablelandClient;
  private readonly gateway = 'https://testnets.tableland.network/api/v1';

  private constructor() {
    addDebugLog('Initializing read-only TablelandClient...', 'info');
  }

  public static getInstance(): TablelandClient {
    if (!TablelandClient.instance) {
      TablelandClient.instance = new TablelandClient();
    }
    return TablelandClient.instance;
  }

  async getAllDecks(): Promise<Deck[]> {
    try {
      const query = `SELECT * FROM ${DECKS_TABLE} ORDER BY id DESC`;
      addDebugLog('Fetching all decks...', 'info');
      
      const response = await fetch(
        `${this.gateway}/query?statement=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error(`Query failed: ${await response.text()}`);
      }
      
      const results = await response.json() as Deck[];
      addDebugLog(`Successfully fetched ${results.length} decks`, 'success');

      return results.map(deck => ({
        ...deck,
        id: Number(deck.id),
        // Convert price to Wei for blockchain transactions
        price: Number(deck.price),
        // Convert BigInt to string for JSON serialization
        priceInWei: convertTableLandPriceToWei(Number(deck.price)).toString()
      }));
    } catch (err) {
      const error = err as Error;
      addDebugLog(`Failed to fetch decks: ${error.message}`, 'error');
      throw error;
    }
  }

  async getDeck(deckId: number): Promise<Deck | null> {
    try {
      const query = `SELECT * FROM ${DECKS_TABLE} WHERE id = ${deckId}`;
      addDebugLog(`Fetching deck ${deckId}...`, 'info');
      
      const response = await fetch(
        `${this.gateway}/query?statement=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error(`Query failed: ${await response.text()}`);
      }
      
      const results = await response.json() as Deck[];
      
      if (!results.length) {
        addDebugLog(`No deck found with id ${deckId}`, 'warning');
        return null;
      }

      addDebugLog(`Successfully fetched deck ${deckId}`, 'success');
      return {
        ...results[0],
        id: Number(results[0].id),
        // Convert price to Wei for blockchain transactions
        price: Number(results[0].price),
        // Convert BigInt to string for JSON serialization
        priceInWei: convertTableLandPriceToWei(Number(results[0].price)).toString()
      };
    } catch (err) {
      const error = err as Error;
      addDebugLog(`Failed to fetch deck ${deckId}: ${error.message}`, 'error');
      throw error;
    }
  }
} 