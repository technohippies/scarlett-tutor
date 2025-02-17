import { Address } from 'viem';

// Contract Addresses
export const CONTRACT_ADDRESSES = {
  // Base Sepolia testnet addresses
  testnet: {
    DECK_ACCESS_NFT: '0xA26277f442eD2E41E70E4a06E3849807D972e4C3' as Address,
  },
} as const;

// Use testnet addresses by default
export const DECK_ACCESS_NFT_ADDRESS = CONTRACT_ADDRESSES.testnet.DECK_ACCESS_NFT;

// Contract ABIs
export const DECK_ACCESS_NFT_ABI = [
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'deckId', type: 'uint256' }
    ],
    name: 'hasPurchased',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'deckId', type: 'uint256' }],
    name: 'purchaseDeck',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'deckId', type: 'uint256' }],
    name: 'getDeckPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Study Session Constants
export const STUDY_CONSTANTS = {
  NEW_CARDS_PER_DAY: 20,
  MIN_INTERVAL_HOURS: 4,
  MAX_INTERVAL_DAYS: 365,
  DEFAULT_EASE: 2.5,
} as const;

// API Constants
export const API_CONSTANTS = {
  IPFS_GATEWAY: 'https://premium.w3ipfs.storage/ipfs',
} as const; 