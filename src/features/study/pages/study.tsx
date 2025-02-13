import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelectedDeck, useDecksStatus, useDecksActions } from '../../decks/store/hooks';
import { useStudyData, useStudyStatus, useStudyActions } from '../store/hooks';
import { Card } from '../../../shared/components/card';
import { Loader } from '../../../shared/components/loader';
import { Progress } from '../../../shared/components/progress';
import { PageHeader } from '../../../shared/components/page-header';
import { PageLayout } from '../../../features/ui/components/page-layout';

export function StudyPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const selectedDeck = useSelectedDeck();
  const { isLoading: isLoadingDeck } = useDecksStatus();
  const { selectDeck } = useDecksActions();
  const { cards, currentCard, currentCardIndex } = useStudyData();
  const { isLoading: isLoadingStudy, isFlipped, isCompleted } = useStudyStatus();
  const { startStudySession, flipCard, answerCard } = useStudyActions();

  useEffect(() => {
    if (deckId) {
      selectDeck(Number(deckId));
    }
  }, [deckId, selectDeck]);

  useEffect(() => {
    if (selectedDeck && !isLoadingDeck) {
      startStudySession(selectedDeck.id);
    }
  }, [selectedDeck, isLoadingDeck, startStudySession]);

  // Handle completion navigation in useEffect
  useEffect(() => {
    if (isCompleted && selectedDeck) {
      navigate(`/study/${selectedDeck.id}/complete`);
    }
  }, [isCompleted, selectedDeck, navigate]);

  if (isLoadingDeck || isLoadingStudy) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader className="w-8 h-8" />
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

  // Calculate progress percentage
  const progressPercentage = cards.length > 0 ? (currentCardIndex / cards.length) * 100 : 0;

  return (
    <PageLayout>
      <div className="space-y-6">
        <PageHeader backTo={`/decks/${selectedDeck?.id}`} />
        <Progress value={progressPercentage} className="h-3" />

        <Card>
          <Card.Content>
            <div className="min-h-[200px] flex items-center justify-center text-lg">
              {isFlipped ? currentCard.back_text : currentCard.front_text}
            </div>
          </Card.Content>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60 border-t border-neutral-800">
          <div className="container flex justify-center gap-4">
            {!isFlipped ? (
              <button
                onClick={() => flipCard()}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12 px-4"
              >
                Show Answer
              </button>
            ) : (
              <>
                <button
                  onClick={() => answerCard('again')}
                  className="w-[45%] inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 bg-neutral-600 text-white shadow-lg hover:bg-neutral-700 active:bg-neutral-800 h-12"
                >
                  Again
                </button>
                <button
                  onClick={() => answerCard('good')}
                  className="w-[45%] inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-12"
                >
                  Good
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 