import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelectedDeck, useDecksStatus, useDecksActions } from '../../decks/store/hooks';
import { useStudyData, useStudyStatus, useStudyActions } from '../store/hooks';
import { Card } from '../../../shared/components/card';
import { PageHeader } from '../../../shared/components/page-header';
import { PageLayout } from '../../../features/ui/components/page-layout';
import { RingLoader } from '../../../shared/components/ring-loader';
import { AudioPlayer } from '../../../shared/components/audio-player';
import { IPFSImage } from '../../../shared/components/ipfs-image';
import { mediaPreloader } from '../../../shared/services/media-preloader';

export function StudyPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const selectedDeck = useSelectedDeck();
  const { isLoading: isLoadingDeck } = useDecksStatus();
  const { selectDeck } = useDecksActions();
  const { cards, currentCard } = useStudyData();
  const { isLoading: isLoadingStudy, isFlipped, isCompleted } = useStudyStatus();
  const { startStudySession, flipCard, answerCard } = useStudyActions();
  
  // Track initialization state
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastSelectedDeckId = useRef<number | null>(null);
  const shouldStartStudy = useRef(false);

  // Effect to handle deck selection
  useEffect(() => {
    if (!deckId) {
      console.log('[StudyPage] No deck ID provided');
      return;
    }

    const numericDeckId = Number(deckId);

    // Reset initialization if deck changes
    if (lastSelectedDeckId.current !== numericDeckId) {
      console.log('[StudyPage] Deck changed, resetting initialization:', {
        previous: lastSelectedDeckId.current,
        current: numericDeckId
      });
      setIsInitialized(false);
      setIsInitializing(false);
      lastSelectedDeckId.current = numericDeckId;
      shouldStartStudy.current = true;
    }

    // Select deck if needed
    if (!selectedDeck || selectedDeck.id !== numericDeckId) {
      console.log('[StudyPage] Selecting deck:', numericDeckId);
      void selectDeck(numericDeckId);
    }
  }, [deckId, selectedDeck, selectDeck]);

  // Effect to start study session once deck is selected
  useEffect(() => {
    async function startStudy() {
      if (!selectedDeck || !shouldStartStudy.current || isInitializing || isInitialized) {
        return;
      }

      try {
        setIsInitializing(true);
        console.log('[StudyPage] Starting study session:', {
          deckId: selectedDeck.id,
          hasCards: (selectedDeck.stats?.new ?? 0) > 0 || 
                   (selectedDeck.stats?.due ?? 0) > 0 || 
                   (selectedDeck.stats?.review ?? 0) > 0,
          stats: selectedDeck.stats
        });

        await startStudySession(selectedDeck.id);
        shouldStartStudy.current = false;
        
        // Don't set initialized here - wait for cards to load
        console.log('[StudyPage] Study session started, waiting for cards');
      } catch (error) {
        console.error('[StudyPage] Failed to start study session:', error);
        setIsInitializing(false);
        shouldStartStudy.current = false;
      }
    }

    void startStudy();
  }, [selectedDeck, isInitializing, isInitialized, startStudySession]);

  // Effect to track card loading and preload next card's media
  useEffect(() => {
    if (cards.length > 0 && currentCard && isInitializing) {
      console.log('[StudyPage] Cards loaded:', {
        cardsCount: cards.length,
        currentCard: currentCard.id,
        isInitializing
      });
      setIsInitialized(true);
      setIsInitializing(false);
    }

    // Preload next card's media
    if (cards.length > 0 && currentCard) {
      const currentIndex = cards.findIndex(card => card.id === currentCard.id);
      const nextCard = cards[currentIndex + 1];
      
      if (nextCard) {
        const mediaToPreload: string[] = [];
        
        if (nextCard.front_image_cid) {
          mediaToPreload.push(nextCard.front_image_cid);
        }
        if (nextCard.audio_tts_cid) {
          mediaToPreload.push(nextCard.audio_tts_cid);
        }
        
        if (mediaToPreload.length > 0) {
          console.log('[StudyPage] Preloading media for next card:', {
            nextCardId: nextCard.id,
            mediaCount: mediaToPreload.length
          });
          mediaPreloader.queuePreload(mediaToPreload);
        }
      }
    }
  }, [cards, currentCard, isInitializing]);

  // Handle completion navigation
  useEffect(() => {
    if (isCompleted && selectedDeck) {
      navigate(`/study/${selectedDeck.id}/complete`);
    }
  }, [isCompleted, selectedDeck, navigate]);

  // First loader (page loading)
  if (isLoadingDeck || isLoadingStudy || isInitializing || (!isInitialized && !currentCard)) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center justify-center">
            <RingLoader />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!selectedDeck) {
    return (
      <PageLayout>
        <Card>
          <Card.Header>
            <Card.Title>Deck not found</Card.Title>
          </Card.Header>
          <Card.Content>
            <p>The deck you're looking for doesn't exist.</p>
          </Card.Content>
          <Card.Footer>
            <Link to="/" className="text-primary hover:underline">
              Go back home
            </Link>
          </Card.Footer>
        </Card>
      </PageLayout>
    );
  }

  if (!currentCard) {
    return (
      <PageLayout>
        <Card>
          <Card.Header>
            <Card.Title>No cards to study</Card.Title>
          </Card.Header>
          <Card.Content>
            <p>There are no cards to study in this deck right now.</p>
          </Card.Content>
          <Card.Footer>
            <Link to={`/decks/${selectedDeck.id}`} className="text-primary hover:underline">
              Back to deck
            </Link>
          </Card.Footer>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <PageHeader backTo={`/decks/${selectedDeck?.id}`} />

        <Card>
          <Card.Content>
            <div className="relative">
              <div className="inset-0 flex flex-col items-center justify-start text-lg">
                <div className="flex flex-col items-center">
                  {currentCard.front_image_cid && (
                    <div className="mb-4 w-full max-w-[160px] h-[160px]">
                      <IPFSImage 
                        cid={currentCard.front_image_cid}
                        alt=""
                        aspectRatio="square"
                        containerClassName="h-full"
                      />
                    </div>
                  )}
                  <div className="text-center mt-2 text-xl sm:text-2xl font-medium">{currentCard.front_text}</div>
                  {currentCard.audio_tts_cid && (
                    <div className="mt-4">
                      <AudioPlayer 
                        cid={currentCard.audio_tts_cid}
                        src={`https://premium.w3ipfs.storage/ipfs/${currentCard.audio_tts_cid}`}
                      />
                    </div>
                  )}
                </div>
                {isFlipped && (
                  <div className="mt-8">
                    <div className="text-center text-xl sm:text-2xl font-medium">
                      {currentCard.back_text}
                    </div>
                    {currentCard.notes && (
                      <div className="mt-4 text-lg text-neutral-300 text-center">
                        {currentCard.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4">
          <div className="container max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div className="flex justify-center">
              {!isFlipped ? (
                <button
                  onClick={() => flipCard()}
                  className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12"
                >
                  Flip
                </button>
              ) : (
                <div className="w-full flex gap-4">
                  <button
                    onClick={() => answerCard('again')}
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 bg-neutral-600 text-white shadow-lg hover:bg-neutral-700 active:bg-neutral-800 h-12"
                  >
                    Again
                  </button>
                  <button
                    onClick={() => answerCard('good')}
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12"
                  >
                    Good
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 