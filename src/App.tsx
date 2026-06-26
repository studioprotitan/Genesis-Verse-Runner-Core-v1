/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, PlayerState, Lane, WeaponType } from './types';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { Leaderboard } from './components/Leaderboard';
import { PreDeploymentLounge } from './components/PreDeploymentLounge';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Shield, HelpCircle, Sparkles, BookOpen, 
  Terminal, Database, Zap, Cpu, Flame, Volume2, VolumeX, Heart, ChevronRight, Play,
  Copy, Check, X
} from 'lucide-react';

interface OperatorProfile {
  name: string;
  speed: string;
  armor: string;
  energy: string;
  description: string;
  codename: string;
  tacticalAdvantageTitle: string;
  tacticalAdvantageDesc: string;
  tacticalAdvantagePerks: string[];
}

const CHARACTERS: OperatorProfile[] = [
  {
    name: "CST-ERT Trooper",
    codename: "cst-ert-walk-a",
    speed: "♛ HIGH (0.28 z/f)",
    armor: "♦ REINFORCED (100 HP)",
    energy: "⚡ DEFENSIVE CORE (40%)",
    description: "The canon combat frame engineered to withstand containment pressure. Fires standard fast primary defensive cells.",
    tacticalAdvantageTitle: "KINETIC STABILITY",
    tacticalAdvantageDesc: "Engineered for severe shock vectors and high structural durability.",
    tacticalAdvantagePerks: [
      "+33% Baseline HP Capacity",
      "Standard fast defensive cells",
      "Superior impact kinetic dampening"
    ]
  },
  {
    name: "Formula Pilot",
    codename: "as_ue5_mf_pilot",
    speed: "✦ SUPERSONIC (0.33 z/f)",
    armor: "♦ INTEGRATED LIGHT (75 HP)",
    energy: "⚡ KINETIC CAPACITOR (60%)",
    description: "Specially calibrated for warp-level velocities, translating structural density into maximum acceleration loops.",
    tacticalAdvantageTitle: "VELOCITY BOOST",
    tacticalAdvantageDesc: "Stripped of extra bulk to achieve maximum terminal velocity parameters.",
    tacticalAdvantagePerks: [
      "+18% Top Speed Velocity",
      "Accelerated distance accumulation",
      "Lightweight dynamic airframe"
    ]
  },
  {
    name: "Pulse Siren",
    codename: "abyssum-siren-v1",
    speed: "▲ MODERATE (0.25 z/f)",
    armor: "♦ METASTABLE SHIELD (100 HP)",
    energy: "⚡ HIGH-FREQUENCY PULSE (80%)",
    description: "Operates deep underwater signal junctions, manipulating echo sweeps and core grids past obstacle thresholds.",
    tacticalAdvantageTitle: "AUXILIARY HARMONICS",
    tacticalAdvantageDesc: "Manipulates energy flux to prolong utility and power-up intervals.",
    tacticalAdvantagePerks: [
      "Double energy capacitor core",
      "Prolonged power-up durations",
      "Rapid active-state system cycles"
    ]
  }
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [showHandoffModal, setShowHandoffModal] = useState<boolean>(false);
  const [copiedHandoff, setCopiedHandoff] = useState<boolean>(false);
  const [showLanding, setShowLanding] = useState<boolean>(true);

  // Default initial player stat profile
  const [playerState, setPlayerState] = useState<PlayerState>({
    lane: Lane.CENTER,
    targetX: 0.0,
    currentX: 0.0,
    y: 0.0,
    isJumping: false,
    isSliding: false,
    jumpTime: 0.0,
    slideTime: 0.0,
    health: 100,
    energy: 40,
    score: 0,
    distance: 0.0,
    coins: 0,
    speed: 0.28,
    currentWeapon: WeaponType.PLASMA_RIFT,
    weaponAmmo: {
      [WeaponType.PLASMA_RIFT]: Infinity,
      [WeaponType.SCATTER_CANNON]: 25,
      [WeaponType.SONIC_PULSE]: 5,
    },
    weaponCooldown: {
      [WeaponType.PLASMA_RIFT]: 0,
      [WeaponType.SCATTER_CANNON]: 0,
      [WeaponType.SONIC_PULSE]: 0,
    },
    autoFireEnabled: false,
  });

  const handleUpdatePlayerState = (stats: Partial<PlayerState>) => {
    setPlayerState(prev => ({ ...prev, ...stats }));
  };

  const handleStartGame = () => {
    // Reset core stats according to character choice
    const chosen = CHARACTERS[selectedCharacterIndex];
    setPlayerState({
      lane: Lane.CENTER,
      targetX: 0.0,
      currentX: 0.0,
      y: 0.0,
      isJumping: false,
      isSliding: false,
      jumpTime: 0.0,
      slideTime: 0.0,
      health: chosen.name.includes('Pilot') ? 75 : 100,
      energy: chosen.name.includes('Siren') ? 80 : chosen.name.includes('Pilot') ? 60 : 40,
      score: 0,
      distance: 0.0,
      coins: 0,
      speed: chosen.name.includes('Pilot') ? 0.33 : chosen.name.includes('Siren') ? 0.25 : 0.28,
      currentWeapon: WeaponType.PLASMA_RIFT,
      weaponAmmo: {
        [WeaponType.PLASMA_RIFT]: Infinity,
        [WeaponType.SCATTER_CANNON]: 25,
        [WeaponType.SONIC_PULSE]: 5,
      },
      weaponCooldown: {
        [WeaponType.PLASMA_RIFT]: 0,
        [WeaponType.SCATTER_CANNON]: 0,
        [WeaponType.SONIC_PULSE]: 0,
      },
      autoFireEnabled: false,
    });
    setGameState(GameState.PLAYING);
  };

  const handleRestartGame = () => {
    setGameState(GameState.START);
    // Force leaderboard table reload upon GameOver restarts
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGameOver = () => {
    setGameState(GameState.GAMEOVER);
  };

  const handlePauseToggle = () => {
    setGameState(prev => {
      if (prev === GameState.PLAYING) return GameState.PAUSED;
      if (prev === GameState.PAUSED) return GameState.PLAYING;
      return prev;
    });
  };

  const handleQuitGame = () => {
    setGameState(GameState.START);
  };

  return (
    <div className="h-screen w-screen bg-[#050505] text-zinc-100 overflow-hidden flex flex-col relative select-none">
      
      {/* High-fidelity procedural grid styling lines */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-overlay opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(242,125,38,0.04)_0%,transparent_80%)] pointer-events-none z-0" />
      
      {/* Main Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col p-4 md:p-6 min-h-0 relative z-10 select-none">
        
        {/* App Shell Header */}
        <header className="flex-none flex justify-between items-center border-b border-[#F27D26]/20 pb-4 mb-4 select-none">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-r from-red-500 via-[#F27D26] to-amber-700 p-[1.5px] shadow-[0_0_12px_rgba(242,125,38,0.25)] select-none">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-serif text-lg font-black text-[#F27D26]">
                Ω
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26] animate-pulse" />
                <h1 className="text-sm font-serif font-black tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r from-white via-[#ffd3b0] to-[#F27D26] uppercase">
                  ABYSSUM RUNNER //
                </h1>
                <span className="text-[9px] font-mono font-medium text-zinc-500 tracking-[0.2em] uppercase hidden sm:inline">
                  CONDUIT CHAMBER PORTAL
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#F27D26] tracking-wider uppercase mt-0.5">
                GENESIS-VERSE PROTOCOL // STABLE PLATFORM CORES
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowHandoffModal(true);
                setCopiedHandoff(false);
              }}
              className="text-[10px] font-mono text-amber-500 hover:text-amber-400 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-900/50 px-3 py-1.5 rounded-md flex items-center gap-1.5 uppercase font-bold tracking-wider cursor-pointer transition-all"
            >
              <Terminal size={12} className="text-amber-500 animate-pulse" />
              Claude AI Handoff
            </button>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950/80 border border-zinc-900 px-3 py-1.5 rounded-md flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              Rig Contract Active
            </span>
          </div>
        </header>

        {/* Console Workspace Grid */}
        <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-5 overflow-hidden">
          
          {/* ====================================================
              LEFT COLUMN: Interactive Game Arena Graphics (70%)
             ==================================================== */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            
            {gameState === GameState.START ? (
              showLanding ? (
                /* Immersive Hero Landing Page with Mint to Run */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex-1 flex flex-col justify-center items-center p-4 text-center overflow-y-auto no-scrollbar"
                >
                  <style>{`
                    @keyframes scan-motion {
                      0% { top: 0%; }
                      50% { top: 100%; }
                      100% { top: 0%; }
                    }
                  `}</style>
                  
                  <div className="w-full max-w-xl bg-black/45 border border-[#F27D26]/20 p-5 md:p-6 rounded-2xl relative overflow-hidden flex flex-col items-center gap-5 shadow-[0_0_50px_rgba(242,125,38,0.12)]">
                    {/* Glowing corner brackets */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#F27D26]" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#F27D26]" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#F27D26]" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#F27D26]" />
                    
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#F27D26] tracking-[0.25em] font-black uppercase block">
                        EXECUTIVE RAIL TRANSIT COMMAND // COGNITIVE LABS
                      </span>
                      <h2 className="text-xl font-serif font-black tracking-widest text-white uppercase">
                        CST ERT COMMANDER
                      </h2>
                    </div>

                    {/* Main Image with futuristic overlay */}
                    <div 
                      onClick={() => setShowLanding(false)}
                      className="relative w-full max-w-sm h-[320px] rounded-xl overflow-hidden border border-[#F27D26]/35 group cursor-pointer shadow-[0_0_24px_rgba(242,125,38,0.15)] hover:border-[#F27D26] transition-all duration-500 hover:shadow-[0_0_36px_rgba(242,125,38,0.3)]"
                    >
                      {/* Scanning visual overlay */}
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#F27D26] to-transparent shadow-[0_0_8px_#F27D26] z-20 pointer-events-none" style={{
                        animation: 'scan-motion 4s linear infinite'
                      }} />
                      
                      {/* Hologram vignette */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)] z-10 pointer-events-none" />
                      
                      {/* Grid Lines */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(242,125,38,0.03)_1px,transparent_1px)] bg-[size:100%_8px] pointer-events-none z-10" />

                      <img 
                        src="/Copilot_20260626_065853.png" 
                        alt="CST ERT Commander"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                      />

                      {/* Click overlay feedback */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 z-25">
                        <div className="text-center space-y-2 px-4 pointer-events-none">
                          <Sparkles className="w-8 h-8 text-[#F27D26] mx-auto animate-pulse" />
                          <span className="text-xs font-mono font-bold text-white tracking-[0.2em] uppercase block">
                            INITIATE MINT SEQUENCE
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400 block">
                            DECRYPT SYNC CONTRACT COGNITIVE AGENT
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mint to Run CTA */}
                    <div className="space-y-2.5 w-full max-w-sm">
                      <button
                        onClick={() => setShowLanding(false)}
                        className="w-full py-3.5 bg-gradient-to-r from-red-650 via-[#F27D26] to-amber-500 hover:from-red-600 hover:to-amber-450 text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all shadow-[0_4px_24px_rgba(242,125,38,0.2)] hover:shadow-[0_4px_36px_rgba(242,125,38,0.35)] active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 font-serif"
                      >
                        <Sparkles className="w-4.5 h-4.5 fill-black" />
                        <span>MINT TO RUN</span>
                      </button>
                      <p className="text-[8.5px] font-mono text-zinc-550 uppercase tracking-widest leading-relaxed">
                        DEPLOY PROTO-RIG TO SYNC AND BEGIN CONDUIT RUNS.<br />
                        BOUND UNDER GENERAL DEFENSIVE CITIZEN LAWS.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Immersive Start Console Landing Screen */
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-center items-center p-4"
                >
                  <div className="w-full max-w-xl text-center space-y-6">
                    {/* Glowing central orb graphic */}
                    <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#F27D26]/40 animate-[spin_30s_linear_infinite]" />
                      <div className="absolute inset-3 rounded-full border border-dashed border-[#F27D26]/40 animate-[spin_20s_linear_infinite_reverse]" />
                      <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-[#241103]/80 to-stone-900/40 border border-[#F27D26]/30 flex items-center justify-center shadow-[0_0_24px_rgba(242,125,38,0.12)]">
                        <Flame className="w-12 h-12 text-[#F27D26] animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-serif font-black tracking-[0.2em] text-[#F27D26] uppercase">
                        Select Player Operator Frame
                      </h2>
                      <p className="text-zinc-400 text-xs font-mono tracking-widest uppercase">
                        ENFORCE RIG STATUS FOR METADATA ALIGNMENT
                      </p>
                    </div>

                    {/* Character selection Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {CHARACTERS.map((char, index) => {
                        const isSelected = selectedCharacterIndex === index;
                        return (
                          <div
                            key={index}
                            className="relative"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          >
                            <button
                              onClick={() => setSelectedCharacterIndex(index)}
                              className={`w-full p-4 rounded-xl text-left border transition-all flex flex-col gap-2 relative overflow-hidden group hover:bg-[#070b10] cursor-pointer ${
                                isSelected 
                                  ? 'border-[#F27D26] bg-[#F27D26]/10 shadow-[0_0_20px_rgba(242,125,38,0.15)]' 
                                  : 'border-zinc-850/60 bg-black/50 text-zinc-400'
                              }`}
                            >
                              {/* Emissive visual particle pulse inside card */}
                              <div className={`absolute top-0 right-0 w-8 h-8 rounded-full filter blur-md pointer-events-none transition-all duration-300 ${
                                isSelected ? 'bg-[#F27D26]/10' : 'bg-transparent'
                              }`} />

                              <div>
                                <span className="text-[8px] font-mono text-zinc-550 block uppercase tracking-widest">{char.codename}</span>
                                <span className={`text-xs font-serif font-black uppercase tracking-wider block transition-colors ${
                                  isSelected ? 'text-[#F27D26]' : 'text-zinc-200 group-hover:text-white'
                                }`}>
                                  {char.name}
                                </span>
                              </div>

                              <div className="space-y-1 text-[9px] font-mono border-t border-zinc-900/60 pt-2 w-full">
                                <div className="flex justify-between">
                                  <span className="text-zinc-550 uppercase">Speed:</span>
                                  <span className={isSelected ? 'text-[#F27D26] font-bold' : 'text-zinc-450'}>{char.speed}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-550 uppercase">Hull HP:</span>
                                  <span className="text-zinc-350">{char.armor}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-550 uppercase">Energy Cap:</span>
                                  <span className="text-[#eab308]">{char.energy}</span>
                                </div>
                              </div>

                              <p className={`text-[8.5px] font-mono leading-normal italic line-clamp-3 mt-1 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                "{char.description}"
                              </p>
                            </button>

                            {/* Context-aware high-tech tooltip on hover */}
                            <AnimatePresence>
                              {hoveredIndex === index && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  transition={{ duration: 0.15, ease: "easeOut" }}
                                  className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 sm:w-72 p-3 bg-black/95 border border-[#F27D26]/70 rounded-xl shadow-[0_12px_36px_rgba(242,125,38,0.25)] z-50 pointer-events-none"
                                >
                                  {/* Futuristic corner frames */}
                                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#F27D26]" />
                                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#F27D26]" />
                                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#F27D26]" />
                                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#F27D26]" />

                                  {/* Glowing background accent */}
                                  <div className="absolute inset-0 bg-[#F27D26]/5 rounded-xl pointer-events-none" />

                                  <div className="relative space-y-2">
                                    {/* Header block with icon */}
                                    <div className="flex items-center gap-2 border-b border-[#F27D26]/20 pb-1.5">
                                      <Cpu className="w-3.5 h-3.5 text-[#F27D26] animate-pulse animate-duration-1000" />
                                      <span className="text-[9px] font-mono font-bold text-[#F27D26] tracking-wider uppercase">
                                        Tactical Assessment
                                      </span>
                                    </div>

                                    {/* Title & Description */}
                                    <div className="space-y-1">
                                      <h4 className="text-[10px] font-serif font-black text-zinc-150 uppercase tracking-wide leading-tight">
                                        {char.tacticalAdvantageTitle}
                                      </h4>
                                      <p className="text-[8.5px] font-mono text-zinc-400 leading-normal">
                                        {char.tacticalAdvantageDesc}
                                      </p>
                                    </div>

                                    {/* Bullet advantages list */}
                                    <div className="space-y-1 border-t border-zinc-900/60 pt-1.5">
                                      {char.tacticalAdvantagePerks.map((perk, pIdx) => (
                                        <div key={pIdx} className="flex items-start gap-1">
                                          <ChevronRight className="w-2.5 h-2.5 text-[#F27D26] mt-0.5 shrink-0" />
                                          <span className="text-[8px] font-mono text-zinc-300">
                                            {perk}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Arrow connector */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#F27D26]/70" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions CTA button */}
                    <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => setGameState(GameState.PREDEPLOYMENT)}
                        className="py-4 px-8 bg-gradient-to-r from-red-650 via-[#F27D26] to-amber-600 text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all shadow-[0_8px_32px_rgba(242,125,38,0.25)] hover:shadow-[0_8px_40px_rgba(242,125,38,0.35)] active:scale-98 cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto font-serif"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        <span>PRE-DEPLOY 3D RIG</span>
                      </button>
                      
                      <button
                        onClick={() => setShowLanding(true)}
                        className="py-4 px-6 border border-zinc-800 text-zinc-400 font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-950 hover:text-white transition-all cursor-pointer"
                      >
                        Back to Command Info
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            ) : gameState === GameState.PREDEPLOYMENT ? (
              <PreDeploymentLounge 
                selectedClass={CHARACTERS[selectedCharacterIndex].name}
                onDeploy={handleStartGame}
                onQuit={() => setGameState(GameState.START)}
              />
            ) : (
              /* Interactive Gameplay Arena active layout */
              <div className="flex-1 flex flex-col justify-center items-center relative min-h-0 bg-[#030406] border border-stone-850 rounded-xl overflow-hidden p-0.5">
                <GameCanvas 
                  gameState={gameState}
                  selectedClass={CHARACTERS[selectedCharacterIndex].name}
                  isMuted={isMuted}
                  onGameOver={handleGameOver}
                  onUpdateState={handleUpdatePlayerState}
                  onPauseToggle={handlePauseToggle}
                />
                
                {/* Visual HUD layer mapped over the canvas */}
                <GameHUD 
                  playerState={playerState}
                  gameState={gameState}
                  selectedClass={CHARACTERS[selectedCharacterIndex].name}
                  isMuted={isMuted}
                  onStartGame={handleStartGame}
                  onRestartGame={handleRestartGame}
                  onToggleMute={() => setIsMuted(prev => !prev)}
                  onPauseToggle={handlePauseToggle}
                  onQuitGame={handleQuitGame}
                />
              </div>
            )}

          </div>

          {/* ====================================================
              RIGHT COLUMN: Leaderboards & Ledger Diagnostics (30%)
             ==================================================== */}
          <div className="w-full lg:w-[32%] flex flex-col gap-4 overflow-y-auto pr-0 lg:pr-1 no-scrollbar shrink-0 select-text">
            
            {/* Supabase Leaderboard Panel */}
            <Leaderboard 
              currentScore={playerState.score}
              currentDistance={playerState.distance}
              characterClass={CHARACTERS[selectedCharacterIndex].name}
              onRefreshTrigger={refreshTrigger}
            />

            {/* Diagnostic Logs box / Universe Lore Module */}
            <div className="glass-panel border-stone-850/60 rounded-xl p-5 flex flex-col relative overflow-hidden bg-black/45 select-text">
              <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                <h3 className="text-xs font-mono font-bold tracking-[0.2em] text-zinc-300 uppercase flex items-center gap-1.5">
                  <Terminal className="text-[#F27D26]" size={11} />
                  Cosmic Archive Logs
                </h3>
                <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-ping" />
              </div>

              <div className="space-y-3.5 text-zinc-400 font-mono text-[9.5px] leading-relaxed">
                <div>
                  <span className="text-[#F27D26] font-bold block uppercase mb-0.5">Abyssum Deep Basin Rift</span>
                  <p>
                    Found deep in the rifts of Sector-09, the high-frequency grid requires infinite running speed to escape the gravity loop. Run over energy capacitors to absorb shields and power.
                  </p>
                </div>

                <div className="border-t border-zinc-900/85 pt-3">
                  <span className="text-[#F27D26] font-bold block uppercase mb-0.5">Action Manual</span>
                  <ul className="list-disc pl-4 space-y-1 text-zinc-500 uppercase text-[8.5px]">
                    <li>Jump (Space / W / Click upper half): Bypasses low energy wires and barriers.</li>
                    <li>Slide (S / Shift / Click bottom half): Drops hitbox scale to slide beneath scan arches.</li>
                    <li>Lanes Left/Right (A, D / Clicks sides): Repositions target X location coordinate smoothly.</li>
                  </ul>
                </div>
                
                <div className="border-t border-zinc-900/85 pt-3 flex justify-between items-center text-[7.5px] text-zinc-650">
                  <span>MANIFEST DP-85 ACTIVE</span>
                  <span>SYSTEM CALIBRATED</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Claude AI Collaboration Handoff Modal */}
      <AnimatePresence>
        {showHandoffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-text">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border-2 border-amber-900/50 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(242,125,38,0.15)]"
            >
              {/* Corner brass-like rivets decoration */}
              <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-stone-700 border border-black" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-stone-700 border border-black" />
              <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-stone-700 border border-black" />
              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-stone-700 border border-black" />

              <div className="flex justify-between items-center border-b border-amber-900/40 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="text-amber-500 animate-pulse" size={18} />
                  <h2 className="text-sm font-serif font-black tracking-widest text-amber-500 uppercase">
                    CLAUDE AI COLLABORATION PROTOCOL
                  </h2>
                </div>
                <button
                  onClick={() => setShowHandoffModal(false)}
                  className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs font-mono text-zinc-400 mb-4 leading-relaxed uppercase tracking-wider">
                Copy the prompt ledger below and paste it directly into Claude AI's prompt input to synchronize full context and project requirements.
              </p>

              <div className="flex-1 overflow-y-auto bg-black/90 border border-zinc-900 rounded-xl p-4 font-mono text-xs text-zinc-300 leading-normal mb-5 space-y-4 select-text">
                <div className="text-amber-500 font-bold border-b border-zinc-900 pb-1.5">COLLABORATION HANDOFF INSTRUCTIONS // COPY CAPABLE</div>
                
                <p><strong>Project Overview:</strong> Abyssum Runner is an endless 3D procedural cybernetic runner built using React, Vite, Tailwind CSS v4, and BabylonJS.</p>
                
                <p><strong>Recent Tasks Completed:</strong></p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>Fixed browser / iframe 'Script error' on startup by creating a local procedural HTML5 Canvas radial gradient texture (DynamicTexture), replacing the cross-origin external image files.</li>
                  <li>Spawned glowing energy gates and rift charger multiplier nodes with animated rotating and bobbing kinematics.</li>
                  <li>Engineered a collection particle burst solver (createCollectionParticles) spraying Gold-Orange and Neon-Blue sparks depending on the power-up type.</li>
                  <li>Initiated a Cross Chat Collaboration mechanism with a preloaded handoff state ledger.</li>
                </ul>

                <p><strong>Active Directives for Claude AI:</strong></p>
                <ol className="list-decimal pl-5 space-y-1 text-zinc-400">
                  <li>Incorporate horizontal-flying drone obstacles in open lanes.</li>
                  <li>Incorporate crushing structural gate pillars dropping randomly.</li>
                  <li>Implement passive magnet upgrades drawing crystals within a 3-unit radial coordinate.</li>
                  <li>Enhance the audio synthesizer with high-velocity techno drone background loops.</li>
                </ol>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-900 pt-4 shrink-0">
                <button
                  onClick={() => {
                    const textToCopy = `Hi Claude! Let's collaborate on the Abyssum Runner endless 3D game. Here is our handoff status:\n\n1. SYSTEM TECH: React 19, Vite 6, Tailwind CSS v4, Babylon.js.\n2. LATEST CHANGES IMPLEMENTED:\n   - Swapped external particle textures for locally-drawn procedural DynamicTexture, resolving browser CORS 'Script error' frames.\n   - Programmed Bobbing and Rotating motion on power-ups.\n   - Created collection particles splash system (createCollectionParticles) emitting glowing thematic sparks upon collection.\n   - Added this Cross Chat Handoff dialog module.\n3. FUTURE TASKS TO COMPREHEND:\n   - Spawn drone obstacles moving horizontally across lanes.\n   - Add passive power-up upgrades like an Item Magnet or Protection Shield.\n   - Synchronize dynamic synthesizer drone backtracks matching velocity.\n\nPlease review CLAUDE_HANDOFF.md at the root of the project and help me build these features!`;
                    navigator.clipboard.writeText(textToCopy);
                    setCopiedHandoff(true);
                    setTimeout(() => setCopiedHandoff(false), 3000);
                  }}
                  className={`py-2 px-5 font-mono font-bold uppercase text-[10px] tracking-widest rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                    copiedHandoff 
                      ? 'bg-green-600 text-white' 
                      : 'bg-amber-500 hover:bg-amber-600 text-black'
                  }`}
                >
                  {copiedHandoff ? (
                    <>
                      <Check size={12} />
                      <span>COPIED TO LEDGER!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>COPY HANDOFF PROMPT</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowHandoffModal(false)}
                  className="py-2 px-5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-mono font-bold uppercase text-[10px] tracking-widest rounded-lg cursor-pointer transition-colors"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
