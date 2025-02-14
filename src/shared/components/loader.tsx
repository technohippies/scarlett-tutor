/// <reference path="../../shared/types/custom-elements.d.ts" />
import { cn } from '../utils';

interface LoaderProps {
  className?: string;
}

export function Loader({ className }: LoaderProps) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-neutral-600 border-t-blue-500',
          'w-5 h-5',
          className
        )}
      />
    </div>
  );
} 