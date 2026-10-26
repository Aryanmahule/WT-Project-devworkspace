import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-surface border border-border rounded-[10px] p-6 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-card-title text-text-main font-semibold">{title}</h2>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
