import React from 'react';

export const BackgroundVignette: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.03] bg-noise mix-blend-overlay" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
};
