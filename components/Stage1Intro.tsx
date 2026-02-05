import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';

interface Stage1Props {
  onComplete: () => void;
}

export const Stage1Intro: React.FC<Stage1Props> = ({ onComplete }) => {
  const [clickCount, setClickCount] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [text, setText] = useState("MISSION BRIEF: You are trapped at a boring family function. The 'Rishta Aunties' have spotted you.");

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    setShaking(true);

    // Audio cue simulation
    playBeep(200 + newCount * 100, 'square', 0.1);

    if (newCount === 1) {
      setText("They are approaching with photos of 'Good Boys' from LinkedIn. Panic levels rising.");
    } else if (newCount === 2) {
      setText("The Black Van is pulling up outside. They want to take you to a 'Meet & Greet'.");
    } else if (newCount >= 3) {
      setText("ESCAPE VEHICLE READY! RUN FOR YOUR LIFE!");
      setTimeout(onComplete, 1500);
    }

    setTimeout(() => setShaking(false), 500);
  };

  // Simple beep synthesis
  const playBeep = (freq: number, type: OscillatorType, duration: number) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio not supported");
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto p-4 transition-transform duration-100 ${shaking ? 'animate-shake' : ''}`}>
      <GlassCard className="text-center relative overflow-hidden border-4 border-pastel-dark">
        <h1 className="text-4xl font-black text-pastel-dark mb-6 font-mono tracking-tighter uppercase">
          Objective: Survive
        </h1>
        
        <div className="mb-8 min-h-[80px] flex items-center justify-center">
           <span className="text-xl text-gray-800 font-mono font-bold leading-relaxed bg-white/50 p-4 rounded shadow-inner">
            {text}
           </span>
        </div>

        <div className="relative z-10">
          <button
            onClick={handleClick}
            disabled={clickCount >= 3}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-gray-900 font-mono focus:outline-none border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clickCount < 3 ? '🍸 DOWN THE VODKA' : '🏃‍♀️ START RUNNING!'}
          </button>
        </div>

        <div className="mt-8 text-xs font-mono text-gray-500 uppercase tracking-widest">
          Courage Meter: {clickCount}/3
        </div>
      </GlassCard>

      {/* Decorative party elements */}
      <div className="absolute top-10 left-10 text-6xl animate-float opacity-80">💍</div>
      <div className="absolute bottom-20 right-10 text-6xl animate-float opacity-80" style={{animationDelay: '1s'}}>🙅‍♀️</div>
    </div>
  );
};