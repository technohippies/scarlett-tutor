import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStudyActions } from '../store/hooks';
import { useWalletStatus, useAuthActions, useAuthClients } from '../../auth/store/hooks';
import { Loader } from '../../../shared/components/loader';
import { X, Trophy } from '@phosphor-icons/react';

export function CompletionPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { completeSession } = useStudyActions();
  const isWalletConnected = useWalletStatus();
  const { connectWallet } = useAuthActions();
  const { isOrbisConnected } = useAuthClients();
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

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" weight="fill" />
          <h1 className="text-3xl font-bold tracking-tight">Study Complete!</h1>
        </div>
        <Link 
          to={`/decks/${deckId}`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-neutral-800 h-9 w-9"
        >
          <X className="w-5 h-5" />
        </Link>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60 border-t border-neutral-800">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-4">
            {!isWalletConnected ? (
              <button
                onClick={connectWallet}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12"
              >
                Connect Wallet
              </button>
            ) : !isOrbisConnected ? (
              <button
                onClick={handleSaveProgress}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12"
              >
                Connect to Ceramic
              </button>
            ) : (
              <div className="flex w-full gap-4">
                {isSaving ? (
                  <div className="w-full flex items-center justify-center gap-3 h-12 text-neutral-400">
                    <Loader className="w-5 h-5" />
                    <span>Saving progress...</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProgress}
                      className="w-[45%] inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12"
                    >
                      Save Progress
                    </button>
                    <button
                      onClick={() => navigate(`/decks/${deckId}`)}
                      className="w-[45%] inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 bg-neutral-600 text-white shadow-lg hover:bg-neutral-700 active:bg-neutral-800 h-12"
                    >
                      Skip
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 