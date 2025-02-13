interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageLayout({ children, className = '', fullWidth = false }: PageLayoutProps) {
  return (
    <div className={`container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 ${className}`}>
      <div className={fullWidth ? 'w-full' : 'max-w-3xl mx-auto'}>
        {children}
      </div>
    </div>
  );
} 