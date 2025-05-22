// components/ui/card.tsx
import { FC, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md ${className}`}>
    {children}
  </div>
);