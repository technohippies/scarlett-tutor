import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelectedDeck, useDecksStatus, useDecksActions, useWalletStatus, useWalletAddress, useAuthActions } from '../store';
import { Card } from '../components/ui/card';
import { StatsBadge } from '../components/ui/stats-badge';
import { Loader } from '../components/ui/loader';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { DECK_ACCESS_NFT_ABI, DECK_ACCESS_NFT_ADDRESS } from '../lib/constants';
import { parseEther, getAddress } from 'viem';
import { config } from '../lib/wagmi';

export function DeckPage() {
  const { deckId } = useParams();
  const selectedDeck = useSelectedDeck();
  const { isLoading, error } = useDecksStatus();
  const { selectDeck } = useDecksActions();
  const isWalletConnected = useWalletStatus();
  const address = useWalletAddress();
  const { connectWallet, checkWalletConnection } = useAuthActions();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasNFT, setHasNFT] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);

  // Check wallet connection on mount
  useEffect(() => {
    console.log('DeckPage mounted, checking wallet connection...');
    void checkWalletConnection();
  }, [checkWalletConnection]);

  // Check if user owns the NFT
  useEffect(() => {
    if (isWalletConnected && address && deckId) {
      setContractError(null);
      console.log('Checking NFT ownership for:', {
        address,
        deckId,
        contractAddress: DECK_ACCESS_NFT_ADDRESS,
        isWalletConnected
      });
      readContract(config, {
        address: DECK_ACCESS_NFT_ADDRESS,
        abi: DECK_ACCESS_NFT_ABI,
        functionName: 'hasPurchased',
        args: [getAddress(address), BigInt(deckId)],
      }).then(result => {
        console.log('NFT ownership check result:', result);
        setHasNFT(!!result);
      }).catch(err => {
        console.error('Failed to check NFT ownership:', err);
        setContractError('Failed to check NFT ownership. Please make sure you are connected to Base Sepolia network.');
      });
    }
  }, [isWalletConnected, address, deckId]);

  const handlePurchase = async () => {
    if (deckId && isWalletConnected && address) {
      try {
        setIsPurchasing(true);
        setContractError(null);
        console.log('Initiating purchase for:', {
          address,
          deckId,
          price: selectedDeck?.price,
          contractAddress: DECK_ACCESS_NFT_ADDRESS
        });
        const hash = await writeContract(config, {
          address: DECK_ACCESS_NFT_ADDRESS,
          abi: DECK_ACCESS_NFT_ABI,
          functionName: 'purchaseDeck',
          args: [BigInt(deckId)],
          value: selectedDeck?.price ? parseEther(selectedDeck.price.toString()) : 0n,
        });
        console.log('Purchase transaction submitted:', hash);
        setIsConfirming(true);
        const receipt = await waitForTransactionReceipt(config, { hash });
        console.log('Purchase transaction confirmed:', receipt);
        setIsConfirming(false);
        setHasNFT(true);
      } catch (err) {
        console.error('Failed to purchase deck:', err);
        setContractError('Failed to purchase deck. Please make sure you are connected to Base Sepolia network and have enough ETH.');
      } finally {
        setIsPurchasing(false);
      }
    }
  };

  useEffect(() => {
    if (deckId) {
      void selectDeck(Number(deckId));
    }
  }, [deckId, selectDeck]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!selectedDeck) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Deck not found</p>
      </div>
    );
  }

  const isPaid = selectedDeck.price > 0;
  const canStudy = !isPaid || hasNFT;
  const isTransacting = isPurchasing || isConfirming;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link 
          to="/"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
        >
          ←
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{selectedDeck.name}</h1>
      </div>

      {contractError && (
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-sm text-destructive">{contractError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <Card.Header>
              <Card.Title>Description</Card.Title>
              <Card.Description>{selectedDeck.description}</Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selectedDeck.category}</span>
                <span>•</span>
                <span>{selectedDeck.language}</span>
                {isPaid && (
                  <>
                    <span>•</span>
                    <span>{selectedDeck.price} ETH</span>
                  </>
                )}
              </div>
            </Card.Content>
            {selectedDeck.stats && (
              <Card.Footer className="gap-2">
                <StatsBadge label="New" value={selectedDeck.stats.new} />
                <StatsBadge label="Due" value={selectedDeck.stats.due} />
                <StatsBadge label="Review" value={selectedDeck.stats.review} />
              </Card.Footer>
            )}
          </Card>

          {/* TODO: Add flashcards list */}
        </div>

        <div className="space-y-4">
          {isPaid && !isWalletConnected && (
            <button
              onClick={connectWallet}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Connect Wallet to Purchase
            </button>
          )}

          {isPaid && isWalletConnected && !hasNFT && (
            <button
              onClick={handlePurchase}
              disabled={isTransacting}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed h-9 px-4 py-2"
            >
              {isTransacting ? (
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4" />
                  <span>{isConfirming ? 'Confirming...' : 'Purchasing...'}</span>
                </div>
              ) : (
                `Purchase for ${selectedDeck.price} ETH`
              )}
            </button>
          )}

          {canStudy && (
            <Link
              to={`/study/${selectedDeck.id}`}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Start Studying
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 