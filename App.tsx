import React, { useState, useEffect } from 'react';
import { Stage1Intro } from './components/Stage1Intro';
import { Stage2Game } from './components/Stage2Game';
import { Stage3Proposal } from './components/Stage3Proposal';
import { Stage4Victory } from './components/Stage4Victory';
import { GameStage } from './types';

// Simple confetti using canvas
const Confetti: React.FC = () => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: any[] = [];
        const colors = ['#bcece0', '#d6cdea', '#f8c8dc', '#fbf8cc', '#a2d2ff'];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                r: Math.random() * 6 + 2,
                d: Math.random() * 20 + 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
                tiltAngle: 0
            });
        }

        let animationId: number;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.tiltAngle += p.tiltAngleIncremental;
                p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
                p.x += Math.sin(0);
                p.tilt = Math.sin(p.tiltAngle) * 15;

                if (p.y > canvas.height) {
                    p.x = Math.random() * canvas.width;
                    p.y = -10;
                }

                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + (p.r / 2), p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + (p.r / 2));
                ctx.stroke();
            });
            animationId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationId);
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

const App: React.FC = () => {
  const [stage, setStage] = useState<GameStage>(GameStage.INTRO);

  return (
    <div className="mesh-bg w-screen h-screen overflow-hidden font-sans text-gray-900 relative">
      {/* Global Background Audio Player - Hidden */}
      
      <main className="w-full h-full relative z-10">
        {stage === GameStage.INTRO && (
          <Stage1Intro onComplete={() => setStage(GameStage.GAME)} />
        )}
        
        {stage === GameStage.GAME && (
          <Stage2Game onComplete={() => setStage(GameStage.PROPOSAL)} />
        )}
        
        {stage === GameStage.PROPOSAL && (
          <Stage3Proposal onYes={() => setStage(GameStage.VICTORY)} />
        )}

        {stage === GameStage.VICTORY && (
            <>
                <Confetti />
                <Stage4Victory />
            </>
        )}
      </main>
      
      <footer className="absolute bottom-2 w-full text-center text-xs text-gray-500 font-mono opacity-50 z-0">
        SANCHI: Why dont you love me?
      </footer>
    </div>
  );
};

export default App;