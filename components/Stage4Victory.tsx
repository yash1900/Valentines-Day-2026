import React from 'react';
import { GlassCard } from './GlassCard';

export const Stage4Victory: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 z-20 relative">
      <GlassCard className="max-w-md w-full text-center border-0 shadow-2xl overflow-hidden relative !p-0">
        
        {/* Header - Success Badge */}
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIvPjwvc3ZnPg==')] opacity-30"></div>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase drop-shadow-sm font-mono">
                GREAT CHOICE!
            </h2>
            <div className="text-xs font-mono text-green-100 uppercase tracking-wider mt-1 opacity-80">
                Objective Complete • Target Acquired
            </div>
        </div>

        <div className="p-8 bg-white/80 backdrop-blur-md">
            
            {/* Main Celebration */}
            <div className="mb-8 relative">
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-60 animate-pulse"></div>
                 <div className="text-8xl animate-bounce relative z-10 filter drop-shadow-xl select-none">
                    💍
                 </div>
                 <div className="absolute -right-2 -top-2 text-4xl animate-pulse select-none" style={{animationDelay: '0.2s'}}>✨</div>
                 <div className="absolute -left-2 bottom-0 text-4xl animate-pulse select-none" style={{animationDelay: '0.5s'}}>🥂</div>
            </div>

            <h1 className="text-5xl font-black text-gray-800 mb-2 tracking-tight leading-none">
                SHE SAID <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">YES!</span>
            </h1>

            <p className="text-gray-600 font-mono text-sm mb-8">
                The baddie has been secured.
            </p>

            {/* Receipt / Stats */}
            <div className="bg-white border border-gray-200 rounded p-5 font-mono text-left text-sm text-gray-600 shadow-md transform -rotate-1 hover:rotate-0 transition-transform duration-300 relative mx-auto max-w-xs">
                {/* Punch Hole */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-600 shadow-inner"></div>
                
                <div className="flex justify-between border-b-2 border-dashed border-gray-200 pb-2 mb-3 text-xs font-bold text-gray-400">
                    <span>Our Story</span>
                    <span>STATUS</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span>The Wait</span>
                    <span className="text-green-600">Very Long</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span>Anxiety</span>
                    <span className="line-through text-gray-400">HIGH</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span>Love</span>
                    <span className="text-purple-600">INFINITE</span>
                </div>
                <div className="flex justify-between border-t-2 border-gray-800 pt-3 mt-3 font-bold text-gray-900 text-lg">
                    <span>DURATION</span>
                    <span>FOREVER</span>
                </div>
                
                {/* Stamp */}
                 <div className="absolute bottom-4 right-4 border-4 border-green-500/30 text-green-500/30 font-black text-xl px-2 py-1 transform -rotate-12 pointer-events-none">
                    APPROVED
                </div>
            </div>

        </div>

        {/* Footer Action */}
        <div className="bg-gray-50 p-4 border-t border-gray-100">
             <div className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                <span>📸</span>
                Please Screenshot as Evidence of Efforts
                <span>📸</span>
            </div>
        </div>

      </GlassCard>
    </div>
  );
};