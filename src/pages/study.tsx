import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelectedDeck, useDecksStatus, useDecksActions, useStudyData, useStudyStatus, useStudyActions } from '../store';
import { Card } from '../components/ui/card';
import { Loader } from '../components/ui/loader';

export function StudyPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const selectedDeck = useSelectedDeck();
  const { isLoading: isDeckLoading } = useDecksStatus();
  const { selectDeck } = useDecksActions();
  const { currentCard } = useStudyData();
  const { 
    isFlipped,
    isLoading: isStudyLoading,
    error,
    isSessionComplete
  } = useStudyStatus();
  const {
    startStudySession,
    flipCard,
    answerCard,
  } = useStudyActions();

  useEffect(() => {
    if (deckId) {
      void selectDeck(Number(deckId));
    }
  }, [deckId, selectDeck]);

  useEffect(() => {
    if (selectedDeck && !isStudyLoading) {
      void startStudySession(selectedDeck.id);
    }
  }, [selectedDeck, startStudySession, isStudyLoading]);

  useEffect(() => {
    if (isSessionComplete) {
      navigate(`/study/${deckId}/complete`);
    }
  }, [isSessionComplete, navigate, deckId]);

  if (isDeckLoading || isStudyLoading) {
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

  if (!selectedDeck || !currentCard) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">No cards to study</p>
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
        <h1 className="text-3xl font-bold tracking-tight">{selectedDeck.name}</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="min-h-[400px] flex flex-col">
          <Card.Header>
            {currentCard.front_image_cid && (
              <img 
                src={`https://public.w3ipfs.storage/ipfs/${currentCard.front_image_cid}`}
                alt="Front of card"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <Card.Title className="text-xl">{currentCard.front_text}</Card.Title>
          </Card.Header>
          
          {isFlipped && (
            <Card.Content className="flex-grow">
              {currentCard.back_image_cid && (
                <img 
                  src={`https://public.w3ipfs.storage/ipfs/${currentCard.back_image_cid}`}
                  alt="Back of card"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <p className="text-lg">{currentCard.back_text}</p>
              {currentCard.notes && (
                <p className="text-sm text-muted-foreground mt-4">{currentCard.notes}</p>
              )}
            </Card.Content>
          )}

          <Card.Footer className="mt-auto">
            {!isFlipped ? (
              <button
                onClick={() => flipCard()}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
              >
                Flip
              </button>
            ) : (
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => answerCard('again')}
                  className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4 py-2"
                >
                  Again
                </button>
                <button
                  onClick={() => answerCard('good')}
                  className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                >
                  Good
                </button>
              </div>
            )}
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
} 