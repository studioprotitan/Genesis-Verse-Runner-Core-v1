import React from 'react';
import { PlayerState, GameState } from '../types';
import { Shield, Zap, Heart, Trophy, ZapOff, Play, Pause, ChevronRight } from 'lucide-react';

interface GameHUDProps {
  playerStats: PlayerState | null;
  gameState: GameState;
  onPauseToggle: () => void;
  onExitToLounge: () => void;
}

export default function GameHUD({
  playerStats,
  gameState,
  onPauseToggle,
  onExitToLounge
}: GameHUDProps) {
  if (!playerStats) return null;

  const healthPercentage = (playerStats.health / playerStats.maxHealth) * 100;
  const energyPercentage = (playerStats.energy / playerStats.maxEnergy) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 font-mono select-none flex flex-col justify-between p-6">
      {/* Top Bar: Stats */}
      <div className="flex justify-between items-start w-full">
        {/* Left Side: Score & Multiplier */}
        <div className="flex gap-4 pointer-events-auto">
          <div className="bg-black/75 border border-zinc-800 p-3 rounded backdrop-blur-md min-w-[120px]">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">
              <Trophy size={11} className="text-[#F27D26]" />
              Score
            </div>
            <div className="text-xl font-bold tracking-wider text-white text-glow-orange font-mono">
              {String(playerStats.score).padStart(6, '0')}
            </div>
          </div>

          <div className="bg-black/75 border border-zinc-800 p-3 rounded backdrop-blur-md min-w-[90px]">
            <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">
              Multiplier
            </div>
            <div className="text-xl font-bold tracking-wider text-cyan-400 text-glow-cyan font-mono">
              x{playerStats.multiplier}
            </div>
          </div>
        </div>

        {/* Right Side: Quick System Controls */}
        <div className="flex gap-3 pointer-events-auto">
          <button
            onClick={onPauseToggle}
            className="px-4 py-2 bg-black/75 border border-zinc-800 hover:border-zinc-700 hover:bg-black text-zinc-300 hover:text-white rounded font-bold font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            {gameState === GameState.PAUSED ? (
              <>
                <Play size={10} fill="currentColor" />
                Resume
              </>
            ) : (
              <>
                <Pause size={10} fill="currentColor" />
                Pause
              </>
            )}
          </button>
        </div>
      </div>

      {/* Center Notification: Active Status (e.g. Shield) */}
      <div className="flex flex-col items-center justify-center gap-1.5">
        {playerStats.shieldActive && (
          <div className="bg-cyan-500/10 border border-cyan-400 px-3 py-1.5 rounded flex items-center gap-2 animate-pulse backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Shield size={12} className="text-cyan-400" />
            <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">FORCE SHIELD ACTIVE</span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Health, Energy & Speed */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-end pointer-events-auto">
        {/* Vital Health monitor */}
        <div className="bg-black/75 border border-zinc-800 p-3 rounded backdrop-blur-md">
          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
            <div className="flex items-center gap-1.5">
              <Heart size={11} className="text-red-500" />
              PILOT VITALITY
            </div>
            <span className="text-white">{playerStats.health} / {playerStats.maxHealth}</span>
          </div>
          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
        </div>

        {/* Reactor energy cells monitor */}
        <div className="bg-black/75 border border-zinc-800 p-3 rounded backdrop-blur-md">
          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap size={11} className="text-emerald-500 animate-pulse" />
              CORE CELLS
            </div>
            <span className="text-white">{Math.round(playerStats.energy)}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-300"
              style={{ width: `${energyPercentage}%` }}
            />
          </div>
        </div>

        {/* Distance / speed log metrics */}
        <div className="bg-black/75 border border-zinc-800 p-3 rounded backdrop-blur-md flex justify-between items-center">
          <div>
            <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">
              Distance Ran
            </div>
            <div className="text-lg font-bold text-white">
              {Math.floor(playerStats.distance)}m
            </div>
          </div>
          <div className="text-right border-l border-zinc-800 pl-4">
            <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">
              Velocity
            </div>
            <div className="text-lg font-bold text-[#F27D26] text-glow-orange">
              {Math.round(playerStats.speed * 3.6)} km/h
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
