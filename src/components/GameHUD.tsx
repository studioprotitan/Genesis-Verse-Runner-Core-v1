import React, { useEffect, useState, useRef } from 'react';
import { Shield, Sparkles, Terminal, Heart, Zap, Play, Pause, Home, RotateCcw, Volume2, VolumeX, Eye, Info, Magnet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerState, GameState, Lane } from '../types';

interface ToastMessage {
  id: string;
  title: string;
  subtitle: string;
  type: 'milestone' | 'info' | 'combo';
}

interface GameHUDProps {
  playerState: PlayerState;
  gameState: GameState;
  onStartGame: () => void;
  onRestartGame: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  selectedClass: string;
  onPauseToggle: () => void;
  onQuitGame: () => void;
}

export function GameHUD({
  playerState,
  gameState,
  onStartGame,
  onRestartGame,
  onToggleMute,
  isMuted,
  selectedClass,
  onPauseToggle,
  onQuitGame
}: GameHUDProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const lastCoinsRef = useRef<number>(0);
  const lastDistanceRef = useRef<number>(0);
  const lastComboRef = useRef<number>(0);

  useEffect(() => {
    if (gameState !== GameState.PLAYING) {
      lastCoinsRef.current = playerState.coins;
      lastDistanceRef.current = Math.floor(playerState.distance);
      lastComboRef.current = playerState.comboCount || 0;
      return;
    }

    const currentCoins = playerState.coins;
    const currentDistance = Math.floor(playerState.distance);
    const currentCombo = playerState.comboCount || 0;

    // 1. Coin Milestones (Every 50 coins)
    const coinMilestoneIndex = Math.floor(currentCoins / 50);
    const lastCoinMilestoneIndex = Math.floor(lastCoinsRef.current / 50);
    if (coinMilestoneIndex > lastCoinMilestoneIndex && coinMilestoneIndex > 0) {
      const milestoneVal = coinMilestoneIndex * 50;
      addToast({
        id: `coin-${milestoneVal}-${Date.now()}`,
        title: "COIN ACCUMULATION SECURED",
        subtitle: `Milestone of ${milestoneVal} energy cells collected. Multiplier speed stabilized.`,
        type: 'milestone'
      });
    }

    // 2. Distance Milestones (Every 1000m)
    const distMilestoneIndex = Math.floor(currentDistance / 1000);
    const lastDistMilestoneIndex = Math.floor(lastDistanceRef.current / 1000);
    if (distMilestoneIndex > lastDistMilestoneIndex && distMilestoneIndex > 0) {
      const milestoneVal = distMilestoneIndex * 1000;
      addToast({
        id: `dist-${milestoneVal}-${Date.now()}`,
        title: "GRID DEPLOYMENT RANGE INCREASED",
        subtitle: `Traversed ${milestoneVal} meters inside active conduit lines. Thruster temperature normal.`,
        type: 'milestone'
      });
    }

    // 3. Combo Milestones (e.g. 50, 100, 250, 500 coins combo)
    const milestones = [50, 100, 250, 500, 1000];
    milestones.forEach(m => {
      if (currentCombo >= m && lastComboRef.current < m) {
        addToast({
          id: `combo-${m}-${Date.now()}`,
          title: `${m}x COMBO ACHIEVED`,
          subtitle: `Achieved ${m}-coin multiplier combo! Core synapse synchronizing perfectly.`,
          type: 'combo'
        });
      }
    });

    lastCoinsRef.current = currentCoins;
    lastDistanceRef.current = currentDistance;
    lastComboRef.current = currentCombo;
  }, [playerState.coins, playerState.distance, playerState.comboCount, gameState]);

  const addToast = (toast: Omit<ToastMessage, 'id'> & { id: string }) => {
    setToasts(prev => [...prev, toast as ToastMessage]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 4000);
  };

  // Rig bone node tracking states (18 nodes defined by MOAI Rig Contract)
  const boneMap = [
    'root', 'hips', 'spine_01', 'spine_02', 'neck', 'head',
    'upperarm_l', 'lowerarm_l', 'hand_l',
    'upperarm_r', 'lowerarm_r', 'hand_r',
    'thigh_l', 'calf_l', 'foot_l',
    'thigh_r', 'calf_r', 'foot_r'
  ];

  // Helper calculation to return simulated wireframe coordinates for the 18 bones
  // based on current player postures (Jumping, Sliding, Shifting left/right, Running)
  const getSimulatedBoneCoords = () => {
    let baseOffset = { x: 50, y: 55 };
    let scale = 1.0;

    if (playerState.isJumping) {
      baseOffset.y = 35;
      scale = 0.95;
    } else if (playerState.isSliding) {
      baseOffset.y = 75;
      scale = 0.75;
    }

    // Dynamic wave oscillation for realistic skeletal running motion
    const cycle = (Date.now() / 150) % (Math.PI * 2);
    const swingL = Math.sin(cycle) * 12 * scale;
    const swingR = -Math.sin(cycle) * 12 * scale;
    const bodyBob = Math.sin(cycle * 2) * 2;

    const coords: Record<string, { x: number; y: number }> = {
      root: { x: baseOffset.x, y: baseOffset.y + 25 },
      hips: { x: baseOffset.x, y: baseOffset.y + 20 + bodyBob },
      spine_01: { x: baseOffset.x, y: baseOffset.y + 12 + bodyBob },
      spine_02: { x: baseOffset.x, y: baseOffset.y + 4 + bodyBob },
      neck: { x: baseOffset.x, y: baseOffset.y - 4 + bodyBob },
      head: { x: baseOffset.x, y: baseOffset.y - 12 + bodyBob },

      // Left Arm
      upperarm_l: { x: baseOffset.x - 10, y: baseOffset.y - 2 },
      lowerarm_l: { x: baseOffset.x - 16, y: baseOffset.y + 6 + swingL * 0.5 },
      hand_l: { x: baseOffset.x - 20, y: baseOffset.y + 14 + swingL },

      // Right arm
      upperarm_r: { x: baseOffset.x + 10, y: baseOffset.y - 2 },
      lowerarm_r: { x: baseOffset.x + 16, y: baseOffset.y + 6 + swingR * 0.5 },
      hand_r: { x: baseOffset.x + 20, y: baseOffset.y + 14 + swingR },

      // Left Leg
      thigh_l: { x: baseOffset.x - 6, y: baseOffset.y + 20 },
      calf_l: { x: baseOffset.x - 8 + swingR * 0.2, y: baseOffset.y + 32 + swingR * 0.3 },
      foot_l: { x: baseOffset.x - 10 + swingR * 0.4, y: baseOffset.y + 44 + Math.abs(swingR) * 0.3 },

      // Right Leg
      thigh_r: { x: baseOffset.x + 6, y: baseOffset.y + 20 },
      calf_r: { x: baseOffset.x + 8 + swingL * 0.2, y: baseOffset.y + 32 + swingL * 0.3 },
      foot_r: { x: baseOffset.x + 10 + swingL * 0.4, y: baseOffset.y + 44 + Math.abs(swingL) * 0.3 }
    };

    return coords;
  };

  const coords = getSimulatedBoneCoords();

  // Create limb lines
  const boneConnections = [
    ['head', 'neck'], ['neck', 'spine_02'], ['spine_02', 'spine_01'], ['spine_01', 'hips'], ['hips', 'root'],
    ['spine_02', 'upperarm_l'], ['upperarm_l', 'lowerarm_l'], ['lowerarm_l', 'hand_l'],
    ['spine_02', 'upperarm_r'], ['upperarm_r', 'lowerarm_r'], ['lowerarm_r', 'hand_r'],
    ['hips', 'thigh_l'], ['thigh_l', 'calf_l'], ['calf_l', 'foot_l'],
    ['hips', 'thigh_r'], ['thigh_r', 'calf_r'], ['calf_r', 'foot_r']
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-20 font-mono text-zinc-100 select-none">
      
      {/* Toast Notification Container Stack */}
      <div className="absolute top-24 right-4 flex flex-col gap-2 z-50 max-w-[280px] sm:max-w-xs pointer-events-auto">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-black/95 border border-[#F27D26]/70 shadow-[0_4px_16px_rgba(242,125,38,0.25)] rounded-xl p-3 flex flex-col gap-1 relative overflow-hidden"
            >
              {/* Highlight accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F27D26]" />
              
              <div className="flex items-center gap-2 pl-2">
                <Sparkles className="w-3.5 h-3.5 text-[#F27D26] animate-pulse" />
                <span className="text-[9.5px] font-black uppercase tracking-wider text-white">
                  {toast.title}
                </span>
              </div>
              <p className="text-[8px] font-mono text-zinc-400 leading-normal pl-5">
                {toast.subtitle}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Top Center: Active Status Indicators */}
      {gameState === GameState.PLAYING && (playerState.hasShield || (playerState.magnetTime && playerState.magnetTime > 0)) && (
        <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-auto z-30">
          <AnimatePresence mode="popLayout">
            {playerState.hasShield && (
              <motion.div
                key="shield-indicator"
                initial={{ opacity: 0, scale: 0.8, y: -15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -15 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative flex items-center gap-2 bg-black/80 border border-cyan-500/40 px-3 py-1.5 rounded-full shadow-lg"
              >
                {/* Surrounding Pulse Rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-cyan-500/60 pointer-events-none"
                  animate={{
                    scale: [1, 1.35, 1.7],
                    opacity: [0.8, 0.4, 0],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-cyan-400/40 pointer-events-none"
                  animate={{
                    scale: [1, 1.35, 1.7],
                    opacity: [0.8, 0.4, 0],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.9,
                  }}
                />

                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest leading-none">SHIELD</span>
                  <span className="text-[6.5px] text-zinc-400 uppercase tracking-wider leading-none mt-0.5 font-mono">ACTIVE</span>
                </div>
              </motion.div>
            )}
            {playerState.magnetTime && playerState.magnetTime > 0 && (() => {
              const isLowTime = playerState.magnetTime < 120; // < 2 seconds at 60fps
              const pulseDuration = isLowTime ? 0.6 : 1.8;
              const waveDuration = isLowTime ? 0.4 : 1.2;
              return (
                <motion.div
                  key="magnet-indicator"
                  initial={{ opacity: 0, scale: 0.8, y: -15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative flex items-center gap-2 bg-black/80 border border-pink-500/40 px-3 py-1.5 rounded-full shadow-lg"
                >
                  {/* Surrounding Pulse Rings */}
                  <motion.div
                    className={`absolute inset-0 rounded-full border-2 pointer-events-none ${
                      isLowTime ? "border-red-500/60" : "border-pink-500/60"
                    }`}
                    animate={{
                      scale: [1, 1.35, 1.7],
                      opacity: [0.8, 0.4, 0],
                    }}
                    transition={{
                      duration: pulseDuration,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                  <motion.div
                    className={`absolute inset-0 rounded-full border pointer-events-none ${
                      isLowTime ? "border-red-400/40" : "border-pink-400/40"
                    }`}
                    animate={{
                      scale: [1, 1.35, 1.7],
                      opacity: [0.8, 0.4, 0],
                    }}
                    transition={{
                      duration: pulseDuration,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: pulseDuration / 2,
                    }}
                  />

                  {/* Left magnetic attraction wave */}
                  <motion.div
                    className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5"
                    animate={{
                      opacity: [0, 1, 0.3],
                      x: [-15, 0],
                    }}
                    transition={{
                      duration: waveDuration,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  >
                    <span className={`text-[10px] font-black leading-none ${isLowTime ? "text-red-500 animate-pulse" : "text-pink-500"} opacity-40`}>&lt;</span>
                    <span className={`text-[10px] font-black leading-none ${isLowTime ? "text-red-400 animate-pulse" : "text-pink-400"} opacity-75`}>&lt;</span>
                    <span className={`text-[10px] font-black leading-none ${isLowTime ? "text-red-300 animate-pulse" : "text-pink-300"}`}>&lt;</span>
                  </motion.div>

                  {/* Right magnetic attraction wave */}
                  <motion.div
                    className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 flex flex-row-reverse items-center gap-0.5"
                    animate={{
                      opacity: [0, 1, 0.3],
                      x: [15, 0],
                    }}
                    transition={{
                      duration: waveDuration,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  >
                    <span className={`text-[10px] font-black leading-none ${isLowTime ? "text-red-500 animate-pulse" : "text-pink-500"} opacity-40`}>&gt;</span>
                    <span className={`text-[10px] font-black leading-none ${isLowTime ? "text-red-400 animate-pulse" : "text-pink-400"} opacity-75`}>&gt;</span>
                    <span className={`text-[10px] font-black leading-none ${isLowTime ? "text-red-300 animate-pulse" : "text-pink-300"}`}>&gt;</span>
                  </motion.div>

                  <motion.div
                    animate={isLowTime ? {
                      scale: [1, 1.25, 1],
                      rotate: [0, 10, -10, 0],
                    } : {
                      scale: [1, 1.15, 1],
                    }}
                    transition={{
                      duration: isLowTime ? 0.3 : 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Magnet className={`w-3.5 h-3.5 ${isLowTime ? "text-red-500" : "text-pink-500"}`} />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className={`text-[8px] font-bold uppercase tracking-widest leading-none ${isLowTime ? "text-red-500" : "text-pink-500"}`}>
                      MAGNET
                    </span>
                    <span className={`text-[6.5px] uppercase tracking-wider leading-none mt-0.5 font-mono ${isLowTime ? "text-red-400 font-bold" : "text-zinc-400"}`}>
                      {Math.ceil(playerState.magnetTime / 60)}s
                    </span>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      )}

      {/* Center Combo Pop-up Text */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none z-40">
        <AnimatePresence mode="popLayout">
          {gameState === GameState.PLAYING && playerState.comboMessage && (
            <motion.div
              key={playerState.comboMessage}
              initial={{ opacity: 0, scale: 0.5, y: 15 }}
              animate={{ 
                opacity: 1, 
                scale: [0.5, 1.25, 1],
                y: 0,
              }}
              exit={{ opacity: 0, scale: 0.7, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 14
              }}
              className={`px-5 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl flex flex-col items-center gap-1 ${
                playerState.comboMessage.includes('BROKEN') || playerState.comboMessage.includes('LOST')
                  ? 'bg-red-950/80 border-red-500/60 shadow-red-900/40 text-red-400'
                  : 'bg-amber-950/80 border-amber-500/60 shadow-amber-900/40 text-amber-350'
              }`}
            >
              <span className="text-[8px] font-bold tracking-widest uppercase opacity-80">
                {playerState.comboMessage.includes('BROKEN') || playerState.comboMessage.includes('LOST') 
                  ? 'SYSTEM DEVIATION' 
                  : 'SYNAPSE OVERLOAD'}
              </span>
              <span className="text-sm md:text-base font-black font-serif tracking-wide uppercase filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
                {playerState.comboMessage}
              </span>
              {playerState.comboCount && playerState.comboCount > 0 && !playerState.comboMessage.includes('LOST') && !playerState.comboMessage.includes('BROKEN') && (
                <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (playerState.comboCount % 5) * 20 || 100)}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 15 }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top HUD Panel: Controls & Telemetry Data */}
      <div className="w-full flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-1 bg-black/60 backdrop-blur-md border border-[#F27D26]/30 rounded-xl p-3 md:p-4 shadow-lg max-w-[280px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-405 shadow-sm animate-pulse" />
            <h1 className="text-xs font-serif font-black tracking-widest text-[#F27D26] uppercase">
              ABYSSUM COAXIAL FEED
            </h1>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            Operator: <span className="text-[#F27D26]">{selectedClass}</span>
          </p>
          <div className="flex items-center gap-1 text-[9px] text-zinc-550 border-t border-zinc-800/60 pt-1.5 mt-1">
            <span>Status:</span>
            <span className={gameState === GameState.PLAYING ? 'text-green-400 font-bold animate-pulse' : 'text-zinc-500'}>
              {gameState === GameState.PLAYING ? 'LIVE ENGINE ON' : 'STANDBY IDLE'}
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex flex-col gap-1.5 items-end bg-black/60 backdrop-blur-md border border-[#F27D26]/30 rounded-xl p-3 md:p-4 shadow-lg min-w-[160px]">
          <div className="text-right">
            <span className="text-[9px] text-zinc-550 uppercase tracking-widest block font-bold">Current Score</span>
            <span className="text-lg font-serif font-black text-white glow-cyan tracking-wider">
              {playerState.score.toLocaleString()}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/80 pt-1.5 mt-1 w-full text-right">
            <div>
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">Distance</span>
              <span className="text-xs font-bold text-cyan-305">{Math.floor(playerState.distance)}m</span>
            </div>
            <div>
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">Core Energy</span>
              <span className="text-xs font-bold text-amber-400">{Math.floor(playerState.energy)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Alerts overlay (Starts, pauses, Gameover) */}
      <div className="self-center flex flex-col items-center pointer-events-auto">
        {gameState === GameState.START && (
          <div className="bg-black/85 backdrop-blur-md border-2 border-[#F27D26]/80 rounded-2xl p-6 shadow-2xl text-center max-w-md flex flex-col items-center relative overflow-hidden">
            {/* Corner brass-like rivets decoration */}
            <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-stone-500 border border-black" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-stone-500 border border-black" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-stone-500 border border-black" />
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-stone-500 border border-black" />
            
            <Heart className="w-10 h-10 text-red-500 animate-pulse mb-3" />
            <h2 className="text-2xl font-serif font-black tracking-[0.15em] text-[#F27D26] uppercase">
              ABYSSUM RUNNER
            </h2>
            <div className="h-[2px] w-16 bg-[#F27D26]/40 my-2" />
            <p className="text-zinc-300 text-xs font-mono leading-relaxed mb-4 max-w-sm">
              Procedurally traverse active containment reservoirs. Avoid cybernetic rifts, jump high barrier columns, slide under scanners, and smash cells.
            </p>

            <button
              onClick={onStartGame}
              className="py-3 px-6 bg-[#F27D26] hover:bg-[#d66411] active:scale-95 text-black font-black uppercase text-xs tracking-[0.2em] rounded-lg transition-all shadow-[0_4px_16px_rgba(242,125,38,0.3)] flex items-center gap-2 cursor-pointer pointer-events-auto"
            >
              <Play size={14} className="fill-black" />
              <span>LAUNCH PROTOTYPE</span>
            </button>
            
            <div className="flex gap-4 mt-4 text-[9px] text-[#F27D26] font-mono border-t border-zinc-800/80 pt-3 w-full justify-center">
              <span>← Lanes Left/Right →</span>
              <span>•</span>
              <span>↑ Jump</span>
              <span>•</span>
              <span>↓ Slide</span>
            </div>
          </div>
        )}

        {gameState === GameState.GAMEOVER && (
          <div className="bg-black/90 backdrop-blur-md border-2 border-red-500/80 rounded-2xl p-6 shadow-2xl text-center max-w-sm flex flex-col items-center">
            <span className="text-[9px] font-mono text-red-500 font-bold bg-red-950/40 border border-red-900/60 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse mb-2">
              CAVITATION MELTDOWN
            </span>
            <h2 className="text-xl font-serif font-black tracking-widest text-red-400 uppercase">
              CONNECTION TERMINATED
            </h2>
            
            <div className="grid grid-cols-2 gap-4 w-full bg-zinc-950/80 border border-zinc-900 rounded-lg p-3 my-4">
              <div className="text-center">
                <span className="text-[8px] text-zinc-550 block uppercase tracking-wier">Final Score</span>
                <span className="text-lg font-bold text-white font-mono">{playerState.score.toLocaleString()}</span>
              </div>
              <div className="text-center">
                <span className="text-[8px] text-zinc-550 block uppercase tracking-wier">Distance</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">{Math.floor(playerState.distance)}m</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={onRestartGame}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-black uppercase text-xs tracking-widest rounded-lg transition-all shadow-[0_4px_12px_rgba(220,38,38,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>RESTART CONSOLE LINK</span>
              </button>

              <button
                onClick={onQuitGame}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 active:scale-95 text-zinc-300 font-bold uppercase text-xs tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer animate-none"
              >
                <Home size={13} />
                <span>MAIN MENU</span>
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.PAUSED && (
          <div className="bg-black/90 backdrop-blur-md border-2 border-cyan-500/80 rounded-2xl p-6 shadow-2xl text-center max-w-sm flex flex-col items-center relative overflow-hidden">
            {/* Decorative rivets */}
            <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-stone-550 border border-black" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-stone-550 border border-black" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-stone-550 border border-black" />
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-stone-550 border border-black" />

            <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-900/60 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse mb-2">
              SIMULATION SUSPENDED
            </span>
            <h2 className="text-xl font-serif font-black tracking-widest text-cyan-300 uppercase mb-1">
              GAME PAUSED
            </h2>
            <div className="h-[2px] w-16 bg-cyan-500/40 my-2" />
            <p className="text-zinc-400 text-xs font-mono leading-relaxed mb-4 max-w-xs">
              Current progress saved. Your core matrices are stabilized. Choose an operation below.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full bg-zinc-950/80 border border-zinc-900 rounded-lg p-3 mb-4">
              <div className="text-center">
                <span className="text-[8px] text-zinc-550 block uppercase tracking-wider">Score Cache</span>
                <span className="text-sm font-bold text-white font-mono">{playerState.score.toLocaleString()}</span>
              </div>
              <div className="text-center">
                <span className="text-[8px] text-zinc-550 block uppercase tracking-wider">Distance</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">{Math.floor(playerState.distance)}m</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={onPauseToggle}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 active:scale-95 text-white font-black uppercase text-xs tracking-widest rounded-lg transition-all shadow-[0_4px_12px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={13} className="fill-white" />
                <span>RESUME RUN</span>
              </button>

              <button
                onClick={onQuitGame}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 active:scale-95 text-zinc-300 font-bold uppercase text-xs tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer animate-none"
              >
                <Home size={13} />
                <span>MAIN MENU</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Area: Controls, Status Clusters and Skeleton Rig visualizer overlay */}
      <div className="w-full flex justify-between items-end">
        
        {/* Left Core Status Widget: Real-time Bone contract tracker diagnostic visualizer */}
        <div className="bg-black/60 backdrop-blur-md border border-[#F27D26]/20 rounded-xl p-3 shadow-lg pointer-events-auto flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <Terminal size={11} className="text-brand-cyan" />
              <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Bone Map (MOAI Rig Contract)</span>
            </div>
            
            {/* Draw 18 core bones state checks */}
            <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-[7px] text-zinc-650 font-mono w-[180px]">
              {boneMap.map((b) => {
                let statusColor = "text-green-500";
                if (b === 'head' && playerState.isJumping) statusColor = "text-yellow-405 font-bold animate-pulse";
                if (b.includes('foot') && playerState.isSliding) statusColor = "text-amber-500 font-bold";
                if (b.includes('hand') && gameState !== GameState.PLAYING) statusColor = "text-zinc-600";
                
                return (
                  <div key={b} className="flex justify-between items-center bg-zinc-950/20 px-1 py-0.2 rounded-sm border border-zinc-900/30">
                    <span className="truncate">{b}</span>
                    <span className={statusColor}>●</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SVG Animated holographic canvas layout matching coordinates */}
          <div className="w-[100px] h-[110px] border border-[#F27D26]/20 bg-zinc-950/80 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0">
            {/* Scanning radar line */}
            <div className="absolute left-0 right-0 h-[1px] bg-[#F27D26]/40 animate-[pulse_1.5s_infinite] top-[40%]" />
            <span className="absolute bottom-1 right-1 text-[5px] text-stone-650 font-mono tracking-widest select-none">RIG DIAGNOSTICS</span>
            
            <svg className="w-full h-full" viewBox="0 0 100 110">
              {/* Render Bone connections */}
              {boneConnections.map(([from, to], index) => {
                const fromP = coords[from];
                const toP = coords[to];
                if (!fromP || !toP) return null;
                return (
                  <line
                    key={index}
                    x1={fromP.x}
                    y1={fromP.y}
                    x2={toP.x}
                    y2={toP.y}
                    stroke={gameState === GameState.PLAYING ? "#F27D26" : "#5d5d6d"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity={gameState === GameState.PLAYING ? "0.85" : "0.4"}
                  />
                );
              })}

              {/* Render active Joints */}
              {Object.entries(coords).map(([name, joint]) => (
                <circle
                  key={name}
                  cx={joint.x}
                  cy={joint.y}
                  r={name === 'head' ? '3.5' : '1.8'}
                  fill={name === 'head' ? '#F27D26' : '#e2e8f0'}
                  stroke="#000"
                  strokeWidth="0.5"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Right lane map controls indicator */}
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-1 bg-black/60 backdrop-blur-md border border-[#F27D26]/20 rounded-xl p-2.5 shadow-lg pointer-events-auto">
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[7.5px] text-zinc-550 uppercase tracking-widest block font-bold mb-0.5">Active Lane Layout</span>
              
              <div className="flex items-center gap-1.5">
                {[Lane.LEFT, Lane.CENTER, Lane.RIGHT].map((l) => {
                  const isActive = playerState.lane === l;
                  let label = "LEFT";
                  if (l === Lane.CENTER) label = "CENTER";
                  if (l === Lane.RIGHT) label = "RIGHT";

                  return (
                    <div
                      key={l}
                      className={`px-2 py-1 text-[8px] font-mono border rounded text-center transition-all ${
                        isActive 
                          ? 'border-brand-orange bg-[#F27D26]/10 text-[#F27D26] font-bold' 
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-550'
                      }`}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Pause/Resume overlay trigger button */}
            {gameState === GameState.PLAYING && (
              <button
                onClick={onPauseToggle}
                className="pointer-events-auto p-2 bg-black/70 border border-[#F27D26]/30 hover:border-[#F27D26] rounded-lg transition-colors cursor-pointer text-[#F27D26]"
                title="Pause game (ESC or P)"
              >
                <Pause size={15} />
              </button>
            )}

            {/* Audio toggle overlay control */}
            <button
              onClick={onToggleMute}
              className="pointer-events-auto p-2 bg-black/70 border border-[#F27D26]/30 hover:border-[#F27D26] rounded-lg transition-colors cursor-pointer"
              title="Toggle game sound effects"
            >
              {isMuted ? <VolumeX size={15} className="text-zinc-500" /> : <Volume2 size={15} className="text-[#F27D26]" />}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
