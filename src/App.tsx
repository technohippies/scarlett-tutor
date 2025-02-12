import { Routes, Route } from 'react-router-dom';
import { Layout } from './features/ui/components/layout';
import HomePage from './features/decks/pages/home';
import { DeckPage } from './features/decks/pages/deck';
import { StudyPage } from './features/study/pages/study';
import { CompletionPage } from './features/study/pages/completion';
import { ring } from 'ldrs';

// Register the loader component
ring.register();

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/decks/:deckId" element={<DeckPage />} />
        <Route path="/study/:deckId" element={<StudyPage />} />
        <Route path="/study/:deckId/complete" element={<CompletionPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
