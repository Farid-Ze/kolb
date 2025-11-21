import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PageShell: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-white relative overflow-hidden flex items-center justify-center p-4 md:p-8 transition-colors duration-300 ${className}`}>
      {/* Vignette effect - adjusted for both modes */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {children}
      </div>
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
