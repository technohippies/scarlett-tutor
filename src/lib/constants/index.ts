import { Address } from 'viem';

export const DECK_ACCESS_NFT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address;

export const DECK_ACCESS_NFT_ABI = [
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'deckId', type: 'uint256' },
    ],
    name: 'hasPurchased',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'deckId', type: 'uint256' }],
    name: 'purchaseDeck',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'deckId', type: 'uint256' }],
    name: 'getDeckPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const; 