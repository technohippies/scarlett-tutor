import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStudyActions, useStudyStatus } from '../store/hooks';
import { useWalletStatus, useAuthActions, useAuthClients } from '../../auth/store/hooks';
import { Loader } from '../../../shared/components/loader';
import { Trophy } from '@phosphor-icons/react';
import { PageHeader } from '../../../shared/components/page-header';
import { PageLayout } from '../../../features/ui/components/page-layout';

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

  // Verify session state and redirect if invalid
  useEffect(() => {
    if (!isCompleted || !isSessionComplete) {
      console.log('[CompletionPage] Invalid session state, redirecting...', { isCompleted, isSessionComplete });
      navigate(`/decks/${deckId}`);
    }
  }, [isCompleted, isSessionComplete, navigate, deckId]);

  const handleConnectCeramic = async () => {
    try {
      setIsSaving(true);
      setError(null);
      console.log('[CompletionPage] Connecting to Ceramic...');
      await connectOrbis();
      
      // Wait a bit to ensure the connection is established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!isOrbisConnected) {
        throw new Error('Failed to establish Ceramic connection');
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
    if (!isWalletConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isOrbisConnected) {
      await handleConnectCeramic();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      console.log('[CompletionPage] Saving progress to Ceramic');
      await completeSession();
      console.log('[CompletionPage] Progress saved successfully');
      navigate(`/decks/${deckId}`);
    } catch (err) {
      console.error('[CompletionPage] Failed to save progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to save progress. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageHeader 
          backTo={`/decks/${deckId}`} 
          title="Study Complete!"
          rightContent={
            <Trophy className="w-8 h-8 text-yellow-500" weight="fill" />
          }
        />

        {error && (
          <div className="rounded-md bg-destructive/15 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60 border-t border-neutral-800">
          <div className="container max-w-6xl mx-auto sm:px-6 lg:px-8">
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
    </PageLayout>
  );
} 