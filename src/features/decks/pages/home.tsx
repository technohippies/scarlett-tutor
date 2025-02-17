import { useEffect, useRef, useState, useCallback } from 'react';
import { useDecks, useDecksStatus, useDecksActions } from '../store/hooks';
import { RingLoader } from '../../../shared/components/ring-loader';
import { Link, useLocation } from 'react-router-dom';
import type { Deck } from '../../../shared/types';
import { getDeckFlashcards } from '../../../shared/services/idb';
import { PageLayout } from '../../../features/ui/components/page-layout';
import { IPFSImage } from '../../../shared/components/ipfs-image';

function DeckCard({ deck, showStats = false }: { deck: Deck; showStats?: boolean }) {
  return (
    <Link key={deck.id} to={`/decks/${deck.id}`} data-discover="true">
      <div className="group relative overflow-hidden bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg">
        {deck.img_cid && (
          <div className="h-48 bg-white rounded-t-lg">
            <IPFSImage 
              cid={deck.img_cid} 
              alt={deck.name}
              aspectRatio="video"
              containerClassName="h-full bg-white rounded-none"
              className="h-full"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-row items-center justify-between text-white">
            <h3 className="font-semibold leading-none tracking-tight">{deck.name}</h3>
            {showStats && deck.stats && (
              <div className="flex gap-3 text-sm">
                <span>{deck.stats.new || 0}</span>
                <span>{deck.stats.review || 0}</span>
                <span className="text-red-500">{deck.stats.due || 0}</span>
              </div>
            )}
          </div>
          {!showStats && (
            <p className="text-sm text-neutral-300 mt-2">{deck.description}</p>
          )}
          {deck.price > 0 && (
            <div className="text-sm text-neutral-400 mt-2">{`.000${deck.price} $ETH`}</div>
          )}
        </div>
      </div>
    </Link>
  );
}

function HomePage() {
  const decks = useDecks();
  const { isLoading, error } = useDecksStatus();
  const { fetchDecks } = useDecksActions();
  const hasFetchedRef = useRef(false);
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();

  // Memoize the refresh function to prevent unnecessary re-renders
  const refreshDecks = useCallback(async () => {
    await fetchDecks();
  }, [fetchDecks]);

  // Track online status
  useEffect(() => {
    function updateOnlineStatus() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Effect to refresh decks data on mount and after study
  useEffect(() => {
    let isActive = true;

    async function handleRefresh() {
      if (!isActive) return;
      await refreshDecks();
    }

    // Initial load
    if (!hasFetchedRef.current && decks.length === 0) {
      hasFetchedRef.current = true;
      void handleRefresh();
    }

    // Always refresh when returning to this page
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
  }, [refreshDecks, location.key]);

  // Check which decks are in IDB
  useEffect(() => {
    async function checkUserDecks() {
      const userDeckIds = new Set<number>();
      
      // Check each deck for flashcards in IDB
      await Promise.all(decks.map(async (deck) => {
        const cards = await getDeckFlashcards(deck.id);
        if (cards.length > 0) {
          userDeckIds.add(deck.id);
        }
      }));

      // Split decks into user decks and trending decks
      setUserDecks(decks.filter(deck => userDeckIds.has(deck.id)));
    }

    if (decks.length > 0) {
      void checkUserDecks();
    }
  }, [decks]);

  // Show loading for initial load and when refreshing with no decks
  if (isLoading && decks.length === 0) {
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

  // Filter out user decks from trending
  const trendingDecks = decks.filter(deck => !userDecks.some(ud => ud.id === deck.id));

  return (
    <PageLayout>
      <div className="space-y-8">
        {userDecks.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">My Decks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} showStats={true} />
              ))}
            </div>
          </section>
        )}

        {isOnline && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Trending</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}

export default HomePage; 