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

    const threshold = 200; // Increased radius
    const dist = Math.hypot(mouseX - btnCenterX, mouseY - btnCenterY);

    if (dist < threshold) {
        setHoverCount(prev => prev + 1);
        
        // 1. Calculate base angle away from mouse
        const deltaX = btnCenterX - mouseX;
        const deltaY = btnCenterY - mouseY;
        let angle = Math.atan2(deltaY, deltaX);
        
        // 2. Add organic jitter (Random variance +/- 45 degrees)
        // This makes it feel like it's "panicking" rather than just mathematically repelling
        const jitter = (Math.random() - 0.5) * (Math.PI / 2); 
        angle += jitter;

        // 3. Dynamic force based on how close the mouse is
        // Closer mouse = bigger jump
        const proximityFactor = Math.pow((threshold - dist) / threshold, 2); // Exponential curve
        const force = 40 + (proximityFactor * 120); 
        
        let moveX = Math.cos(angle) * force;
        let moveY = Math.sin(angle) * force;

        // 4. Edge Avoidance & "Bounce" Logic
        const padding = 100; // Keep it further from edges
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        
        // Where would it end up?
        const nextLeft = rect.left + moveX;
        const nextRight = rect.right + moveX;
        const nextTop = rect.top + moveY;
        const nextBottom = rect.bottom + moveY;

        // If hitting an edge, reverse that component strongly and add random scatter
        if (nextLeft < padding) {
             moveX = Math.abs(moveX) + 40; 
        } else if (nextRight > winW - padding) {
             moveX = -Math.abs(moveX) - 40;
        }

        if (nextTop < padding) {
             moveY = Math.abs(moveY) + 40;
        } else if (nextBottom > winH - padding) {
             moveY = -Math.abs(moveY) - 40;
        }

        // 5. Center Gravity (Soft leash)
        // If it gets too far into corners, gently pull it back towards center
        const centerX = winW / 2;
        const centerY = winH / 2;
        const distToCenter = Math.hypot(centerX - btnCenterX, centerY - btnCenterY);
        
        if (distToCenter > Math.min(winW, winH) * 0.4) {
            const angleToCenter = Math.atan2(centerY - btnCenterY, centerX - btnCenterX);
            // Stronger pull back if very far
            const pullStrength = (distToCenter / (Math.min(winW, winH) * 0.4)) * 15;
            moveX += Math.cos(angleToCenter) * pullStrength;
            moveY += Math.sin(angleToCenter) * pullStrength;
        }

        // 6. Micro-movements (nervous shaking)
        moveX += (Math.random() - 0.5) * 10;
        moveY += (Math.random() - 0.5) * 10;

        setNoBtnPos(prev => ({
            x: prev.x + moveX,
            y: prev.y + moveY
        }));
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
        className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden"
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

      <GlassCard className={`max-w-2xl w-full text-center relative z-10 !p-0 overflow-hidden border-0 shadow-2xl transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Header Section */}
        <div className="bg-pastel-lavender p-6 border-b-4 border-white/50 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pastel-pink via-pastel-blue to-pastel-mint"></div>
            <h2 className="text-xl font-mono font-bold text-gray-500 tracking-widest uppercase mb-2">
                Mission Report: Final Stage
            </h2>
            <div className="inline-block px-4 py-1 bg-white/50 rounded-full border border-white">
                <span className="text-sm font-bold text-pastel-dark">STATUS: PENDING DECISION</span>
            </div>
        </div>

        {/* Main Content */}
        <div className="p-8 md:p-12 bg-white/40 backdrop-blur-sm relative">
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
                        Agent ROMCOM
                    </span>
                    <span className="absolute -top-3 -right-3 text-3xl animate-bob">🎀</span>
                </div>
            </div>
            
            <div className="bg-white/60 p-6 rounded-lg border-2 border-dashed border-pastel-dark/30 mb-10 transform rotate-1 hover:rotate-0 transition-transform duration-300 animate-fade-in delay-300">
                <p className="text-lg text-gray-700 font-mono leading-relaxed">
                  "4 years in and you're still the funniest, smartest, and most beautiful person I know. Let's make it official (again)."
                </p>
                <div className="mt-2 text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">— Classified Intel</span>
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
                    <span className="relative z-10">{isTransitioning ? "PROCESSING..." : "ACCEPT MISSION"}</span>
                    <span className="text-2xl animate-bob">💍</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>

                {/* NO BUTTON */}
                <div 
                    style={{ 
                        transform: `translate(${noBtnPos.x}px, ${noBtnPos.y}px)`,
                        transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)' // Faster, smoother spring-like feel
                    }}
                    className="inline-block z-10"
                >
                    <button
                        ref={noBtnRef}
                        onClick={handleNoClick}
                        className="px-6 py-3 text-sm font-bold font-mono text-gray-400 bg-gray-100 rounded-lg border border-gray-200 hover:bg-red-50 hover:text-red-400 transition-colors whitespace-nowrap cursor-not-allowed"
                    >
                        {hoverCount > 5 ? "Seriously?" : "Decline"}
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
                    <p className="font-bold font-mono">ERROR 404</p>
                    <p className="text-sm">Option 'No' has been disabled by the administration.</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};