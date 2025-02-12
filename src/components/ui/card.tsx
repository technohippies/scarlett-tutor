import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  href?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ href, children, className = '' }: CardProps) {
  const Comp = href ? Link : 'div';
  return (
    <Comp
      to={href || ''}
      className={`group relative rounded-lg border p-6 hover:border-foreground/50 transition-colors ${className}`}
    >
      {children}
    </Comp>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

Card.Header = function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`flex flex-col space-y-1.5 ${className}`}>{children}</div>;
};

Card.Title = function CardTitle({ children, className = '' }: CardHeaderProps) {
  return <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
};

Card.Description = function CardDescription({ children, className = '' }: CardHeaderProps) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
};

Card.Content = function CardContent({ children, className = '' }: CardHeaderProps) {
  return <div className={`pt-6 ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }: CardHeaderProps) {
  return <div className={`flex items-center pt-4 ${className}`}>{children}</div>;
}; 