import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelectedDeck, useDecksActions, useStudyData, useStudyStatus, useStudyActions, useWalletStatus, useAuthActions, useAuthClients } from '../store';
import { Card } from '../components/ui/card';
import { Loader } from '../components/ui/loader';

export function CompletionPage() {
  const { deckId } = useParams();
  const selectedDeck = useSelectedDeck();
  const { selectDeck } = useDecksActions();
  const { stats } = useStudyData();
  const { isLoading: isStudyLoading, error } = useStudyStatus();
  const { completeSession, studyAgain } = useStudyActions();
  const isWalletConnected = useWalletStatus();
  const { connectWallet, connectOrbis } = useAuthActions();
  const { isOrbisConnected } = useAuthClients();

  useEffect(() => {
    if (deckId) {
      void selectDeck(Number(deckId));
    }
  }, [deckId, selectDeck]);

  if (isStudyLoading) {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link 
          to={`/decks/${selectedDeck.id}`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
        >
          ×
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Session Complete!</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <Card.Header>
            <Card.Title>Session Stats</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cards Studied</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-2xl font-bold">{stats?.correct || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Again</p>
                <p className="text-2xl font-bold">{stats?.again || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <p className="text-2xl font-bold">{stats?.timeSpent || '0m'}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <div className="flex flex-col gap-4">
          {!isWalletConnected && (
            <button
              onClick={() => connectWallet()}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Connect Wallet
            </button>
          )}

          {isWalletConnected && !isOrbisConnected && (
            <button
              onClick={() => connectOrbis()}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Connect to Ceramic
            </button>
          )}

          {isWalletConnected && isOrbisConnected && (
            <button
              onClick={() => completeSession()}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Save Progress to Ceramic
            </button>
          )}

          <button
            onClick={() => studyAgain()}
            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
          >
            Study Again
          </button>
        </div>
      </div>
    </div>
  );
} 