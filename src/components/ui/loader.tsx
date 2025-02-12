import { cn } from '../../lib/utils';

interface LoaderProps {
  className?: string;
}

export function Loader({ className }: LoaderProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-4 border-primary border-t-transparent h-10 w-10',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
} 