import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LayoutProps } from '../types';

interface CardProps extends LayoutProps {
  href?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ href, children, className = '' }: CardProps) {
  const Comp = href ? Link : 'div';
  return (
    <Comp
      to={href || ''}
      className={`group relative p-6 ${className}`}
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
  return <div className={`flex flex-col space-y-2 ${className}`}>{children}</div>;
};

Card.Title = function CardTitle({ children, className = '' }: CardHeaderProps) {
  return <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
};

Card.Description = function CardDescription({ children, className = '' }: CardHeaderProps) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
};

Card.Content = function CardContent({ children, className = '' }: CardHeaderProps) {
  return <div className={`${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }: CardHeaderProps) {
  return <div className={`flex items-center pt-4 ${className}`}>{children}</div>;
}; 