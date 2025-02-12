import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudyActions, useWalletStatus, useAuthActions, useAuthClients } from '../store';
import { ring } from 'ldrs';

// Register the loader component
ring.register();

export function CompletionPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { completeSession } = useStudyActions();
  const isWalletConnected = useWalletStatus();
  const { connectWallet } = useAuthActions();
  const { isOrbisConnected, orbis } = useAuthClients();
  const [isSaving, setIsSaving] = useState(false);

  // Prevent direct access
  useEffect(() => {
    const hasStats = sessionStorage.getItem('hasCompletedStudy');
    if (!hasStats) {
      navigate(`/decks/${deckId}`);
    }
  }, [deckId, navigate]);

  const handleSaveProgress = async () => {
    setIsSaving(true);
    console.log('[CompletionPage] Saving progress to Ceramic');
    await completeSession();
    setIsSaving(false);
    navigate(`/decks/${deckId}`);
  };

  const handleConnectOrbis = async () => {
    // TODO: Implement Orbis connection
    console.log('Connecting to Orbis...');
  };

  return (
    <div className="max-w-lg mx-auto space-y-8 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Study Complete!</h1>

      <div className="space-y-4">
        {!isWalletConnected ? (
          <button
            onClick={connectWallet}
            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            Connect Wallet
          </button>
        ) : !isOrbisConnected ? (
          <button
            onClick={handleConnectOrbis}
            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            Connect to Ceramic
          </button>
        ) : (
          <div className="space-y-4">
            {isSaving ? (
              <div className="flex items-center justify-center gap-2 p-4">
                <div className="w-5 h-5">
                  <l-ring
                    size="20"
                    stroke="2"
                    bg-opacity="0"
                    speed="2" 
                    color="var(--primary)"
                  />
                </div>
                <span>Saving progress...</span>
              </div>
            ) : (
              <>
                <button
                  onClick={handleSaveProgress}
                  className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                >
                  Save Progress to Ceramic
                </button>
                <button
                  onClick={() => navigate(`/decks/${deckId}`)}
                  className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                >
                  Skip
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 