import { Link } from 'react-router-dom';
import type { Deck } from '../../../shared/services/idb/schema';
import { Card } from '../../../shared/components/card';
import { StatsBadge } from '../../../shared/components/stats-badge';

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
        <Card.Content>
          <div className="flex gap-2">
            <StatsBadge label="Category" value={deck.category} />
            <StatsBadge label="Language" value={deck.language} />
            {deck.price > 0 && (
              <StatsBadge label="Price" value={`${deck.price} ETH`} />
            )}
          </div>
        </Card.Content>
      </Card>
    </Link>
  );
} 