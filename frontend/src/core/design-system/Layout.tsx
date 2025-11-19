import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PageShell: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full h-full flex items-center justify-center p-4 md:p-8 ${className}`}>
      {children}
    </div>
  );
};

export const RoomContent: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-4xl mx-auto flex flex-col items-center ${className}`}>
      {children}
    </div>
  );
};
