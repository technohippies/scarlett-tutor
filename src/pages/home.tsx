import { useEffect, useRef } from 'react';
import { useDecks, useDecksStatus, useDecksActions } from '../store';
import { Card } from '../components/ui/card';
import { Loader } from '../components/ui/loader';
import { Link } from 'react-router-dom';
import { StatsBadge } from '../components/ui/stats-badge';
import { Deck } from '../lib/idb/schema';

function HomePage() {
  const decks = useDecks();
  const { isLoading, error } = useDecksStatus();
  const { fetchDecks } = useDecksActions();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current && !isLoading && decks.length === 0) {
      hasFetchedRef.current = true;
      void fetchDecks();
    }
  }, [isLoading, decks.length]);

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

  // Split decks into user decks and trending decks
  // For now, we'll consider all decks as trending since we haven't implemented user decks yet
  const trendingDecks = decks;
  const userDecks: Deck[] = [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Home</h1>

      {userDecks.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Your Decks</h2>
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
        <h2 className="text-2xl font-bold tracking-tight mb-4">Trending Decks</h2>
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