import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelectedDeck, useDecksStatus, useDecksActions, useWalletStatus, useWalletAddress } from '../store';
import { Card } from '../components/ui/card';
import { StatsBadge } from '../components/ui/stats-badge';
import { Loader } from '../components/ui/loader';

export function DeckPage() {
  const { deckId } = useParams();
  const selectedDeck = useSelectedDeck();
  const { isLoading, error } = useDecksStatus();
  const { selectDeck } = useDecksActions();
  const isWalletConnected = useWalletStatus();
  const address = useWalletAddress();

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
  const canStudy = !isPaid || (isWalletConnected && address); // TODO: Check NFT ownership

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
          {isPaid && !isWalletConnected ? (
            <button
              onClick={() => {}} // TODO: Implement wallet connection
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Connect Wallet to Purchase
            </button>
          ) : isPaid ? (
            <button
              onClick={() => {}} // TODO: Implement purchase
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Purchase for {selectedDeck.price} ETH
            </button>
          ) : null}

          <Link
            to={`/study/${selectedDeck.id}`}
            className={`w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-4 py-2 ${
              canStudy
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            Start Studying
          </Link>
        </div>
      </div>
    </div>
  );
} 