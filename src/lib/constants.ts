import { Address } from 'viem';

export const DECK_ACCESS_NFT_ADDRESS = '0xA26277f442eD2E41E70E4a06E3849807D972e4C3' as Address;

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