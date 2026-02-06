import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GlassCard } from './GlassCard';

interface Stage2Props {
  onComplete: () => void;
}

// --- SPRITE CONFIGURATION ---
const SPRITE_URLS = {
    PLAYER: '/assets/romcom_avatar_pixel.png',   
    VAN: '/assets/pakdo_van_pixel.png',         
    CLEANING: '/assets/cleaning_icon.png',     
    COOKING: '/assets/cooking_icon.png',       
    BIRYANI: '/assets/biryani_icon.png', 
    FISH_THALI: '/assets/fish_thali_icon.png'    
};

// Game Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const BASE_SPEED = 6;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const GOAL_DISTANCE = 5000; 

// Story Beats
const STORY_BEATS = [
    { dist: 500, msg: "Fuck! My heels and locker keys!!" },
    { dist: 1500, msg: "I hope Pizzi will handle everything" },
    { dist: 3000, msg: "Eeji nhi hai mohini ka dance." },
    { dist: 4500, msg: "I am just a BABY!" }
];

export const Stage2Game: React.FC<Stage2Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  
  // Game Status Management
  const [gameStatus, setGameStatus] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY_RUN' | 'LEVEL_COMPLETE'>('START');
  const gameStatusRef = useRef<'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY_RUN' | 'LEVEL_COMPLETE'>('START');
  
  // Message System Refs
  const [message, setMessage] = useState<string | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagePriorityRef = useRef<number>(0); // 0: None, 1: Low (Powerup), 2: Medium (Story), 3: High (Hit)

  const requestRef = useRef<number>(0);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sprite Management
  const spritesRef = useRef<{ [key: string]: HTMLImageElement }>({});

  // Mutable Game State
  const gameState = useRef({
    player: { x: 150, y: 300, width: 40, height: 60, vy: 0, grounded: true },
    van: { x: -300, width: 160, height: 80 }, 
    obstacles: [] as { x: number, y: number, width: number, height: number, type: 'cleaning' | 'cooking', hit: boolean }[],
    powerups: [] as { x: number, y: number, width: number, height: number, type: 'biryani' | 'fishThali', collected: boolean }[],
    clouds: Array.from({ length: 6 }, (_, i) => ({
      x: i * 150,
      y: 30 + Math.random() * 80,
      size: 1 + Math.random()
    })),
    // Stars for the sky
    stars: Array.from({ length: 50 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * (GAME_HEIGHT * 0.6),
      size: Math.random() * 2 + 0.5,
      opacity: Math.random()
    })),
    // Layer 1: Far background skyline (moves slower)
    backSkyline: Array.from({ length: 12 }, (_, i) => ({
      x: i * 120,
      h: 100 + Math.random() * 100,
      w: 130,
      c: i % 2 === 0 ? '#cdb4db' : '#bde0fe' // Pastel purple/blue
    })),
    // Layer 2: Near skyline (moves faster) with details
    skyline: Array.from({ length: 20 }, (_, i) => {
        const h = 60 + Math.random() * 100;
        return {
          x: i * 60,
          h,
          w: 65,
          c: i % 2 === 0 ? '#a29bfe' : '#74b9ff', // Slightly deeper colors
          type: Math.random() > 0.7 ? 'spire' : (Math.random() > 0.5 ? 'slant' : 'flat'),
          // Windows grid
          lights: Array.from({ length: Math.floor(h / 15) }, () => 
             Array.from({ length: 3 }, () => Math.random() > 0.6)
          )
        };
    }),
    distance: 0,
    speed: BASE_SPEED,
    frames: 0,
    storyIndex: 0
  });

  // Preload Sprites with Debugging
  useEffect(() => {
    const loadImages = () => {
        Object.entries(SPRITE_URLS).forEach(([key, url]) => {
            const img = new Image();
            img.src = url;
            img.onload = () => console.log(`[Stage2] Successfully loaded sprite: ${key}`);
            img.onerror = () => console.warn(`[Stage2] Failed to load sprite: ${key}. Check path: ${url}`);
            spritesRef.current[key] = img;
        });
    };
    loadImages();
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSound = (type: 'jump' | 'collect' | 'hit' | 'win') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'jump') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start();
      osc.stop(now + 0.1);
    } else if (type === 'collect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start();
      osc.stop(now + 0.1);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start();
      osc.stop(now + 0.3);
    } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start();
        osc.stop(now + 0.6);
    }
  };

  const updateGameStatus = (status: 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY_RUN' | 'LEVEL_COMPLETE') => {
      setGameStatus(status);
      gameStatusRef.current = status;
  };

  // Message Logic with Priorities
  const showMessage = useCallback((text: string, duration: number, priority: number) => {
      // If a higher priority message is currently showing, ignore this new one
      if (messagePriorityRef.current > priority) {
          return;
      }

      // Clear existing timer to prevent premature clearing
      if (messageTimerRef.current) {
          clearTimeout(messageTimerRef.current);
      }

      setMessage(text);
      messagePriorityRef.current = priority;

      messageTimerRef.current = setTimeout(() => {
          setMessage(null);
          messagePriorityRef.current = 0; // Reset priority when message clears
          messageTimerRef.current = null;
      }, duration);
  }, []);

  const startGame = () => {
      updateGameStatus('PLAYING');
      gameState.current = {
        player: { x: 150, y: 300, width: 40, height: 60, vy: 0, grounded: true },
        van: { x: -300, width: 160, height: 80 },
        obstacles: [],
        powerups: [],
        clouds: gameState.current.clouds,
        backSkyline: gameState.current.backSkyline,
        stars: gameState.current.stars,
        skyline: gameState.current.skyline,
        distance: 0,
        speed: BASE_SPEED,
        frames: 0,
        storyIndex: 0
      };
      setScore(0);
      
      // Reset Messages
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      messagePriorityRef.current = 0;
      setMessage(null);
  };

  const jump = useCallback(() => {
    const status = gameStatusRef.current;
    if (status === 'PLAYING' && gameState.current.player.grounded) {
      gameState.current.player.vy = JUMP_FORCE;
      gameState.current.player.grounded = false;
      playSound('jump');
    } else if (status === 'START' || status === 'GAMEOVER') {
        initAudio();
        startGame();
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      jump();
    }
  }, [jump]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, [handleKeyDown]);

  // --- DRAWING FUNCTIONS ---

  const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => {
    ctx.save();
    ctx.font = 'bold 14px "Courier New"';
    const metrics = ctx.measureText(text);
    const padding = 6;
    const bgW = metrics.width + padding * 2;
    const bgH = 22;
    
    // Position centered above x, y
    // y is usually the top of the sprite, so we move up
    const boxX = x - bgW / 2;
    const boxY = y - bgH - 5; // 5px gap from sprite
    
    // Draw Pill Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    // Manual round rect for broad browser support
    const r = 4;
    ctx.moveTo(boxX + r, boxY);
    ctx.lineTo(boxX + bgW - r, boxY);
    ctx.quadraticCurveTo(boxX + bgW, boxY, boxX + bgW, boxY + r);
    ctx.lineTo(boxX + bgW, boxY + bgH - r);
    ctx.quadraticCurveTo(boxX + bgW, boxY + bgH, boxX + bgW - r, boxY + bgH);
    ctx.lineTo(boxX + r, boxY + bgH);
    ctx.quadraticCurveTo(boxX, boxY + bgH, boxX, boxY + bgH - r);
    ctx.lineTo(boxX, boxY + r);
    ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // Draw Text
    ctx.fillStyle = '#2d3436';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, boxY + bgH/2 + 1); // +1 for optical centering
    ctx.restore();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number, grounded: boolean) => {
      // SPRITE RENDER
      const img = spritesRef.current.PLAYER;
      if (img && img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, x, y, w, h);
          return;
      }

      // FALLBACK RENDER
      const pw = w / 10;
      const ph = h / 14;
      const skin = '#eebb99';
      const hair = '#2d1a10';
      const topPink = '#ffc0cb'; 
      const skirtPink = '#ffb7c5';
      const skirtGreen = '#a8e6cf';
      const gold = '#ffd700';

      ctx.fillStyle = hair;
      ctx.fillRect(x + 1*pw, y + 1*ph, 8*pw, 6*ph); 
      ctx.fillStyle = skin;
      ctx.fillRect(x + 3*pw, y + 1*ph, 4*pw, 3*ph);
      ctx.fillRect(x + 4*pw, y + 4*ph, 2*pw, 1*ph);
      ctx.fillRect(x + 3.5*pw, y + 7*ph, 3*pw, 1.5*ph);
      const swing = grounded ? Math.sin(frame * 0.2) * pw : -pw;
      ctx.fillRect(x + 1*pw, y + 5*ph + swing, 2*pw, 5*ph);
      ctx.fillRect(x + 7*pw, y + 5*ph - swing, 2*pw, 5*ph);
      ctx.fillStyle = topPink;
      ctx.fillRect(x + 2.5*pw, y + 5*ph, 5*pw, 2.5*ph);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 4*pw, y + 4.5*ph, 2*pw, 0.5*ph);
      const skirtY = y + 8.5*ph;
      const skirtH = 5.5*ph;
      ctx.fillStyle = skirtPink;
      ctx.fillRect(x + 1*pw, skirtY, 3*pw, skirtH);
      ctx.fillStyle = skirtGreen;
      ctx.fillRect(x + 4*pw, skirtY, 2*pw, skirtH);
      ctx.fillStyle = skirtPink;
      ctx.fillRect(x + 6*pw, skirtY, 3*pw, skirtH);
      ctx.fillStyle = gold;
      ctx.fillRect(x + 1*pw, skirtY + skirtH - 0.5*ph, 8*pw, 0.5*ph);
      ctx.fillStyle = skirtGreen;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x + 6*pw, y + 5*ph, 2*pw, 6*ph);
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 4*pw, y + 2*ph, 0.5*pw, 0.5*ph);
      ctx.fillRect(x + 5.5*pw, y + 2*ph, 0.5*pw, 0.5*ph);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(x + 4.5*pw, y + 3*ph, 1*pw, 0.5*ph);
  };

  const drawVan = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      // SPRITE RENDER
      const img = spritesRef.current.VAN;
      if (img && img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, x, y, w, h);
          return;
      }

      // FALLBACK RENDER
      const unit = w / 20;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x + unit, y + h - 5, w - unit, 5);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x, y + h * 0.35, w, h * 0.55);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.2, y + h * 0.35);
      ctx.lineTo(x + w * 0.25, y);
      ctx.lineTo(x + w * 0.95, y);
      ctx.lineTo(x + w, y + h * 0.35);
      ctx.fill();
      ctx.fillRect(x + w * 0.25, y, w * 0.7, h * 0.35);
      ctx.fillStyle = '#34495e';
      ctx.fillRect(x + w * 0.35, y + h * 0.05, w * 0.2, h * 0.25);
      ctx.fillRect(x + w * 0.6, y + h * 0.05, w * 0.3, h * 0.25);
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.moveTo(x + w, y + h * 0.35);
      ctx.lineTo(x + w * 0.95, y);
      ctx.lineTo(x + w * 0.8, y + h * 0.35);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y + h * 0.45, w, 2);
      ctx.fillStyle = '#000';
      const wheelS = h * 0.35;
      const wheelY = y + h - wheelS * 0.5;
      ctx.beginPath();
      ctx.arc(x + w * 0.25, wheelY, wheelS/2, 0, Math.PI * 2);
      ctx.arc(x + w * 0.75, wheelY, wheelS/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bdc3c7';
      ctx.beginPath();
      ctx.arc(x + w * 0.25, wheelY, wheelS/3, 0, Math.PI * 2);
      ctx.arc(x + w * 0.75, wheelY, wheelS/3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.moveTo(x + w, y + h*0.5);
      ctx.lineTo(x + w - 10, y + h*0.4);
      ctx.lineTo(x + w, y + h*0.6);
      ctx.fill();
  };

  const drawStartScreen = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText("VIDEO CALL WITH MOM", GAME_WIDTH/2, GAME_HEIGHT/2 - 40);
      
      ctx.font = '16px Courier New';
      ctx.fillText("Press SPACE to Jump", GAME_WIDTH/2, GAME_HEIGHT/2);
      ctx.fillText("Collect Biryani/Fish Thali to Speed Up", GAME_WIDTH/2, GAME_HEIGHT/2 + 25);
      ctx.fillText("Avoid Cooking/Cleaning or kidnappers will catch you!", GAME_WIDTH/2, GAME_HEIGHT/2 + 50);
      
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 20px Courier New';
      ctx.fillText("[ PRESS SPACE TO START ]", GAME_WIDTH/2, GAME_HEIGHT/2 + 100);
  };

  const drawBiryani = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Label
    drawLabel(ctx, "BIRYANI", x + 20, y);

    // SPRITE RENDER
    const img = spritesRef.current.BIRYANI;
    if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, x, y, 40, 40); // Size fixed at 40x40 in logic
        return;
    }

    // FALLBACK
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 25, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x, y + 25, 40, 10);
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 18, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 15);
    ctx.quadraticCurveTo(x + 10, y + 5, x + 25, y + 10);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 25, y + 10);
    ctx.lineTo(x + 30, y + 5);
    ctx.stroke();
  };

  const drawFishThali = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Label
    drawLabel(ctx, "FISH THALI", x + 20, y);

    // SPRITE RENDER
    const img = spritesRef.current.FISH_THALI;
    if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, x, y, 40, 40);
        return;
    }

    // FALLBACK (Plate with Fish)
    // Plate
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Fish
    ctx.fillStyle = '#e67e22'; // Cooked orange
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 20, 12, 6, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + 26, y + 15, 2, 0, Math.PI * 2);
    ctx.fill();

    // Small Katoris (bowls)
    ctx.fillStyle = '#f1c40f'; // Dal
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#27ae60'; // Sabzi
    ctx.beginPath();
    ctx.arc(x + 30, y + 30, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawCleaning = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    // Label
    drawLabel(ctx, "CLEANING", x + w/2, y);

    // SPRITE RENDER
    const img = spritesRef.current.CLEANING;
    if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, x, y, w, h);
        return;
    }

    // FALLBACK (Broom)
    const centerX = x + w / 2;
    
    // Handle
    ctx.fillStyle = '#8d6e63'; // Wood
    ctx.fillRect(centerX - 3, y, 6, h * 0.6);
    
    // Bristles Holder
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(centerX - 10, y + h * 0.6, 20, 5);

    // Bristles
    ctx.fillStyle = '#f1c40f'; // Straw
    ctx.beginPath();
    ctx.moveTo(centerX - 10, y + h * 0.6 + 5);
    ctx.lineTo(centerX + 10, y + h * 0.6 + 5);
    ctx.lineTo(centerX + 15, y + h);
    ctx.lineTo(centerX - 15, y + h);
    ctx.fill();
    
    // Bristle lines
    ctx.strokeStyle = '#d4ac0d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, y + h * 0.6 + 5);
    ctx.lineTo(centerX, y + h);
    ctx.moveTo(centerX - 5, y + h * 0.6 + 5);
    ctx.lineTo(centerX - 7, y + h);
    ctx.moveTo(centerX + 5, y + h * 0.6 + 5);
    ctx.lineTo(centerX + 7, y + h);
    ctx.stroke();
  };

  const drawCooking = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    // Label
    drawLabel(ctx, "COOKING", x + w/2, y);

    // SPRITE RENDER
    const img = spritesRef.current.COOKING;
    if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, x, y, w, h);
        return;
    }

    // FALLBACK (Pot on Stove)
    const potY = y + h * 0.4;
    const potH = h * 0.5;
    
    // Pot
    ctx.fillStyle = '#7f8c8d'; // Metal
    ctx.fillRect(x + 5, potY, w - 10, potH);
    ctx.strokeRect(x + 5, potY, w - 10, potH);
    
    // Handles
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x, potY + 5, 5, 10);
    ctx.fillRect(x + w - 5, potY + 5, 5, 10);
    
    // Lid
    ctx.fillStyle = '#95a5a6';
    ctx.beginPath();
    ctx.ellipse(x + w/2, potY, w/2 - 5, 5, 0, Math.PI, 0); // Top curve
    ctx.fill();
    ctx.stroke();
    // Lid Knob
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + w/2 - 3, potY - 8, 6, 8);

    // Steam bubbles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(x + w/2 - 5, y + h * 0.2, 3, 0, Math.PI*2);
    ctx.arc(x + w/2 + 5, y + h * 0.1, 4, 0, Math.PI*2);
    ctx.fill();
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Using ref for loop logic avoids stale closure
    const currentStatus = gameStatusRef.current;
    const state = gameState.current;

    // --- STATIC RENDER (START) ---
    if (currentStatus === 'START') {
        // Clear
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        // Gradient Sky
        const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        grad.addColorStop(0, '#a29bfe');
        grad.addColorStop(1, '#f8c8dc');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#bcece0'; ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);
        drawPlayer(ctx, 150, 300, 40, 60, 0, true);
        drawVan(ctx, -200, 300, 160, 80);
        drawStartScreen(ctx);
        requestRef.current = requestAnimationFrame(gameLoop);
        return;
    }

    if (currentStatus === 'LEVEL_COMPLETE') {
       // Stop loop, UI takes over
       return; 
    }

    // --- GAME OVER RENDER ---
    if (currentStatus === 'GAMEOVER') {
        // Overlay only
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText("KIDNAPPED & CAUGHT BY MOM", GAME_WIDTH/2, GAME_HEIGHT/2 - 20);
        ctx.font = '20px Courier New';
        ctx.fillText("I don't know which is worse. Press SPACE.", GAME_WIDTH/2, GAME_HEIGHT/2 + 30);
        requestRef.current = requestAnimationFrame(gameLoop);
        return;
    }

    // --- PLAYING LOGIC ---

    // Clear
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 1. Background
    
    // Gradient Sky
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#6c5ce7'); // Darker top
    grad.addColorStop(1, '#ffc0cb'); // Sunset pink bottom
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Stars (Parallax 0.02)
    state.stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        const starShift = (state.distance * 0.02) % GAME_WIDTH;
        let drawX = star.x - starShift;
        if (drawX < 0) drawX += GAME_WIDTH;
        
        ctx.beginPath();
        ctx.arc(drawX, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Twinkle
        if (Math.random() > 0.95) star.opacity = Math.random();
    });

    // Clouds (Speed 0.05) - Slower than player
    const cloudShift = (state.distance * 0.05) % (GAME_WIDTH + 200);
    state.clouds.forEach(cloud => {
        let drawX = cloud.x - cloudShift;
        if (drawX < -150) drawX += (GAME_WIDTH + 200);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        const s = 15 * cloud.size;
        ctx.fillRect(drawX, cloud.y, s * 3, s);
        ctx.fillRect(drawX + s * 0.5, cloud.y - s, s * 2, s);
    });

    // Back Skyline (Speed 0.2) - Intermediate background
    const backSkylineShift = (state.distance * 0.2) % (state.backSkyline.length * 120);
    state.backSkyline.forEach(b => {
        let drawX = b.x - backSkylineShift;
        const totalW = state.backSkyline.length * 120;
        if (drawX < -150) drawX += totalW;
        if (drawX > -150 && drawX < GAME_WIDTH) {
            ctx.fillStyle = b.c;
            ctx.fillRect(drawX, GAME_HEIGHT - 50 - b.h, b.w, b.h);
        }
    });

    // Front Skyline (Speed 0.5) - Near background with Details
    const skylineShift = (state.distance * 0.5) % (state.skyline.length * 60);
    state.skyline.forEach(b => {
        let drawX = b.x - skylineShift;
        const totalW = state.skyline.length * 60;
        if (drawX < -100) drawX += totalW;
        
        if (drawX > -100 && drawX < GAME_WIDTH) {
            const yPos = GAME_HEIGHT - 50 - b.h;
            
            // Base Building
            ctx.fillStyle = b.c;
            ctx.fillRect(drawX, yPos, b.w, b.h);

            // Roof Types
            if (b.type === 'spire') {
                ctx.beginPath();
                ctx.moveTo(drawX + 10, yPos);
                ctx.lineTo(drawX + b.w / 2, yPos - 20);
                ctx.lineTo(drawX + b.w - 10, yPos);
                ctx.fill();
                ctx.fillRect(drawX + b.w/2 - 2, yPos - 35, 4, 15); // Antenna
            } else if (b.type === 'slant') {
                 ctx.beginPath();
                 ctx.moveTo(drawX, yPos);
                 ctx.lineTo(drawX + b.w, yPos - 15);
                 ctx.lineTo(drawX + b.w, yPos);
                 ctx.fill();
            }

            // Windows / Lights
            ctx.fillStyle = '#ffeaa7'; // Warm light color
            const cellW = b.w / 3;
            const cellH = 15;
            
            if (b.lights) {
                b.lights.forEach((row, ri) => {
                    row.forEach((on, ci) => {
                        if (on) {
                             ctx.fillRect(drawX + 5 + (ci * 18), yPos + 10 + (ri * 15), 10, 8);
                        }
                    });
                });
            }
            
            // Side highlight for 3D effect
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(drawX, yPos, 5, b.h);
        }
    });

    // Ground
    ctx.fillStyle = '#bcece0';
    ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);
    ctx.fillStyle = '#a29bfe';
    ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 4);

    // Road Lines
    const roadOffset = state.distance % 150;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < GAME_WIDTH / 150 + 1; i++) {
        const rx = (i * 150) - roadOffset;
        if (rx > -50 && rx < GAME_WIDTH) ctx.fillRect(rx, GAME_HEIGHT - 25, 60, 8);
    }

    // 2. Physics & Logic (If playing or victory run)
    state.player.vy += GRAVITY;
    state.player.y += state.player.vy;
    if (state.player.y + state.player.height > GAME_HEIGHT - 50) {
      state.player.y = GAME_HEIGHT - 50 - state.player.height;
      state.player.vy = 0;
      state.player.grounded = true;
    }

    if (currentStatus === 'VICTORY_RUN') {
        // Auto run to the right
        state.player.x += 5;
        state.distance += state.speed; 
        state.frames++;
        
        // Van slows down
        state.van.x -= 2;

        if (state.player.x > GAME_WIDTH + 100) {
            updateGameStatus('LEVEL_COMPLETE');
            // Force re-render to show UI
            setGameStatus('LEVEL_COMPLETE');
            return;
        }
    } else {
        // Normal Playing Logic
        state.distance += state.speed;
        state.frames++;
        setScore(Math.floor(state.distance));

        // Check Victory
        if (state.distance > GOAL_DISTANCE) {
            playSound('win');
            updateGameStatus('VICTORY_RUN');
        }

        // Story Beats
        if (state.storyIndex < STORY_BEATS.length) {
            if (state.distance > STORY_BEATS[state.storyIndex].dist) {
                // Priority 2: Story (3 seconds)
                showMessage(STORY_BEATS[state.storyIndex].msg, 3000, 2);
                state.storyIndex++;
            }
        }

        // Van Creep
        const vanCreep = 0.3 + (state.distance / GOAL_DISTANCE) * 0.5;
        state.van.x += vanCreep;

        // Check Game Over
        if (state.van.x + state.van.width > state.player.x + 10) { 
            updateGameStatus('GAMEOVER');
            playSound('hit');
            requestRef.current = requestAnimationFrame(gameLoop);
            return;
        }
        
        // Spawning (Only if not victory run)
        if (state.frames % 100 === 0) {
          if (Math.random() > 0.4) {
            state.obstacles.push({
              x: GAME_WIDTH,
              y: GAME_HEIGHT - 50 - 60,
              width: 40,
              height: 60,
              type: Math.random() > 0.5 ? 'cleaning' : 'cooking',
              hit: false
            });
          } else {
             state.powerups.push({
                x: GAME_WIDTH,
                y: GAME_HEIGHT - 150 - (Math.random() * 120),
                width: 40,
                height: 40,
                type: Math.random() > 0.5 ? 'biryani' : 'fishThali',
                collected: false
             });
          }
        }
    }

    // Process Entities (Move existing ones even in victory run)
    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const obs = state.obstacles[i];
      obs.x -= state.speed;
      
      // Hit detection only if playing
      if (currentStatus === 'PLAYING' && !obs.hit &&
        state.player.x < obs.x + obs.width &&
        state.player.x + state.player.width > obs.x &&
        state.player.y < obs.y + obs.height &&
        state.player.y + state.player.height > obs.y
      ) {
        state.van.x += 200; 
        obs.hit = true;
        playSound('hit');
        state.obstacles.splice(i, 1);
        // Priority 3: Hit/Critical (1.5 seconds)
        showMessage("TRIPPED! THEY'RE GETTING CLOSER!", 1500, 3);
      }
      if (obs.x + obs.width < -100) state.obstacles.splice(i, 1);
    }

    for (let i = state.powerups.length - 1; i >= 0; i--) {
      const pup = state.powerups[i];
      pup.x -= state.speed;
      
      if (currentStatus === 'PLAYING' && !pup.collected &&
        state.player.x < pup.x + pup.width &&
        state.player.x + state.player.width > pup.x &&
        state.player.y < pup.y + pup.height &&
        state.player.y + state.player.height > pup.y
      ) {
        state.van.x -= 150;
        if(state.van.x < -600) state.van.x = -600;
        pup.collected = true;
        playSound('collect');
        state.powerups.splice(i, 1);
        const msgs = ["TASTYY!", "YUMMYY!"];
        // Priority 1: Ambient/Powerup (1 second) - Will NOT interrupt story
        showMessage(msgs[Math.floor(Math.random()*msgs.length)], 1000, 1);
      }
      if (pup.x + pup.width < -100) state.powerups.splice(i, 1);
    }

    // Render Entities
    drawPlayer(ctx, state.player.x, state.player.y, state.player.width, state.player.height, state.frames, state.player.grounded);
    
    // Only draw label if player is on screen
    if (state.player.x < GAME_WIDTH) {
        ctx.font = '10px Courier New';
        ctx.fillStyle = '#2d3436';
        ctx.textAlign = 'left';
        ctx.fillText('ROMCOM', state.player.x - 5, state.player.y - 10);
    }

    const vanBounce = Math.floor(Math.sin(state.frames * 0.8) * 2);
    drawVan(ctx, state.van.x, GAME_HEIGHT - 50 - state.van.height + 10 + vanBounce, state.van.width, state.van.height);
    
    // Bubble (Only if playing)
    if (currentStatus === 'PLAYING') {
        const distToPlayer = state.player.x - (state.van.x + state.van.width);
        
        // Show when van is relatively close (within 400px)
        if (distToPlayer < 400) {
            // Blink effect: Faster blinking as it gets closer
            const blinkSpeed = distToPlayer < 150 ? 10 : 30; // Frames per toggle
            const showBubble = Math.floor(state.frames / blinkSpeed) % 2 === 0;

            if (showBubble) {
                ctx.save();
                
                // Position bubble above the van
                const bubbleW = 140;
                const bubbleH = 40;
                const bubbleX = state.van.x + state.van.width / 2; 
                const bubbleY = GAME_HEIGHT - 50 - state.van.height - 30; // Above van

                // Draw Speech Bubble Shape
                ctx.beginPath();
                ctx.fillStyle = 'white';
                ctx.strokeStyle = '#2d3436';
                ctx.lineWidth = 3;
                
                // Draw rounded rectangle with pointer at bottom
                const r = 10; // radius
                const x = bubbleX - bubbleW / 2;
                const y = bubbleY - bubbleH / 2;
                const w = bubbleW;
                const h = bubbleH;

                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w - r, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r);
                ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                // Pointer
                ctx.lineTo(x + w / 2 + 10, y + h);
                ctx.lineTo(x + w / 2, y + h + 15); // Point tip
                ctx.lineTo(x + w / 2 - 10, y + h);
                
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                
                ctx.fill();
                ctx.stroke();

                // Text styling
                ctx.fillStyle = '#d63031'; // Urgent Red
                ctx.font = 'bold 14px "Courier New"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Dynamic Text based on closeness
                let text = "PAKDO! PAKDO!";
                if (distToPlayer > 250) {
                   text = "STOP HER!"; 
                }
                
                ctx.fillText(text, bubbleX, bubbleY);
                ctx.restore();
            }
        }
    }

    state.obstacles.forEach(obs => {
        if (obs.type === 'cleaning') drawCleaning(ctx, obs.x, obs.y, obs.width, obs.height);
        else drawCooking(ctx, obs.x, obs.y, obs.width, obs.height);
    });

    state.powerups.forEach(pup => {
        if (pup.type === 'biryani') drawBiryani(ctx, pup.x, pup.y);
        else drawFishThali(ctx, pup.x, pup.y);
    });

    // HUD
    ctx.fillStyle = '#2d3436';
    ctx.font = '20px Courier New';
    ctx.textAlign = 'left'; 
    
    const displayDist = Math.min(Math.floor(state.distance), GOAL_DISTANCE);
    ctx.fillText(`Distance: ${displayDist}m`, 20, 30);
    
    const progress = Math.min(state.distance / GOAL_DISTANCE, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(20, 40, 200, 10);
    ctx.fillStyle = '#6c5ce7';
    ctx.fillRect(20, 40, 200 * progress, 10);
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 40, 200, 10);

    ctx.font = '12px Courier New';
    ctx.fillText("KINGS", 180, 65);

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
        {message && (
            <div className="absolute top-1/4 animate-bounce text-xl md:text-2xl font-bold text-pastel-dark bg-white/90 px-6 py-4 rounded-lg backdrop-blur-sm z-10 border-4 border-pastel-pink shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-center max-w-lg">
                {message}
            </div>
        )}

        <GlassCard className="p-2 relative">
            <div className="relative">
                <canvas 
                    ref={canvasRef} 
                    width={GAME_WIDTH} 
                    height={GAME_HEIGHT}
                    className="bg-white/30 rounded shadow-inner cursor-none"
                />
            </div>
            
            {/* Level Complete Overlay */}
            {gameStatus === 'LEVEL_COMPLETE' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded">
                    <div className="bg-white p-8 rounded-lg border-4 border-pastel-mint shadow-2xl max-w-md text-center animate-fade-in">
                        <div className="text-4xl mb-4">🏠 💖</div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2 font-mono">REACHED KINGS APARTMENT</h2>
                        <p className="text-gray-600 mb-6 font-mono text-sm">
                            You've made it on time for the video call. Your relationship was SAVED.
                        </p>
                        <button 
                            onClick={onComplete}
                            className="w-full py-4 bg-pastel-dark text-white font-bold font-mono rounded hover:bg-black transition-colors"
                        >
                            KISS SITCOM &rarr;
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-4 flex justify-between text-sm font-mono text-gray-700 font-bold">
                <span>KEYS: SPACE / UP to Jump</span>
                <span>DISTANCE: {GOAL_DISTANCE}m</span>
            </div>
        </GlassCard>
    </div>
  );
};