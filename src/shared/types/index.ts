import type { ReactNode } from 'react';
import type { Address } from 'viem';

// Re-export types from services
export * from '../services/idb/schema';

// Deck types
export interface DeckStats {
  new: number;
  due: number;
  review: number;
}

// Shared component props
export interface LayoutProps {
  children: ReactNode;
}

// Contract types
export interface ContractAddresses {
  DECK_ACCESS_NFT: Address;
}

export interface StudyConstants {
  NEW_CARDS_PER_DAY: number;
  MIN_INTERVAL_HOURS: number;
  MAX_INTERVAL_DAYS: number;
  DEFAULT_EASE: number;
}

export interface APIConstants {
  IPFS_GATEWAY: string;
}

export type DeckAccessNFTABI = typeof import('../constants').DECK_ACCESS_NFT_ABI;
export type DeckAccessNFTAddress = typeof import('../constants').DECK_ACCESS_NFT_ADDRESS;

export * from './store'; 