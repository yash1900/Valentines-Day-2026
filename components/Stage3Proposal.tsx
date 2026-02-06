import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from './GlassCard';

interface Stage3Props {
  onYes: () => void;
}

export const Stage3Proposal: React.FC<Stage3Props> = ({ onYes }) => {
  const [noBtnPos, setNoBtnPos] = useState({ x: 0, y: 0 });
  const noBtnRef = useRef<HTMLButtonElement>(null);
  const [showError, setShowError] = useState(false);
  const [hoverCount, setHoverCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!noBtnRef.current || isTransitioning) return;
    
    const rect = noBtnRef.current.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Interaction Radius
    const threshold = 150; 
    const dist = Math.hypot(mouseX - btnCenterX, mouseY - btnCenterY);

    if (dist < threshold) {
        setHoverCount(prev => prev + 1);
        
        // Calculate repulsion vector (Away from mouse)
        const dx = mouseX - btnCenterX;
        const dy = mouseY - btnCenterY;
        
        // Normalize
        const rawDist = Math.max(dist, 1); // Avoid div by zero
        const dirX = dx / rawDist;
        const dirY = dy / rawDist;

        // Force strength (0 to 1, higher when closer)
        const force = Math.pow((threshold - dist) / threshold, 2); 
        
        // Movement amount per frame (tuned for responsiveness without teleporting)
        const speed = 40 * force; 
        
        let moveX = -dirX * speed;
        let moveY = -dirY * speed;

        // Apply to current position
        let nextX = noBtnPos.x + moveX;
        let nextY = noBtnPos.y + moveY;

        // --- CONSTRAINTS ---
        // Prevents button from leaving the visible area or getting stuck
        
        const MAX_X = 280;     // Side boundaries
        const MAX_UP = 300;    // Can go high up
        const MAX_DOWN = 20;   // STRICT LIMIT downwards to prevent overflow

        // 1. Clamp Y (Floor is lava)
        if (nextY > MAX_DOWN) {
            nextY = MAX_DOWN;
            // If trapped against floor, convert vertical force to horizontal slide
            // If mouse is above (dy < 0 relative to button? No, dy = mouseY - btnY. Mouse above means dy < 0)
            if (dy < 0) { 
                // Mouse is above, pushing down. Slide sideways.
                // Move in the direction of the mouse's horizontal offset to "escape" around it?
                // No, move AWAY from mouse X.
                nextX += (dx > 0 ? -15 : 15);
            }
        }
        if (nextY < -MAX_UP) nextY = -MAX_UP;

        // 2. Clamp X (Walls)
        if (nextX > MAX_X) {
            nextX = MAX_X;
            // Wall slide logic
            if (dx < 0) nextY += (dy > 0 ? -15 : 15);
        }
        if (nextX < -MAX_X) {
            nextX = -MAX_X;
             if (dx > 0) nextY += (dy > 0 ? -15 : 15);
        }

        setNoBtnPos({ x: nextX, y: nextY });
    }
  };

  const handleNoClick = () => {
      setShowError(true);
      setTimeout(() => setShowError(false), 2500);
  };

  const handleYesClick = () => {
      setIsTransitioning(true);
      // Wait for animation before calling parent
      setTimeout(() => {
          onYes();
      }, 2000);
  };

  return (
    <div 
        onMouseMove={handleMouseMove}
        className="relative w-full h-full flex items-center justify-center p-4"
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.02); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fade-in {
            animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            opacity: 0;
        }
        .animate-bob {
            animation: bob 2s ease-in-out infinite;
        }
        .animate-gentle-pulse {
            animation: subtlePulse 3s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {isTransitioning && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
              <div className="text-6xl animate-bounce mb-4">💖</div>
              <h2 className="text-2xl font-bold font-mono text-gray-800">CONFIRMING...</h2>
              <p className="text-gray-500 font-mono">Securing timeline...</p>
          </div>
      )}

      {/* Changed overflow-hidden to overflow-visible so the button doesn't get clipped */}
      <GlassCard className={`max-w-2xl w-full text-center relative z-10 !p-0 overflow-visible border-0 shadow-2xl transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Header Section */}
        <div className="bg-pastel-lavender p-6 border-b-4 border-white/50 relative overflow-hidden animate-fade-in rounded-t-lg">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pastel-pink via-pastel-blue to-pastel-mint"></div>
            <h2 className="text-xl font-mono font-bold text-gray-500 tracking-widest uppercase mb-2">
                THE KISS HYPNOTISED SITCOM
            </h2>
            <div className="inline-block px-4 py-1 bg-white/50 rounded-full border border-white">
                <span className="text-sm font-bold text-pastel-dark">DROPPED THE QUESTION</span>
            </div>
        </div>

        {/* Main Content */}
        <div className="p-8 md:p-12 bg-white/40 backdrop-blur-sm relative rounded-b-lg">
            {/* Decorative Hearts Background */}
            <div className="absolute top-10 left-10 text-4xl animate-float opacity-20" style={{ animationDuration: '4s' }}>💘</div>
            <div className="absolute bottom-20 right-10 text-5xl animate-pulse opacity-20">💌</div>
            <div className="absolute top-1/2 right-5 text-3xl animate-spin opacity-20" style={{animationDuration: '3s'}}>✨</div>

            <h1 className="text-5xl md:text-6xl font-black text-pastel-dark mb-4 leading-none tracking-tight drop-shadow-sm animate-fade-in delay-100">
              Will you be my <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                Valentine?
              </span>
            </h1>

            <div className="my-8 animate-fade-in delay-200">
                <div className="inline-block relative">
                     <span className="text-2xl md:text-3xl font-bold font-mono bg-pastel-yellow px-4 py-2 transform -rotate-2 shadow-sm block border-2 border-pastel-dark text-pastel-dark">
                        CUTUUUUU
                    </span>
                    <span className="absolute -top-3 -right-3 text-3xl animate-bob">🎀</span>
                </div>
            </div>
            
            <div className="bg-white/60 p-6 rounded-lg border-2 border-dashed border-pastel-dark/30 mb-10 transform rotate-1 hover:rotate-0 transition-transform duration-300 animate-fade-in delay-300">
                <p className="text-lg text-gray-700 font-mono leading-relaxed">
                  "4 years in and you're still the funniest, smartest, and most beautiful person I know. Let's make it official (again)."
                </p>
                <div className="mt-2 text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">— Your Decision</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative min-h-[80px] animate-fade-in delay-500">
                {/* YES BUTTON */}
                <button
                    onClick={handleYesClick}
                    disabled={isTransitioning}
                    className="group relative px-10 py-5 text-xl font-black text-white bg-gray-900 border-4 border-transparent hover:border-pastel-pink rounded-xl shadow-[8px_8px_0px_0px_rgba(248,200,220,1)] hover:shadow-[4px_4px_0px_0px_rgba(248,200,220,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 z-20 flex items-center gap-3 overflow-hidden animate-gentle-pulse disabled:opacity-70 disabled:cursor-wait"
                >
                    <span className="relative z-10">{isTransitioning ? "PROCESSING..." : "HELL YESSS"}</span>
                    <span className="text-2xl animate-bob">💍</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>

                {/* NO BUTTON */}
                <div 
                    style={{ 
                        transform: `translate(${noBtnPos.x}px, ${noBtnPos.y}px)`,
                        // Smoother transition
                        transition: 'transform 0.2s ease-out' 
                    }}
                    className="inline-block z-10"
                >
                    <button
                        ref={noBtnRef}
                        onClick={handleNoClick}
                        className="px-8 py-4 text-lg font-bold font-mono text-white bg-slate-700 rounded-full border-2 border-slate-600 shadow-xl hover:bg-rose-600 hover:border-rose-500 transition-colors whitespace-nowrap"
                    >
                        {hoverCount > 5 ? "HUHHHH" : "NO THANKS"}
                    </button>
                </div>
            </div>
        </div>
      </GlassCard>

      {/* Error Toast */}
      {showError && (
          <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50 animate-shake">
              <div className="bg-red-500 text-white px-6 py-3 rounded shadow-xl border-2 border-white flex items-center gap-3">
                  <span className="text-2xl">🚫</span>
                  <div>
                    <p className="font-bold font-mono">ERROR 69</p>
                    <p className="text-sm">Option 'No' does not exist anymore. Try next year</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};