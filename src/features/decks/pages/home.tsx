import { useEffect, useRef, useState, useCallback } from 'react';
import { useDecks, useDecksStatus, useDecksActions } from '../store/hooks';
import { RingLoader } from '../../../shared/components/ring-loader';
import { Link, useLocation } from 'react-router-dom';
import type { Deck } from '../../../shared/types';
import { getDeckFlashcards } from '../../../shared/services/idb';
import { PageLayout } from '../../../features/ui/components/page-layout';

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
    if (!hasFetchedRef.current && !isLoading && decks.length === 0) {
      hasFetchedRef.current = true;
      void handleRefresh();
    }

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
  }, [refreshDecks, location.key]); // Re-run on navigation

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

  // Show loading only on initial load
  if (isLoading && decks.length === 0 && !hasFetchedRef.current) {
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
              {userDecks.map((deck) => {
                console.log('[HomePage] Deck stats:', {
                  deckId: deck.id,
                  deckName: deck.name,
                  stats: deck.stats,
                  hasStats: !!deck.stats
                });
                return (
                  <Link key={deck.id} to={`/decks/${deck.id}`} data-discover="true">
                    <div className="group relative p-6 h-full bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg">
                      <div className="flex flex-row items-center justify-between">
                        <h3 className="font-semibold leading-none tracking-tight">{deck.name}</h3>
                        {deck.stats && (
                          <div className="flex gap-3 text-sm">
                            <span>{deck.stats.new || 0}</span>
                            <span>{deck.stats.review || 0}</span>
                            <span className="text-red-500">{deck.stats.due || 0}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {isOnline && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Trending</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingDecks.map((deck) => (
                <Link key={deck.id} to={`/decks/${deck.id}`} data-discover="true">
                  <div className="group relative p-6 h-full bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg">
                    <div className="flex flex-col space-y-2">
                      <h3 className="font-semibold leading-none tracking-tight">{deck.name}</h3>
                      <p className="text-sm text-muted-foreground">{deck.description}</p>
                      {deck.price > 0 && (
                        <div className="text-sm text-neutral-400">{`.000${deck.price} $ETH`}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}

export default HomePage; 