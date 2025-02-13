import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStudyActions, useStudyStatus } from '../store/hooks';
import { useWalletStatus, useAuthActions, useAuthClients } from '../../auth/store/hooks';
import { Loader } from '../../../shared/components/loader';
import { X, Trophy } from '@phosphor-icons/react';

export function CompletionPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { completeSession } = useStudyActions();
  const { isCompleted, isSessionComplete } = useStudyStatus();
  const isWalletConnected = useWalletStatus();
  const { connectWallet, connectOrbis } = useAuthActions();
  const { isOrbisConnected } = useAuthClients();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent direct access
  useEffect(() => {
    const hasStats = sessionStorage.getItem('hasCompletedStudy');
    if (!hasStats) {
      navigate(`/decks/${deckId}`);
    }
  }, [deckId, navigate]);

  const handleConnectCeramic = async () => {
    try {
      setIsSaving(true);
      setError(null);
      console.log('[CompletionPage] Connecting to Ceramic...');
      await connectOrbis();
      
      // Wait for connection state to update with exponential backoff
      let attempts = 0;
      const maxAttempts = 5;
      while (!isOrbisConnected && attempts < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempts), 5000); // Max 5 second delay
        console.log(`[CompletionPage] Waiting for connection (attempt ${attempts + 1})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;
      }
      
      if (!isOrbisConnected) {
        throw new Error('Timed out waiting for Ceramic connection');
      }
      
      console.log('[CompletionPage] Connected to Ceramic, checking session state...');
      
      // Verify session state before proceeding
      if (!isCompleted || !isSessionComplete) {
        console.warn('[CompletionPage] Session not complete, redirecting...');
        navigate(`/decks/${deckId}`);
        return;
      }
      
      console.log('[CompletionPage] Session state verified, saving progress...');
      await handleSaveProgress();
    } catch (error) {
      console.error('[CompletionPage] Failed to connect to Ceramic:', error);
      setError('Failed to connect to Ceramic. Please try again.');
      setIsSaving(false);
    }
  };

  const handleSaveProgress = async () => {
    try {
      if (!isOrbisConnected) {
        throw new Error('Ceramic connection not established');
      }

      if (!isCompleted || !isSessionComplete) {
        throw new Error('Study session not complete');
      }

      setIsSaving(true);
      setError(null);
      console.log('[CompletionPage] Saving progress to Ceramic');
      await completeSession();
      setIsSaving(false);
      setError(null);
    } catch (error) {
      console.error('[CompletionPage] Failed to save progress:', error);
      setError('Failed to save progress. Please try again.');
      setIsSaving(false);
    }
  };

  // Verify session state is valid
  useEffect(() => {
    if (!isCompleted || !isSessionComplete) {
      console.warn('[CompletionPage] Invalid session state, redirecting...', {
        isCompleted,
        isSessionComplete
      });
      navigate(`/decks/${deckId}`);
    }
  }, [isCompleted, isSessionComplete, deckId, navigate]);

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

      {error && (
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

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
                onClick={handleConnectCeramic}
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center gap-3">
                    <Loader className="w-5 h-5" />
                    <span>Connecting to Ceramic...</span>
                  </div>
                ) : (
                  'Connect to Ceramic'
                )}
              </button>
            ) : (
              <button
                onClick={handleSaveProgress}
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center gap-3">
                    <Loader className="w-5 h-5" />
                    <span>Saving progress...</span>
                  </div>
                ) : (
                  'Save Progress'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 