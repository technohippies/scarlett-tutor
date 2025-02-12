import { useMemo } from 'react';
import { useStore } from '../../../store';

export const useStudyData = () => {
  const state = useStore();
  return useMemo(() => ({
    deckId: state.deckId,
    cards: state.cards,
    currentCardIndex: state.currentCardIndex,
    currentCard: state.currentCard,
    studyAgainCards: state.studyAgainCards,
  }), [
    state.deckId,
    state.cards,
    state.currentCardIndex,
    state.currentCard,
    state.studyAgainCards,
  ]);
};

export const useStudyStatus = () => {
  const state = useStore();
  return useMemo(() => ({
    isFlipped: state.isFlipped,
    isLoading: state.isLoading,
    error: state.error,
    isCompleted: state.isCompleted,
    isSessionComplete: state.isSessionComplete,
  }), [
    state.isFlipped,
    state.isLoading,
    state.error,
    state.isCompleted,
    state.isSessionComplete
  ]);
};

export const useStudyActions = () => {
  const state = useStore();
  return useMemo(() => ({
    startStudySession: state.startStudySession,
    flipCard: state.flipCard,
    answerCard: state.answerCard,
    studyAgain: state.studyAgain,
    completeSession: state.completeSession,
  }), [state]);
}; 