import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useSelectedDeck, useDecksStatus, useDecksActions } from '../store/hooks';
import { useWalletStatus, useWalletAddress, useAuthActions } from '../../auth/store/hooks';
import { useStudyData } from '../../study/store/hooks';
import { Loader } from '../../../shared/components/loader';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { DECK_ACCESS_NFT_ABI, DECK_ACCESS_NFT_ADDRESS } from '../../../shared/constants';
import { parseEther, getAddress } from 'viem';
import { config } from '../../../shared/services/wagmi';
import { PageHeader } from '../../../shared/components/page-header';
import { PageLayout } from '../../../features/ui/components/page-layout';

function formatLastSynced(timestamp: number | undefined): string {
  console.log('[formatLastSynced] Formatting timestamp:', timestamp);
  if (!timestamp) return 'Never';

  const now = new Date();
  const lastSynced = new Date(timestamp);
  const diffInDays = Math.floor((now.getTime() - lastSynced.getTime()) / (1000 * 60 * 60 * 24));

  console.log('[formatLastSynced] Time difference:', {
    now: now.toISOString(),
    lastSynced: lastSynced.toISOString(),
    diffInDays
  });

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else {
    return `${diffInDays} days ago`;
  }
}

function LastSynced({ timestamp }: { timestamp: number | undefined }) {
  const { hasStudiedToday } = useDecksStatus();
  console.log('[LastSynced] Rendering with:', { timestamp, hasStudiedToday });
  
  // If studied today, show "Today" regardless of timestamp
  const text = hasStudiedToday ? 'Today' : formatLastSynced(timestamp);
  
  return (
    <div className="text-sm text-muted-foreground">
      Last Saved: {text}
    </div>
  );
}

export function DeckPage() {
  const { deckId } = useParams();
  const location = useLocation();
  const selectedDeck = useSelectedDeck();
  const { isLoading, error } = useDecksStatus();
  const { selectDeck } = useDecksActions();
  const { cards } = useStudyData();
  const isWalletConnected = useWalletStatus();
  const address = useWalletAddress();
  const { connectWallet, checkWalletConnection } = useAuthActions();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasNFT, setHasNFT] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const { hasStudiedToday } = useDecksStatus();

  // Add effect to refresh stats when component is focused or mounted
  useEffect(() => {
    console.log('[DeckPage] Refreshing deck stats:', {
      deckId,
      currentStats: selectedDeck?.stats,
      pathname: location.pathname,
      timestamp: new Date().toISOString()
    });

    if (deckId) {
      void selectDeck(Number(deckId));
    }
  }, [deckId, selectDeck, location.key]); // location.key changes on navigation

  // Add effect to refresh stats when window is focused
  useEffect(() => {
    const handleFocus = () => {
      if (deckId) {
        console.log('[DeckPage] Window focused, refreshing deck stats:', {
          deckId,
          currentStats: selectedDeck?.stats,
          timestamp: new Date().toISOString()
        });
        void selectDeck(Number(deckId));
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [deckId, selectDeck, selectedDeck?.stats]);

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

  // Add effect to refresh stats when cards are loaded into IDB
  useEffect(() => {
    if (deckId && cards.length > 0) {
      console.log('[DeckPage] Cards loaded into IDB, refreshing stats:', {
        deckId,
        cardsCount: cards.length,
        timestamp: new Date().toISOString()
      });
      void selectDeck(Number(deckId));
    }
  }, [deckId, selectDeck, cards.length]);

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

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-destructive">{error}</p>
        </div>
      </PageLayout>
    );
  }

  if (!selectedDeck) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Deck not found</p>
        </div>
      </PageLayout>
    );
  }

  const isPaid = selectedDeck.price > 0;
  const canStudy = !isPaid || hasNFT;
  const isTransacting = isPurchasing || isConfirming;
  const studyButtonText = hasStudiedToday ? 'Study Again' : 'Study';

  // Helper to check if stats exist and are non-zero
  const hasStats = selectedDeck.stats && (
    selectedDeck.stats.new > 0 ||
    selectedDeck.stats.review > 0 ||
    selectedDeck.stats.due > 0
  );

  console.log('[DeckPage] Rendering with stats:', {
    hasStats,
    stats: selectedDeck.stats,
    timestamp: new Date().toISOString()
  });

  return (
    <PageLayout fullWidth>
      <div className="space-y-8 pb-24">
        <PageHeader 
          backTo="/" 
          title={selectedDeck.name}
          rightContent={<LastSynced timestamp={selectedDeck.last_synced} />}
        />

        {contractError && (
          <div className="rounded-md bg-destructive/15 p-4">
            <p className="text-sm text-destructive">{contractError}</p>
          </div>
        )}

        <div className="space-y-8">
          <p className="text-lg text-muted-foreground">{selectedDeck.description}</p>

          {hasStats && (
            <div className="grid grid-cols-3 gap-8">
              <div className="p-4 bg-neutral-800/50 rounded-lg">
                <p className="text-sm text-neutral-500">New</p>
                <p className="text-3xl font-bold mt-2">{selectedDeck.stats?.new || 0}</p>
              </div>
              <div className="p-4 bg-neutral-800/50 rounded-lg">
                <p className="text-sm text-neutral-500">Review</p>
                <p className="text-3xl font-bold mt-2">{selectedDeck.stats?.review || 0}</p>
              </div>
              <div className="p-4 bg-neutral-800/50 rounded-lg">
                <p className="text-sm text-neutral-500">Due</p>
                <p className="text-3xl font-bold mt-2">{selectedDeck.stats?.due || 0}</p>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60 border-t border-neutral-800">
          <div className="container flex justify-center">
            {isPaid && !isWalletConnected && (
              <button
                onClick={connectWallet}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12"
              >
                Connect Wallet to Purchase
              </button>
            )}

            {isPaid && isWalletConnected && !hasNFT && (
              <button
                onClick={handlePurchase}
                disabled={isTransacting}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-12"
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
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12"
              >
                {studyButtonText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 