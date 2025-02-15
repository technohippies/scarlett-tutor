import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useSelectedDeck, useDecksStatus, useDecksActions } from '../store/hooks';
import { useWalletStatus, useWalletAddress, useAuthActions } from '../../auth/store/hooks';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { DECK_ACCESS_NFT_ABI, DECK_ACCESS_NFT_ADDRESS } from '../../../shared/constants';
import { parseEther, getAddress } from 'viem';
import { config } from '../../../shared/services/wagmi';
import { PageHeader } from '../../../shared/components/page-header';
import { PageLayout } from '../../../features/ui/components/page-layout';
import { RingLoader } from '../../../shared/components/ring-loader';

function formatLastSynced(timestamp: number | undefined): string {
  if (!timestamp) return 'Never';

  const now = new Date();
  const lastSynced = new Date(timestamp);
  
  // Check if the timestamp is from today
  const isToday = lastSynced.toDateString() === now.toDateString();
  if (isToday) {
    return 'Today';
  }
  
  const diffInDays = Math.floor((now.getTime() - lastSynced.getTime()) / (1000 * 60 * 60 * 24));
  if (diffInDays === 1) {
    return 'Yesterday';
  } else {
    return `${diffInDays} days ago`;
  }
}

function LastSynced({ timestamp }: { timestamp: number | undefined }) {
  // Memoize the text to prevent unnecessary re-renders
  const text = useMemo(() => {
    return formatLastSynced(timestamp);
  }, [timestamp]);
  
  return (
    <div className="text-sm text-muted-foreground text-neutral-500">
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
  const isWalletConnected = useWalletStatus();
  const address = useWalletAddress();
  const { connectWallet, checkWalletConnection } = useAuthActions();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasNFT, setHasNFT] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const { hasStudiedToday } = useDecksStatus();

  // Memoize the refresh function to prevent unnecessary re-renders
  const refreshDeck = useCallback(async () => {
    if (!deckId) return;
    
    const numericDeckId = Number(deckId);
    await selectDeck(numericDeckId);
  }, [deckId, selectDeck]);

  // Effect to refresh deck data on mount and after study
  useEffect(() => {
    let isActive = true;

    async function handleRefresh() {
      if (!isActive) return;
      await refreshDeck();
    }

    // Initial load
    void handleRefresh();

    // Handle window focus
    const handleFocus = () => {
      void handleRefresh();
    };

    // Handle navigation back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void handleRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isActive = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDeck, location.key]); // Re-run on navigation

  // Check wallet connection on mount
  useEffect(() => {
    void checkWalletConnection();
  }, [checkWalletConnection]);

  // Check NFT ownership
  useEffect(() => {
    if (!isWalletConnected || !address || !deckId) return;

    let isActive = true;
    setContractError(null);

    readContract(config, {
      address: DECK_ACCESS_NFT_ADDRESS,
      abi: DECK_ACCESS_NFT_ABI,
      functionName: 'hasPurchased',
      args: [getAddress(address), BigInt(deckId)],
    }).then(result => {
      if (isActive) {
        setHasNFT(!!result);
      }
    }).catch(err => {
      if (isActive) {
        console.error('Failed to check NFT ownership:', err);
        setContractError('Failed to check NFT ownership. Please make sure you are connected to Base Sepolia network.');
      }
    });

    return () => {
      isActive = false;
    };
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

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <RingLoader />
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
    <PageLayout>
      <div className="space-y-1 pb-24">
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
            <div className="grid grid-cols-3 gap-2">
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

        <div className="fixed bottom-0 left-0 right-0 p-4">
          <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {isPaid && !isWalletConnected && (
              <button
                onClick={connectWallet}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12"
              >
                Connect Wallet
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
                    <RingLoader size="sm" />
                    <span>{isConfirming ? 'Confirming...' : 'Purchasing...'}</span>
                  </div>
                ) : (
                  `Purchase for .000${selectedDeck.price} ETH`
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