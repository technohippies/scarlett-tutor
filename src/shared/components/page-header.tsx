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
    <header className={`sticky top-0 z-10 bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60 pb-6 -mx-6 ${className}`}>
      <div className="h-14 flex items-center">
        <Link 
          to={backTo}
          className="inline-flex items-center justify-center h-14 w-14 ml-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-neutral-800"
        >
          <X className="w-6 h-6" />
        </Link>
        {rightContent && (
          <div className="flex-1 text-right pr-4">
            {rightContent}
          </div>
        )}
      </div>
      {title && (
        <div className="px-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
      )}
    </header>
  );
} 