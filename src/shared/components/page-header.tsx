import { Link } from 'react-router-dom';
import { X } from '@phosphor-icons/react';

interface PageHeaderProps {
  backTo: string;
  title?: string;
  className?: string;
  rightContent?: React.ReactNode;
}

export function PageHeader({ backTo, title, className = '', rightContent }: PageHeaderProps) {
  return (
    <header className={`sticky top-0 z-10 bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60 pb-6 ${className}`}>
      <div className="h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to={backTo}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-neutral-800 h-9 w-9"
          >
            <X className="w-5 h-5" />
          </Link>
        </div>
        {rightContent && (
          <div className="px-4">
            {rightContent}
          </div>
        )}
      </div>
      {title && (
        <div className="pt-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
      )}
    </header>
  );
} 