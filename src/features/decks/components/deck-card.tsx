import { Link } from 'react-router-dom';
import type { Deck } from '../../../shared/services/idb/schema';
import { Card } from '../../../shared/components/card';

interface DeckCardProps {
  deck: Deck;
}

export function DeckCard({ deck }: DeckCardProps) {
  return (
    <Link to={`/decks/${deck.id}`}>
      <Card className="h-full hover:bg-accent transition-colors">
        <Card.Header>
          <Card.Title>{deck.name}</Card.Title>
          <Card.Description>{deck.description}</Card.Description>
        </Card.Header>
        
      </Card>
    </Link>
  );
} 