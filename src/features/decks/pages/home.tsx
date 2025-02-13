import { useEffect, useRef, useState } from 'react';
import { useDecks, useDecksStatus, useDecksActions } from '../store/hooks';
import { Card } from '../../../shared/components/card';
import { Loader } from '../../../shared/components/loader';
import { Link } from 'react-router-dom';
import { StatsBadge } from '../../../shared/components/stats-badge';
import type { Deck } from '../../../shared/types';
import { getDeckFlashcards } from '../../../shared/services/idb';

function HomePage() {
  const decks = useDecks();
  const { isLoading, error } = useDecksStatus();
  const { fetchDecks } = useDecksActions();
  const hasFetchedRef = useRef(false);
  const [userDecks, setUserDecks] = useState<Deck[]>([]);

  useEffect(() => {
    if (!hasFetchedRef.current && !isLoading && decks.length === 0) {
      hasFetchedRef.current = true;
      void fetchDecks();
    }
  }, [isLoading, decks.length]);

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

  // Filter out user decks from trending
  const trendingDecks = decks.filter(deck => !userDecks.some(ud => ud.id === deck.id));

  return (
    <div className="space-y-8">

      {userDecks.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">My Decks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userDecks.map((deck) => (
              <Link key={deck.id} to={`/decks/${deck.id}`}>
                <Card className="h-full hover:bg-accent transition-colors">
                  <Card.Header>
                    <Card.Title>{deck.name}</Card.Title>
                    <Card.Description>{deck.description}</Card.Description>
                  </Card.Header>
                  <Card.Content>
                    <div className="flex gap-2">
                      <StatsBadge label="Category" value={deck.category} />
                      <StatsBadge label="Language" value={deck.language} />
                      {deck.price > 0 && (
                        <StatsBadge label="Price" value={`${deck.price} ETH`} />
                      )}
                    </div>
                  </Card.Content>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Trending</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingDecks.map((deck) => (
            <Link key={deck.id} to={`/decks/${deck.id}`}>
              <Card className="h-full hover:bg-accent transition-colors">
                <Card.Header>
                  <Card.Title>{deck.name}</Card.Title>
                  <Card.Description>{deck.description}</Card.Description>
                </Card.Header>
                <Card.Content>
                  <div className="flex gap-2">
                    <StatsBadge label="Category" value={deck.category} />
                    <StatsBadge label="Language" value={deck.language} />
                    {deck.price > 0 && (
                      <StatsBadge label="Price" value={`${deck.price} ETH`} />
                    )}
                  </div>
                </Card.Content>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage; 