import { cn } from '../utils';

interface LoaderProps {
  className?: string;
}

export function Loader({ className }: LoaderProps) {
  return (
    <div className="flex items-center justify-center">
      <l-ring
        size="20"
        stroke="2"
        bg-opacity="0"
        speed="2"
        color="var(--primary)"
        className={cn('w-5 h-5', className)}
      />
    </div>
  );
} 