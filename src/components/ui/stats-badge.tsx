import { cn } from '../../lib/utils';

interface StatsBadgeProps {
  label: string;
  value: number | string;
  className?: string;
}

export function StatsBadge({ label, value, className }: StatsBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      <span className="text-muted-foreground">{label}:</span>
      <span className="ml-1">{value}</span>
    </div>
  );
} 