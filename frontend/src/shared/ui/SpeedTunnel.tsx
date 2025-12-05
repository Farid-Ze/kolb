// Reduced particles for better CPU performance (20 instead of 50)
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left: ((i * 17 + 7) % 100),
  top: ((i * 31 + 13) % 100),
  size: 1 + ((i * 3) % 3),
  duration: 6 + ((i * 7) % 60) / 10, // Slower animations = less CPU
  delay: ((i * 11) % 30) / 10,
  opacity: 0.2 + ((i * 13) % 40) / 100,
}))

// Reduced tunnel rings (8 instead of 15)
const TUNNEL_RINGS = Array.from({ length: 8 }, (_, i) => ({
  size: (i + 1) * 12,
  duration: 5 + i * 0.2, // Slower = less CPU
  delay: i * 0.15,
  opacity: 0.15 + (i % 3) * 0.05,
}))

export function SpeedTunnel() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Deep space gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black">
        
        {/* Radial glow center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] animate-pulse" />
        </div>

        {/* Animated grid floor */}
        <div className="absolute inset-0 opacity-15">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              transform: 'perspective(500px) rotateX(60deg)',
              transformOrigin: 'center top',
              animation: 'gridFlow 15s linear infinite'
            }}
          />
        </div>

        {/* Perspective tunnel rings - GPU accelerated */}
        <div className="absolute inset-0 flex items-center justify-center">
          {TUNNEL_RINGS.map((ring, i) => (
            <div
              key={i}
              className="absolute border border-blue-400/20 rounded-full"
              style={{
                width: `${ring.size}%`,
                height: `${ring.size}%`,
                opacity: ring.opacity,
                animation: `tunnelExpand ${ring.duration}s linear infinite`,
                animationDelay: `${ring.delay}s`,
                willChange: 'transform, opacity',
                contain: 'strict'
              }}
            />
          ))}
        </div>

        {/* Floating particles / stars - GPU accelerated */}
        <div className="absolute inset-0" style={{ contain: 'strict' }}>
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute bg-blue-300 rounded-full"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                animation: `starFloat ${p.duration}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`,
                willChange: 'transform, opacity'
              }}
            />
          ))}
        </div>

        {/* Speed lines - reduced count */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="absolute h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent"
              style={{
                top: `${15 + i * 20}%`,
                left: '-100%',
                right: '-100%',
                animation: `speedLine ${3 + i * 0.4}s linear infinite`,
                animationDelay: `${i * 0.3}s`,
                willChange: 'transform, opacity'
              }}
            />
          ))}
        </div>

        {/* Vignette overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 100%)'
          }}
        />
      </div>

      <style>{`
        @keyframes tunnelExpand {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          20% {
            opacity: 0.3;
          }
          80% {
            opacity: 0.1;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        @keyframes gridFlow {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 60px;
          }
        }

        @keyframes starFloat {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: var(--tw-opacity, 0.3);
          }
          50% {
            transform: translateY(-15px) translateX(8px) scale(1.2);
            opacity: calc(var(--tw-opacity, 0.3) * 1.5);
          }
        }

        @keyframes speedLine {
          0% {
            transform: translateX(-50%) scaleX(0.3);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateX(50%) scaleX(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
