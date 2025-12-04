import { Link } from 'react-router-dom';
import { SpeedTunnel } from '../shared/ui/SpeedTunnel';
import { Icon } from '../shared/ui/Icon';

export function LandingPage() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      <SpeedTunnel />
      
      {/* TOP NAV - Responsive: Logo Left, Sound/Menu Right */}
      <header className="relative z-10 w-full px-4 py-6 sm:px-6 md:px-8 lg:px-12 xl:px-16 flex justify-between items-start animate-hero-fade-up">
        {/* Logo Area */}
        <Link to="/" className="group">
          <h1 className="font-headline text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tighter text-white group-hover:text-blue-400 transition-colors">
            ZENOTIKA<span className="text-blue-400">™</span>
          </h1>
          <p className="font-ui text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-400 mt-0.5 sm:mt-1">
            Innovation Partner
          </p>
        </Link>

        {/* Right Controls */}
        <div className="flex items-center gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          {/* Sound Toggle */}
          <button type="button" className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
            <div className="flex items-end gap-[2px] sm:gap-[3px] h-3 sm:h-4">
              <div className="w-[1.5px] sm:w-[2px] bg-white bar-1"></div>
              <div className="w-[1.5px] sm:w-[2px] bg-white bar-2"></div>
              <div className="w-[1.5px] sm:w-[2px] bg-white bar-3"></div>
              <div className="w-[1.5px] sm:w-[2px] bg-white bar-4"></div>
            </div>
            <span className="font-ui text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest text-white group-hover:text-blue-400 transition-colors hidden sm:inline">
              Sound
            </span>
          </button>

          {/* Menu - Link to Auth */}
          <Link to="/auth" className="flex gap-1 sm:gap-1.5 cursor-pointer group">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full group-hover:bg-blue-400 transition-colors"></div>
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full opacity-50 group-hover:bg-blue-400 group-hover:opacity-100 transition-all"></div>
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full opacity-50 group-hover:bg-blue-400 group-hover:opacity-100 transition-all"></div>
          </Link>
        </div>
      </header>

      {/* MAIN HERO CONTENT - Responsive Centered Left */}
      <main className="relative z-10 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 w-full max-w-full flex-1 flex items-center">
        <div className="relative w-full max-w-7xl">
          {/* The "Smoke" effect behind text (CSS Gradient) */}
          <div className="absolute -left-10 sm:-left-20 -top-10 sm:-top-20 w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] h-[150px] sm:h-[200px] md:h-[250px] lg:h-[300px] bg-blue-500/10 blur-[60px] sm:blur-[80px] md:blur-[100px] rounded-full pointer-events-none animate-glow"></div>

          {/* Main Headline - Oswald Font, Uppercase, White - FULLY RESPONSIVE */}
          <h2 className="font-headline text-[2.5rem] leading-[0.9] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] xl:text-[6.5rem] 2xl:text-[7rem] text-white uppercase mb-4 sm:mb-6 md:mb-8 drop-shadow-2xl">
            <span className="inline-block animate-hero-fade-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              HOW DO YOU
            </span>
            <br />
            <span className="inline-block animate-hero-fade-up opacity-0 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-gray-400" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              QUANTIFY
            </span>
            <br />
            <span className="inline-block animate-hero-fade-up opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
              HUMAN POTENTIAL?
            </span>
          </h2>

          {/* CTA Button */}
          <div className="animate-hero-fade-up opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <Link 
              to="/auth" 
              className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-ui text-sm uppercase tracking-wider rounded-full transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              Begin Assessment
              <Icon name="arrow-right" size={16} />
            </Link>
          </div>
        </div>
      </main>

      {/* FOOTER AREA - Responsive Layout */}
      <footer className="relative z-10 px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-12 lg:pb-12 xl:px-16 w-full animate-hero-fade-up opacity-0" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-8">
          {/* Bottom Left: Context / Logos */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-left sm:text-right sm:border-r border-gray-600 sm:pr-4 md:pr-6">
                <div className="font-headline font-bold text-base sm:text-lg md:text-xl leading-none text-white">
                  ZENOTIKA
                </div>
              </div>
              <div className="text-left">
                <div className="font-headline font-bold text-base sm:text-lg md:text-xl leading-none text-blue-400">
                  UNIKOM
                </div>
              </div>
            </div>
            
            {/* Descriptive Text */}
            <div className="max-w-full sm:max-w-md md:max-w-lg">
              <p className="font-ui text-xs sm:text-sm text-gray-300 leading-relaxed">
                Zenotika is helping global leaders reimagine how they assess talent in the tunnel, the boardroom, and everywhere in between. This is how the future works.
              </p>
            </div>
          </div>

          {/* Bottom Right: Scroll to Explore */}
          <Link to="/auth" className="flex items-center gap-3 sm:gap-4 group cursor-pointer">
            <span className="font-ui text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white group-hover:text-blue-400 transition-colors whitespace-nowrap">
              Start Now
            </span>
            <div className="relative w-12 sm:w-16 h-[1px] bg-gray-700 overflow-hidden">
              <div className="absolute inset-0 bg-white animate-scroll-line"></div>
            </div>
            <Icon name="arrow-right" size={14} className="text-white group-hover:text-blue-400 transition-colors sm:w-4 sm:h-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
