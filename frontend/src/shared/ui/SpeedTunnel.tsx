/**
 * ULTRA LIGHTWEIGHT BACKGROUND
 * 
 * Citrix-level sites use PRE-RENDERED VIDEO, not real-time animations.
 * This version uses only CSS gradients with ONE subtle animation.
 * 
 * Performance: ~0% CPU usage
 */

export function SpeedTunnel() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - static, zero CPU */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.7) 100%),
            linear-gradient(180deg, #050508 0%, #080810 50%, #050508 100%)
          `
        }}
      />
      
      {/* Subtle grid - static, GPU composited */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
      
      {/* Single animated glow - very subtle, GPU only */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          animation: 'gentlePulse 8s ease-in-out infinite',
        }}
      />
      
      <style>{`
        @keyframes gentlePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
