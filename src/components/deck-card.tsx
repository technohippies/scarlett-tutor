import { Card } from './ui/card';
import { StatsBadge } from './ui/stats-badge';
import { Deck } from '../lib/idb/schema';

interface DeckCardProps {
  deck: Deck & {
    stats?: {
      new: number;
      due: number;
      review: number;
    };
  };
  showStats?: boolean;
}

export function DeckCard({ deck, showStats = true }: DeckCardProps) {
  return (
    <Card href={`/decks/${deck.id}`} className="h-full">
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title>{deck.name}</Card.Title>
          {deck.price > 0 && (
            <span className="text-sm font-medium">
              {deck.price} ETH
            </span>
          )}
        </div>
        <Card.Description>{deck.description}</Card.Description>
      </Card.Header>
      
      <Card.Content>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>{deck.category}</span>
          <span className="mx-2">•</span>
          <span>{deck.language}</span>
        </div>
      </Card.Content>

      {showStats && deck.stats && (
        <Card.Footer className="gap-2">
          <StatsBadge label="New" value={deck.stats.new} className="bg-blue-50" />
          <StatsBadge label="Due" value={deck.stats.due} className="bg-yellow-50" />
          <StatsBadge label="Review" value={deck.stats.review} className="bg-green-50" />
        </Card.Footer>
      )}
    </Card>
  );
} 