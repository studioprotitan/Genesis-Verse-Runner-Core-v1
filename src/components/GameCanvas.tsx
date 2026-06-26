import React, { useEffect, useRef, useState } from 'react';
import { 
  Engine, 
  Scene, 
  Vector3, 
  Color3, 
  StandardMaterial, 
  MeshBuilder, 
  HemisphericLight, 
  PointLight, 
  FollowCamera, 
  Mesh, 
  ParticleSystem, 
  Texture,
  DynamicTexture,
  CreateBox,
  CreateCylinder,
  CreateSphere,
  ActionManager,
  ExecuteCodeAction,
  TransformNode
} from '@babylonjs/core';
import { GameState, Lane, ObstacleType, ObstacleData, PlayerState, WeaponType } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  onUpdateState: (stats: Partial<PlayerState>) => void;
  onGameOver: () => void;
  isMuted: boolean;
  selectedClass: string;
  onPauseToggle: () => void;
}

export function GameCanvas({
  gameState,
  onUpdateState,
  onGameOver,
  isMuted,
  selectedClass,
  onPauseToggle
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [damageFlash, setDamageFlash] = useState<boolean>(false);
  const flashTimeoutRef = useRef<any>(null);
  const triggerDamageFlashRef = useRef<() => void>(() => {});

  useEffect(() => {
    triggerDamageFlashRef.current = () => {
      setDamageFlash(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        setDamageFlash(false);
      }, 500);
    };
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  // Keep refs to let animation loops read updated values without re-triggering the whole canvas
  const gameStateRef = useRef<GameState>(gameState);
  const selectedClassRef = useRef<string>(selectedClass);
  const isMutedRef = useRef<boolean>(isMuted);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { selectedClassRef.current = selectedClass; }, [selectedClass]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Audio synthesizer engine for real-time sound effects
  const playSynthSFX = (type: 'jump' | 'slide' | 'collect' | 'damage' | 'speed_boost' | 'slam') => {
    if (isMutedRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.18, now); // Avoid clipping

      if (type === 'jump') {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.2);
        osc.connect(master);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'slide') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(150, now + 0.3);
        
        osc.frequency.setValueAtTime(150, now);
        osc.connect(filter);
        filter.connect(master);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'collect') {
        // High fidelity celestial major triad chord
        const notes = [440, 554, 659]; // A4, C#5, E5
        notes.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          osc.frequency.setValueAtTime(f * 1.5, now + 0.08); // Sweet octave shift
          
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + idx * 0.1);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 0.6);
        });
      } else if (type === 'damage') {
        const osc = ctx.createOscillator();
        const oscLow = ctx.createOscillator();
        osc.type = 'sawtooth';
        oscLow.type = 'square';
        
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.4);
        
        oscLow.frequency.setValueAtTime(55, now);
        oscLow.frequency.linearRampToValueAtTime(30, now + 0.4);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);

        osc.connect(filter);
        oscLow.connect(filter);
        filter.connect(master);
        
        osc.start(now);
        oscLow.start(now);
        osc.stop(now + 0.45);
        oscLow.stop(now + 0.45);
      } else if (type === 'speed_boost') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.5);
        osc.connect(master);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'slam') {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.3);
        
        const noise = ctx.createOscillator();
        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(150, now);
        noise.frequency.linearRampToValueAtTime(10, now + 0.2);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(filter);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc.start(now);
        noise.start(now);
        osc.stop(now + 0.35);
        noise.stop(now + 0.35);
      }

      master.connect(ctx.destination);
      // Automatically shut context to free audio channels
      setTimeout(() => { ctx.close().catch(() => {}); }, 1200);
    } catch (e) {
      console.warn('Audio Context failed to trigger in run:', e);
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize 3D Engine & Sizing
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    
    // Sleek cybernetic color theme variables
    scene.clearColor = new Color3(0.02, 0.03, 0.05).toColor4(1);
    scene.ambientColor = new Color3(0.1, 0.12, 0.18);

    // Tech Atmosphere fog
    scene.fogMode = Scene.FOGMODE_EXP;
    scene.fogDensity = 0.015;
    scene.fogColor = new Color3(0.03, 0.04, 0.06);

    // Setup Follow Camera positioned cleanly behind the character
    const camera = new FollowCamera('trackerCamera', new Vector3(0, 4.5, -7), scene);
    camera.radius = 6.2;
    camera.heightOffset = 2.4;
    camera.rotationOffset = 180;
    camera.cameraAcceleration = 0.06; // Dampened trailing
    camera.maxCameraSpeed = 25;
    scene.activeCamera = camera;

    // Atmospheric bio-luminescent flares (Lights)
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.55;
    hemiLight.diffuse = new Color3(0.4, 0.5, 0.75);
    hemiLight.specular = new Color3(0.1, 0.2, 0.35);

    const pointLight = new PointLight('glowLight', new Vector3(0, 5, 0), scene);
    pointLight.intensity = 0.8;
    pointLight.diffuse = new Color3(1.0, 0.85, 0.6); // Warm nuclear core glare

    // Materials Register
    const goldMat = new StandardMaterial('goldMat', scene);
    goldMat.diffuseColor = new Color3(0.95, 0.49, 0.15);
    goldMat.emissiveColor = new Color3(0.48, 0.25, 0.08);
    goldMat.specularColor = new Color3(0.95, 0.7, 0.4);

    const neonBlueMat = new StandardMaterial('neonBlue', scene);
    neonBlueMat.emissiveColor = new Color3(0.95, 0.49, 0.15);
    neonBlueMat.diffuseColor = new Color3(0.3, 0.1, 0.0);

    const warningRedMat = new StandardMaterial('warningRed', scene);
    warningRedMat.emissiveColor = new Color3(1.0, 0.15, 0.15);
    warningRedMat.diffuseColor = new Color3(0.5, 0.05, 0.05);

    const metalDullMat = new StandardMaterial('metalDull', scene);
    metalDullMat.diffuseColor = new Color3(0.2, 0.22, 0.24);
    metalDullMat.specularColor = new Color3(0.4, 0.42, 0.45);

    const shieldEnergyMat = new StandardMaterial('shieldEnergyMat', scene);
    shieldEnergyMat.emissiveColor = new Color3(0.95, 0.49, 0.15);
    shieldEnergyMat.alpha = 0.25;

    const pillarMat = new StandardMaterial('pillarMat', scene);
    pillarMat.diffuseColor = new Color3(0.12, 0.13, 0.15);
    pillarMat.specularColor = new Color3(0.4, 0.4, 0.4);
    pillarMat.emissiveColor = new Color3(0.95, 0.35, 0.05);

    const droneMat = new StandardMaterial('droneMat', scene);
    droneMat.diffuseColor = new Color3(0.08, 0.08, 0.12);
    droneMat.specularColor = new Color3(0.6, 0.3, 0.9);
    droneMat.emissiveColor = new Color3(0.35, 0.1, 0.55);

    const shieldPowerupMat = new StandardMaterial('shieldPowerupMat', scene);
    shieldPowerupMat.diffuseColor = new Color3(0.1, 0.6, 1.0);
    shieldPowerupMat.specularColor = new Color3(0.8, 0.9, 1.0);
    shieldPowerupMat.emissiveColor = new Color3(0.15, 0.75, 1.0);

    const magnetPowerupMat = new StandardMaterial('magnetPowerupMat', scene);
    magnetPowerupMat.diffuseColor = new Color3(1.0, 0.1, 0.4);
    magnetPowerupMat.specularColor = new Color3(1.0, 0.8, 0.9);
    magnetPowerupMat.emissiveColor = new Color3(0.9, 0.05, 0.3);

    // Dynamic Level Track Components
    const TRACK_PLATE_SIZE = 40; // Length
    const LANE_SPACING = 2.4; // Distance between lanes
    const trackPlates: Mesh[] = [];
    const sideVents: Mesh[] = [];
    const obstacles: { mesh: Mesh; data: ObstacleData }[] = [];
    const disposeObstacle = (mesh: Mesh) => {
      if (mesh.metadata?.baseRing) {
        mesh.metadata.baseRing.dispose();
      }
      if (mesh.metadata?.particleSystems) {
        mesh.metadata.particleSystems.forEach((ps: any) => {
          ps.stop();
          ps.dispose();
        });
      }
      mesh.dispose();
    };
    const collectables: Mesh[] = [];

    // Player True Physics Stats
    const initialSpeed = selectedClassRef.current.includes('Pilot') ? 0.33 : selectedClassRef.current.includes('Siren') ? 0.25 : 0.28;
    const playerStats = {
      lane: Lane.CENTER as Lane,
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
      speed: initialSpeed, // Advanced running velocity based on operator frame
      hasShield: false, // Invulnerability hit
      hexShieldTime: 0, // Remaining frames for collection force-field effect
      magnetTime: 0, // Remaining frames for active magnetic attraction
      bonusScore: 0,
      comboCount: 0,
      comboMultiplier: 1,
      comboMessage: '',
      comboMessageTime: 0,
      comboDecay: 0,
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
    };

    // Construct customizable character meshes (Zero asset downloads needed!)
    const characterRoot = new TransformNode('charRoot', scene);
    camera.lockedTarget = characterRoot as any;

    // Core body Cylinder
    const coreBody = CreateCylinder('coreBody', { height: 1.4, diameterTop: 0.48, diameterBottom: 0.35 }, scene);
    coreBody.position.y = 0.75;
    coreBody.material = metalDullMat;
    coreBody.parent = characterRoot;

    // Glowing active visor/head sphere (MOAI "head" node mapping)
    const headVisor = CreateSphere('headVisor', { diameter: 0.48 }, scene);
    headVisor.position.y = 1.6;
    headVisor.material = neonBlueMat;
    headVisor.parent = characterRoot;

    // Emissive Chest plate
    const chestPlate = CreateBox('chestPlate', { size: 0.38, width: 0.45, height: 0.45 }, scene);
    chestPlate.position.y = 0.9;
    chestPlate.position.z = 0.18;
    const chestMat = new StandardMaterial('chestMat', scene);
    chestMat.emissiveColor = new Color3(0.95, 0.49, 0.15);
    chestPlate.material = chestMat;
    chestPlate.parent = characterRoot;

    // Procedural character arms (Swing left & right during runcycle)
    const armL = CreateCylinder('armL', { height: 0.8, diameter: 0.18 }, scene);
    armL.position.x = -0.38;
    armL.position.y = 0.95;
    armL.material = metalDullMat;
    armL.parent = characterRoot;

    const armR = CreateCylinder('armR', { height: 0.8, diameter: 0.18 }, scene);
    armR.position.x = 0.38;
    armR.position.y = 0.95;
    armR.material = metalDullMat;
    armR.parent = characterRoot;

    // Left and Right legs (Swing during runcycles)
    const legL = CreateCylinder('legL', { height: 0.8, diameter: 0.2 }, scene);
    legL.position.x = -0.22;
    legL.position.y = 0.35;
    legL.material = metalDullMat;
    legL.parent = characterRoot;

    const legR = CreateCylinder('legR', { height: 0.8, diameter: 0.2 }, scene);
    legR.position.x = 0.22;
    legR.position.y = 0.35;
    legR.material = metalDullMat;
    legR.parent = characterRoot;

    // HUDRoot indicator attached to head bone representing five signals
    const hudRing = CreateCylinder('hudRing', { height: 0.05, diameter: 0.9 }, scene);
    hudRing.position.y = 2.15; // Offset above head (offset +0.35)
    
    const hudRingMat = new StandardMaterial('hudMat', scene);
    hudRingMat.emissiveColor = new Color3(0.95, 0.49, 0.15);
    hudRingMat.alpha = 0.4;
    hudRing.material = hudRingMat;
    hudRing.parent = characterRoot;

    // Translucent glowing protection shield hull
    const protectionShieldHull = CreateSphere('protectionShieldHull', { diameter: 2.1 }, scene);
    protectionShieldHull.position.y = 0.9;
    const protectionShieldHullMat = new StandardMaterial('protectionShieldHullMat', scene);
    protectionShieldHullMat.diffuseColor = new Color3(0.1, 0.75, 1.0);
    protectionShieldHullMat.emissiveColor = new Color3(0.15, 0.85, 1.0);
    protectionShieldHullMat.specularColor = new Color3(1.0, 1.0, 1.0);
    protectionShieldHullMat.alpha = 0.28;
    protectionShieldHull.material = protectionShieldHullMat;
    protectionShieldHull.parent = characterRoot;
    protectionShieldHull.isVisible = false; // Hidden initially

    // Temporary rotating hexagonal forcefield mesh for collections
    const hexForceField = CreateCylinder('hexForceField', { height: 1.8, diameter: 2.3, tessellation: 6, sideOrientation: Mesh.DOUBLESIDE }, scene);
    hexForceField.position.y = 0.9;
    const hexForceFieldMat = new StandardMaterial('hexForceFieldMat', scene);
    hexForceFieldMat.diffuseColor = new Color3(0.0, 1.0, 0.7);
    hexForceFieldMat.emissiveColor = new Color3(0.0, 0.85, 0.6);
    hexForceFieldMat.specularColor = new Color3(1.0, 1.0, 1.0);
    hexForceFieldMat.alpha = 0.0;
    hexForceFieldMat.backFaceCulling = false;
    hexForceField.material = hexForceFieldMat;
    hexForceField.parent = characterRoot;
    hexForceField.isVisible = false; // Hidden initially

    // Create a high-performance procedural flare texture using HTML5 Canvas to prevent CORS/external resource loading script errors
    const flareTexture = new DynamicTexture("proceduralFlare", 64, scene, true);
    const flareContext = flareTexture.getContext();
    const flareGradient = flareContext.createRadialGradient(32, 32, 0, 32, 32, 32);
    flareGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    flareGradient.addColorStop(0.3, "rgba(255, 200, 100, 0.8)");
    flareGradient.addColorStop(0.6, "rgba(255, 100, 50, 0.3)");
    flareGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    flareContext.fillStyle = flareGradient;
    flareContext.fillRect(0, 0, 64, 64);
    flareTexture.update();

    // Thrust Fire particles from feet boots
    const particleSystem = new ParticleSystem('thrustParticles', 150, scene);
    // Minimal solid circular mask particle texture
    particleSystem.particleTexture = flareTexture;
    particleSystem.emitter = coreBody; // Boot level
    particleSystem.minEmitBox = new Vector3(-0.25, -0.65, -0.1);
    particleSystem.maxEmitBox = new Vector3(0.25, -0.65, 0.1);
    particleSystem.color1 = new Color3(0.95, 0.49, 0.15).toColor4(1);
    particleSystem.color2 = new Color3(0.75, 0.25, 0.05).toColor4(0.8);
    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.18;
    particleSystem.minLifeTime = 0.15;
    particleSystem.maxLifeTime = 0.55;
    particleSystem.emitRate = 45;
    particleSystem.gravity = new Vector3(0, -4, 0); // Thrust gravity
    particleSystem.direction1 = new Vector3(-0.2, -1, -0.2);
    particleSystem.direction2 = new Vector3(0.2, -1, 0.2);
    particleSystem.start();


    // Helper functions to create a new track plate segment
    const createTrackPlate = (zPosition: number) => {
      // Plate length 40 units, width 8 units
      const plate = CreateBox(`trackPlate_${zPosition}`, { width: 8.5, height: 0.4, depth: TRACK_PLATE_SIZE }, scene);
      plate.position.y = -0.2;
      plate.position.z = zPosition;

      const plateMat = new StandardMaterial(`plateMat_${zPosition}`, scene);
      plateMat.diffuseColor = new Color3(0.06, 0.08, 0.1);
      plateMat.specularColor = new Color3(0.12, 0.14, 0.18);
      plateMat.emissiveColor = new Color3(0.015, 0.02, 0.03);
      plate.material = plateMat;

      // Render glowing border lane markers (A-lines)
      for (const offset of [-LANE_SPACING * 1.5, -LANE_SPACING * 0.5, LANE_SPACING * 0.5, LANE_SPACING * 1.5]) {
        const edge = CreateBox(`edgeLane_${zPosition}_${offset}`, { width: 0.08, height: 0.1, depth: TRACK_PLATE_SIZE }, scene);
        edge.position.y = 0.01;
        edge.position.x = offset;
        edge.material = neonBlueMat;
        edge.parent = plate;
      }

      // Add high-tech details like support arcs / steam pipes alongside
      const tubeLeft = CreateBox(`tubeL_${zPosition}`, { width: 0.35, height: 0.35, depth: TRACK_PLATE_SIZE }, scene);
      tubeLeft.position.x = -5.4;
      tubeLeft.position.y = 0.25;
      tubeLeft.material = metalDullMat;
      tubeLeft.parent = plate;

      const tubeRight = CreateBox(`tubeR_${zPosition}`, { width: 0.35, height: 0.35, depth: TRACK_PLATE_SIZE }, scene);
      tubeRight.position.x = 5.4;
      tubeRight.position.y = 0.25;
      tubeRight.material = metalDullMat;
      tubeRight.parent = plate;

      // Add architectural steam arches every 80 units
      if (Math.round(zPosition) % 80 === 0) {
        const archHeight = 4.8;
        const arch = CreateBox(`archArc_${zPosition}`, { width: 11.2, height: 0.25, depth: 0.45 }, scene);
        arch.position.y = archHeight;
        arch.parent = plate;
        arch.material = metalDullMat;

        // Visual Neon strip under archway backplate
        const stripe = CreateBox(`archStripe_${zPosition}`, { width: 10.5, height: 0.05, depth: 0.08 }, scene);
        stripe.position.y = archHeight - 0.14;
        stripe.material = neonBlueMat;
        stripe.parent = plate;
      }

      trackPlates.push(plate);

      // Return Z positions to calculate spawning
      return plate;
    };

    // Helper function to trigger a glowing splash particle burst on collecting a power-up
    const createCollectionParticles = (position: Vector3, isGold: boolean) => {
      const splash = new ParticleSystem('splashParticles', 40, scene);
      splash.particleTexture = flareTexture;
      splash.emitter = position;
      splash.minEmitBox = new Vector3(-0.25, -0.25, -0.25);
      splash.maxEmitBox = new Vector3(0.25, 0.25, 0.25);
      
      if (isGold) {
        // Glorious golden-orange sparks
        splash.color1 = new Color3(0.95, 0.49, 0.15).toColor4(1.0);
        splash.color2 = new Color3(1.0, 0.8, 0.2).toColor4(0.8);
      } else {
        // Bio-luminescent cyan-blue sparks
        splash.color1 = new Color3(0.1, 0.82, 0.95).toColor4(1.0);
        splash.color2 = new Color3(0.05, 0.45, 0.88).toColor4(0.85);
      }
      
      splash.minSize = 0.08;
      splash.maxSize = 0.3;
      splash.minLifeTime = 0.15;
      splash.maxLifeTime = 0.55;
      splash.emitRate = 150;
      splash.manualEmitCount = 35; // One-time burst of particles
      splash.gravity = new Vector3(0, -3.5, 0);
      splash.direction1 = new Vector3(-1.2, 1.2, -1.2);
      splash.direction2 = new Vector3(1.2, 2.2, 1.2);
      splash.minEmitPower = 2.0;
      splash.maxEmitPower = 4.5;
      
      splash.start();
      
      // Auto dispose after particles finish running
      setTimeout(() => {
        if (!scene.isDisposed) {
          splash.dispose();
        }
      }, 750);
    };

    // Helper functions to generate obstacles on a track plate
    const spawnObstaclesOnPlate = (zPosition: number) => {
      // First track segment at Z = 0-40 remains strictly clear of obstacles for a smooth start
      if (zPosition < 40) return;

      const possibleLanes = [Lane.LEFT, Lane.CENTER, Lane.RIGHT];
      
      // Scale difficulty from 0.0 to 1.0 based on distance (reaches max difficulty at 4000m)
      const difficultyFactor = Math.min(1.0, zPosition / 4000);
      
      // Obstacle density starts at 1-2 items, scaling up to 2-3 items as difficulty rises
      let itemsToSpawn = 1;
      const spawnRoll = Math.random();
      if (difficultyFactor < 0.25) {
        itemsToSpawn = spawnRoll < 0.5 ? 1 : 2;
      } else if (difficultyFactor < 0.6) {
        itemsToSpawn = spawnRoll < 0.15 ? 1 : (spawnRoll < 0.85 ? 2 : 3);
      } else {
        itemsToSpawn = spawnRoll < 0.05 ? 1 : (spawnRoll < 0.45 ? 2 : 3);
      }

      const isImpassable = (type: ObstacleType) => {
        return type === ObstacleType.SPIKE_ROCK || 
               type === ObstacleType.GATE_PILLAR || 
               type === ObstacleType.DRONE;
      };

      let impassableCount = 0;

      for (let i = 0; i < itemsToSpawn; i++) {
        if (possibleLanes.length === 0) break;
        
        // Grab a lane and splice to avoid dual stacks
        const laneIndex = Math.floor(Math.random() * possibleLanes.length);
        const activeLane = possibleLanes.splice(laneIndex, 1)[0];
        
        // Determine type dynamically: hazards probability starts at 55%, scaling up to 80% at maximum difficulty
        const hazardChance = 0.55 + (difficultyFactor * 0.25);
        let selectedType: ObstacleType;
        const typeRoll = Math.random();

        if (typeRoll < hazardChance) {
          // Spawn a hazard
          const hazardRoll = Math.random();
          if (hazardRoll < 0.22) {
            selectedType = ObstacleType.BARRIER_LOW;
          } else if (hazardRoll < 0.44) {
            selectedType = ObstacleType.BARRIER_HIGH;
          } else if (hazardRoll < 0.64) {
            selectedType = ObstacleType.SPIKE_ROCK;
          } else if (hazardRoll < 0.82) {
            selectedType = ObstacleType.GATE_PILLAR;
          } else {
            selectedType = ObstacleType.DRONE;
          }
        } else {
          // Spawn a collectible or powerup
          const collectibleRoll = Math.random();
          if (collectibleRoll < 0.15) {
            selectedType = ObstacleType.SHIELD_POWERUP;
          } else if (collectibleRoll < 0.30) {
            selectedType = ObstacleType.MAGNET;
          } else if (collectibleRoll < 0.70) {
            selectedType = ObstacleType.ENERGY_GATE;
          } else {
            selectedType = ObstacleType.RIFT_CHARGER;
          }
        }

        // Safety guarantee: If 3 items are spawned and 2 are already impassable hazards,
        // force the third item to be a passable obstacle (jumpable/slidable barrier or energy gate) so the player can always bypass it
        if (itemsToSpawn === 3 && i === 2 && impassableCount >= 2) {
          if (isImpassable(selectedType)) {
            const passableOptions = [ObstacleType.BARRIER_LOW, ObstacleType.BARRIER_HIGH, ObstacleType.ENERGY_GATE];
            selectedType = passableOptions[Math.floor(Math.random() * passableOptions.length)];
          }
        }

        if (isImpassable(selectedType)) {
          impassableCount++;
        }

        const laneX = (activeLane - 1) * LANE_SPACING;
        const obstacleZ = zPosition - 15 + (i * 15) + (Math.random() * 8); // Spread positioning

        let obsMesh: Mesh;
        const id = `obs_${selectedType}_${activeLane}_${obstacleZ}`;

        if (selectedType === ObstacleType.BARRIER_LOW) {
          // Low laser gate: Jump over
          obsMesh = CreateBox(id, { width: 2.2, height: 0.65, depth: 0.38 }, scene);
          obsMesh.position.y = 0.325;
          obsMesh.material = warningRedMat;
        } else if (selectedType === ObstacleType.BARRIER_HIGH) {
          // High scanning beam: Slide under
          obsMesh = CreateBox(id, { width: 2.2, height: 0.65, depth: 0.38 }, scene);
          obsMesh.position.y = 1.78; // Offset high with space to slip past
          obsMesh.material = warningRedMat;

          // Support neon struts on sides
          const poleL = CreateCylinder(`poleL_${id}`, { height: 2.5, diameter: 0.1 }, scene);
          poleL.position.x = laneX - 1.05;
          poleL.position.y = 1.25;
          poleL.position.z = obstacleZ;
          poleL.material = metalDullMat;
          obstacles.push({ mesh: poleL, data: { id: `strutL_${id}`, type: ObstacleType.SPIKE_ROCK, lane: activeLane, zPosition: obstacleZ } });

          const poleR = CreateCylinder(`poleR_${id}`, { height: 2.5, diameter: 0.1 }, scene);
          poleR.position.x = laneX + 1.05;
          poleR.position.y = 1.25;
          poleR.position.z = obstacleZ;
          poleR.material = metalDullMat;
          obstacles.push({ mesh: poleR, data: { id: `strutR_${id}`, type: ObstacleType.SPIKE_ROCK, lane: activeLane, zPosition: obstacleZ } });

        } else if (selectedType === ObstacleType.SPIKE_ROCK) {
          // Column barrier rock: Shift lanes
          obsMesh = CreateCylinder(id, { height: 3.5, diameterTop: 0.25, diameterBottom: 0.95 }, scene);
          obsMesh.position.y = 1.75;
          obsMesh.material = metalDullMat;
        } else if (selectedType === ObstacleType.GATE_PILLAR) {
          // Structural gate pillar that drops or rises dynamically
          const isRising = Math.random() < 0.5;
          const idSub = isRising ? 'rising' : 'dropping';
          const fullId = `${id}_${idSub}`;
          
          if (isRising) {
            obsMesh = CreateCylinder(fullId, { height: 3.0, diameter: 0.75, tessellation: 16 }, scene);
            obsMesh.position.y = -2.5; // Starts underground
            obsMesh.material = pillarMat;

            // Glowing base ring on the floor
            const baseRing = CreateCylinder(`ring_${fullId}`, { height: 0.05, diameter: 1.0, tessellation: 16 }, scene);
            baseRing.position.x = laneX;
            baseRing.position.y = 0.02;
            baseRing.position.z = obstacleZ;
            baseRing.material = warningRedMat;
            
            // Create neon vapor trail for rising pillar
            const pillarTrail = new ParticleSystem(`pillarTrail_${fullId}`, 80, scene);
            pillarTrail.particleTexture = flareTexture;
            pillarTrail.emitter = obsMesh;
            pillarTrail.minEmitBox = new Vector3(-0.3, -1.3, -0.1);
            pillarTrail.maxEmitBox = new Vector3(0.3, 1.3, 0.1);
            pillarTrail.color1 = new Color3(1.0, 0.35, 0.05).toColor4(1.0);
            pillarTrail.color2 = new Color3(0.8, 0.1, 0.05).toColor4(0.7);
            pillarTrail.minSize = 0.08;
            pillarTrail.maxSize = 0.28;
            pillarTrail.minLifeTime = 0.25;
            pillarTrail.maxLifeTime = 0.65;
            pillarTrail.emitRate = 45;
            pillarTrail.direction1 = new Vector3(-0.05, -0.1, -1.0);
            pillarTrail.direction2 = new Vector3(0.05, 0.1, -0.5);
            pillarTrail.minEmitPower = 0.5;
            pillarTrail.maxEmitPower = 1.5;
            pillarTrail.start();

            obsMesh.metadata = { baseRing, particleSystems: [pillarTrail] };
          } else {
            obsMesh = CreateCylinder(fullId, { height: 3.5, diameter: 0.75, tessellation: 16 }, scene);
            obsMesh.position.y = 6.0; // Starts high above
            obsMesh.material = pillarMat;

            // Ground-level warning projection
            const warningLaser = CreateCylinder(`laser_${fullId}`, { height: 0.02, diameter: 0.9, tessellation: 16 }, scene);
            warningLaser.position.x = laneX;
            warningLaser.position.y = 0.02;
            warningLaser.position.z = obstacleZ;
            warningLaser.material = warningRedMat;
            
            // Create neon vapor trail for falling pillar
            const pillarTrail = new ParticleSystem(`pillarTrail_${fullId}`, 80, scene);
            pillarTrail.particleTexture = flareTexture;
            pillarTrail.emitter = obsMesh;
            pillarTrail.minEmitBox = new Vector3(-0.3, -1.5, -0.1);
            pillarTrail.maxEmitBox = new Vector3(0.3, 1.5, 0.1);
            pillarTrail.color1 = new Color3(1.0, 0.35, 0.05).toColor4(1.0);
            pillarTrail.color2 = new Color3(0.8, 0.1, 0.05).toColor4(0.7);
            pillarTrail.minSize = 0.08;
            pillarTrail.maxSize = 0.28;
            pillarTrail.minLifeTime = 0.25;
            pillarTrail.maxLifeTime = 0.65;
            pillarTrail.emitRate = 45;
            pillarTrail.direction1 = new Vector3(-0.05, -0.1, -1.0);
            pillarTrail.direction2 = new Vector3(0.05, 0.1, -0.5);
            pillarTrail.minEmitPower = 0.5;
            pillarTrail.maxEmitPower = 1.5;
            pillarTrail.start();

            obsMesh.metadata = { baseRing: warningLaser, particleSystems: [pillarTrail] };
          }
        } else if (selectedType === ObstacleType.DRONE) {
          // Horizontal moving drone obstacle
          const isLeftToRight = Math.random() < 0.5;
          const fullId = `${id}_drone`;
          
          // Randomize altitude (0.5 for LOW, 1.15 for MID, 1.75 for HIGH)
          const altitudeRand = Math.random();
          let baseAltitude = 1.15;
          let droneAltitudeType: 'low' | 'mid' | 'high' = 'mid';
          let trailColor1 = new Color3(0.8, 0.15, 1.0); // Mid is purple
          let trailColor2 = new Color3(0.35, 0.05, 0.8);
          
          if (altitudeRand < 0.35) {
            baseAltitude = 0.5; // Low altitude drone
            droneAltitudeType = 'low';
            trailColor1 = new Color3(1.0, 0.7, 0.1); // Bright neon amber/orange
            trailColor2 = new Color3(0.9, 0.2, 0.0);
          } else if (altitudeRand > 0.68) {
            baseAltitude = 1.75; // High altitude drone
            droneAltitudeType = 'high';
            trailColor1 = new Color3(0.1, 0.8, 1.0); // Bright neon cyan/blue
            trailColor2 = new Color3(0.05, 0.35, 0.8);
          }
          
          obsMesh = CreateBox(fullId, { width: 0.8, height: 0.3, depth: 0.5 }, scene);
          obsMesh.material = droneMat;
          obsMesh.position.y = baseAltitude;

          // Build wings
          const leftWing = CreateBox(`wingL_${fullId}`, { width: 0.5, height: 0.08, depth: 0.15 }, scene);
          leftWing.position.x = -0.55;
          leftWing.parent = obsMesh;
          leftWing.material = metalDullMat;

          const rightWing = CreateBox(`wingR_${fullId}`, { width: 0.5, height: 0.08, depth: 0.15 }, scene);
          rightWing.position.x = 0.55;
          rightWing.parent = obsMesh;
          rightWing.material = metalDullMat;

          // Build rotors
          const rotorL = CreateBox(`rotorL_${fullId}`, { width: 0.08, height: 0.02, depth: 0.4 }, scene);
          rotorL.position.x = -0.75;
          rotorL.position.y = 0.08;
          rotorL.parent = obsMesh;
          rotorL.material = warningRedMat;

          const rotorR = CreateBox(`rotorR_${fullId}`, { width: 0.08, height: 0.02, depth: 0.4 }, scene);
          rotorR.position.x = 0.75;
          rotorR.position.y = 0.08;
          rotorR.parent = obsMesh;
          rotorR.material = warningRedMat;

          // Randomized movement properties
          const speedMultiplier = 0.8 + Math.random() * 0.7;
          const phaseOffset = Math.random() * Math.PI * 2;
          
          // Create twin neon vapor trails emitting from left and right rotors
          const droneTrailL = new ParticleSystem(`droneTrailL_${fullId}`, 50, scene);
          droneTrailL.particleTexture = flareTexture;
          droneTrailL.emitter = rotorL;
          droneTrailL.minEmitBox = new Vector3(-0.05, -0.05, -0.05);
          droneTrailL.maxEmitBox = new Vector3(0.05, 0.05, 0.05);
          droneTrailL.color1 = trailColor1.toColor4(1.0);
          droneTrailL.color2 = trailColor2.toColor4(0.7);
          droneTrailL.minSize = 0.04;
          droneTrailL.maxSize = 0.16;
          droneTrailL.minLifeTime = 0.2;
          droneTrailL.maxLifeTime = 0.5;
          droneTrailL.emitRate = 30;
          droneTrailL.direction1 = new Vector3(-0.05, -0.05, -1.0);
          droneTrailL.direction2 = new Vector3(0.05, 0.05, -0.6);
          droneTrailL.minEmitPower = 0.8;
          droneTrailL.maxEmitPower = 1.8;
          droneTrailL.start();

          const droneTrailR = new ParticleSystem(`droneTrailR_${fullId}`, 50, scene);
          droneTrailR.particleTexture = flareTexture;
          droneTrailR.emitter = rotorR;
          droneTrailR.minEmitBox = new Vector3(-0.05, -0.05, -0.05);
          droneTrailR.maxEmitBox = new Vector3(0.05, 0.05, 0.05);
          droneTrailR.color1 = trailColor1.toColor4(1.0);
          droneTrailR.color2 = trailColor2.toColor4(0.7);
          droneTrailR.minSize = 0.04;
          droneTrailR.maxSize = 0.16;
          droneTrailR.minLifeTime = 0.2;
          droneTrailR.maxLifeTime = 0.5;
          droneTrailR.emitRate = 30;
          droneTrailR.direction1 = new Vector3(-0.05, -0.05, -1.0);
          droneTrailR.direction2 = new Vector3(0.05, 0.05, -0.6);
          droneTrailR.minEmitPower = 0.8;
          droneTrailR.maxEmitPower = 1.8;
          droneTrailR.start();

          obsMesh.metadata = { 
            rotorL, 
            rotorR, 
            leftToRight: isLeftToRight,
            speedMultiplier,
            phaseOffset,
            particleSystems: [droneTrailL, droneTrailR],
            baseAltitude,
            droneAltitudeType
          };
        } else if (selectedType === ObstacleType.ENERGY_GATE) {
          // Emissive blue crystal cell to collect: restores energy and points
          obsMesh = CreateSphere(id, { diameter: 0.55 }, scene);
          obsMesh.position.y = 0.85;
          obsMesh.material = neonBlueMat;
        } else if (selectedType === ObstacleType.SHIELD_POWERUP) {
          // Protection Shield power-up: glowing crest/disc structure
          const fullId = `${id}_shield`;
          obsMesh = CreateCylinder(fullId, { height: 0.12, diameter: 0.8, tessellation: 16 }, scene);
          obsMesh.rotation.x = Math.PI / 2; // Standing vertically
          obsMesh.position.y = 0.85;
          obsMesh.material = shieldPowerupMat;

          // Inner glowing core
          const shieldCore = CreateSphere(`core_${fullId}`, { diameter: 0.4 }, scene);
          shieldCore.parent = obsMesh;
          shieldCore.material = neonBlueMat;

          // Glowing neon trail
          const shieldTrail = new ParticleSystem(`shieldTrail_${fullId}`, 40, scene);
          shieldTrail.particleTexture = flareTexture;
          shieldTrail.emitter = obsMesh;
          shieldTrail.minEmitBox = new Vector3(-0.2, -0.2, -0.2);
          shieldTrail.maxEmitBox = new Vector3(0.2, 0.2, 0.2);
          shieldTrail.color1 = new Color3(0.1, 0.75, 1.0).toColor4(1.0);
          shieldTrail.color2 = new Color3(0.05, 0.45, 0.8).toColor4(0.6);
          shieldTrail.minSize = 0.05;
          shieldTrail.maxSize = 0.2;
          shieldTrail.minLifeTime = 0.25;
          shieldTrail.maxLifeTime = 0.6;
          shieldTrail.emitRate = 25;
          shieldTrail.direction1 = new Vector3(-0.05, -0.05, -1.0);
          shieldTrail.direction2 = new Vector3(0.05, 0.05, -0.5);
          shieldTrail.minEmitPower = 0.5;
          shieldTrail.maxEmitPower = 1.5;
          shieldTrail.start();

          obsMesh.metadata = { particleSystems: [shieldTrail] };
        } else if (selectedType === ObstacleType.MAGNET) {
          // Magnet power-up: standing ring with dual-polarized poles (Red North, Blue South)
          const fullId = `${id}_magnet`;
          obsMesh = CreateCylinder(fullId, { height: 0.12, diameter: 0.8, tessellation: 16 }, scene);
          obsMesh.rotation.x = Math.PI / 2; // Standing vertically
          obsMesh.position.y = 0.85;
          obsMesh.material = magnetPowerupMat;

          // Two polar segments
          const poleN = CreateBox(`poleN_${fullId}`, { width: 0.2, height: 0.35, depth: 0.2 }, scene);
          poleN.parent = obsMesh;
          poleN.position.x = -0.3;
          poleN.position.y = 0.15;
          poleN.material = warningRedMat; // Red (North)

          const poleS = CreateBox(`poleS_${fullId}`, { width: 0.2, height: 0.35, depth: 0.2 }, scene);
          poleS.parent = obsMesh;
          poleS.position.x = 0.3;
          poleS.position.y = 0.15;
          poleS.material = neonBlueMat; // Blue (South)

          // Glowing magnetic pink/magenta trail
          const magnetTrail = new ParticleSystem(`magnetTrail_${fullId}`, 45, scene);
          magnetTrail.particleTexture = flareTexture;
          magnetTrail.emitter = obsMesh;
          magnetTrail.minEmitBox = new Vector3(-0.25, -0.25, -0.25);
          magnetTrail.maxEmitBox = new Vector3(0.25, 0.25, 0.25);
          magnetTrail.color1 = new Color3(1.0, 0.1, 0.5).toColor4(1.0);
          magnetTrail.color2 = new Color3(0.5, 0.0, 0.8).toColor4(0.6);
          magnetTrail.minSize = 0.05;
          magnetTrail.maxSize = 0.2;
          magnetTrail.minLifeTime = 0.25;
          magnetTrail.maxLifeTime = 0.6;
          magnetTrail.emitRate = 30;
          magnetTrail.direction1 = new Vector3(-0.05, -0.05, -1.0);
          magnetTrail.direction2 = new Vector3(0.05, 0.05, -0.5);
          magnetTrail.minEmitPower = 0.5;
          magnetTrail.maxEmitPower = 1.5;
          magnetTrail.start();

          obsMesh.metadata = { particleSystems: [magnetTrail] };
        } else {
          // Golden multiplier power-up node
          obsMesh = CreateBox(id, { size: 0.45 }, scene);
          obsMesh.position.y = 0.75;
          obsMesh.material = goldMat;
        }

        obsMesh.position.x = laneX;
        obsMesh.position.z = obstacleZ;

        // Custom properties storage for bounds detection
        obstacles.push({
          mesh: obsMesh,
          data: { id, type: selectedType, lane: activeLane, zPosition: obstacleZ }
        });
      }
    };

    // Initialize track plates
    let currentSpawnZ = 0;
    for (let index = 0; index < 4; index++) {
      createTrackPlate(currentSpawnZ);
      spawnObstaclesOnPlate(currentSpawnZ);
      currentSpawnZ += TRACK_PLATE_SIZE;
    }

    // Keyboard bindings listener
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // PAUSE/UNPAUSE (Escape or P/p)
      if (e.key === 'Escape' || key === 'p') {
        if (gameStateRef.current === GameState.PLAYING || gameStateRef.current === GameState.PAUSED) {
          onPauseToggle();
          return;
        }
      }

      if (gameStateRef.current !== GameState.PLAYING) return;

      // LEFT SHIFT
      if (key === 'a' || e.key === 'ArrowLeft') {
        if (playerStats.lane > Lane.LEFT) {
          playerStats.lane -= 1;
          playerStats.targetX = (playerStats.lane - 1) * LANE_SPACING;
        }
      }
      // RIGHT SHIFT
      if (key === 'd' || e.key === 'ArrowRight') {
        if (playerStats.lane < Lane.RIGHT) {
          playerStats.lane += 1;
          playerStats.targetX = (playerStats.lane - 1) * LANE_SPACING;
        }
      }
      // JUMP (W key, Space or ArrowUp)
      if (key === 'w' || e.key === ' ' || e.key === 'ArrowUp') {
        if (!playerStats.isJumping && !playerStats.isSliding) {
          playerStats.isJumping = true;
          playerStats.jumpTime = 0.0;
          playSynthSFX('jump');
        }
      }
      // SLIDE (S key or ArrowDown)
      if (key === 's' || e.key === 'ArrowDown') {
        if (!playerStats.isSliding && !playerStats.isJumping) {
          playerStats.isSliding = true;
          playerStats.slideTime = 0.0;
          playSynthSFX('slide');
          
          // Shrink body scale during slides to slip below tall laser gates securely
          coreBody.scaling.y = 0.55;
          coreBody.position.y = 0.42;
          headVisor.position.y = 0.85;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Mouse Clicks/Touch controls fallback
    const handleWindowClick = (e: MouseEvent) => {
      if (gameStateRef.current !== GameState.PLAYING) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Click on top half -> JUMP
      if (clickY < height * 0.35) {
        if (!playerStats.isJumping && !playerStats.isSliding) {
          playerStats.isJumping = true;
          playerStats.jumpTime = 0.0;
          playSynthSFX('jump');
        }
      } 
      // Click on bottom half -> SLIDE
      else if (clickY > height * 0.70) {
        if (!playerStats.isSliding && !playerStats.isJumping) {
          playerStats.isSliding = true;
          playerStats.slideTime = 0.0;
          playSynthSFX('slide');
          coreBody.scaling.y = 0.55;
          coreBody.position.y = 0.42;
          headVisor.position.y = 0.85;
        }
      } 
      // Left side click -> LANE LEFT
      else if (clickX < width * 0.35) {
        if (playerStats.lane > Lane.LEFT) {
          playerStats.lane -= 1;
          playerStats.targetX = (playerStats.lane - 1) * LANE_SPACING;
        }
      } 
      // Right side click -> LANE RIGHT
      else if (clickX > width * 0.65) {
        if (playerStats.lane < Lane.RIGHT) {
          playerStats.lane += 1;
          playerStats.targetX = (playerStats.lane - 1) * LANE_SPACING;
        }
      }
    };

    window.addEventListener('click', handleWindowClick);
    
    // Multiplier combo handler
    const addComboPoints = (baseMultiplierCoins: number) => {
      playerStats.comboCount += 1;
      playerStats.comboMultiplier = 1 + Math.floor(playerStats.comboCount / 5);
      if (playerStats.comboMultiplier > 1) {
        playerStats.bonusScore += 350 * (playerStats.comboMultiplier - 1) * baseMultiplierCoins;
      }
      playerStats.comboDecay = 180; // 3 seconds at 60fps
      playerStats.comboMessage = `+${playerStats.comboCount} COMBO! (${playerStats.comboMultiplier}x Score)`;
      playerStats.comboMessageTime = 75; // 1.25 seconds duration
    };

    // Score accumulation tick rates
    let distanceCount = 0;
    let frameCycle = 0;
    let shakeRemaining = 0;

    // Core Animation Frame Callback
    engine.runRenderLoop(() => {
      frameCycle++;
      const currentGState = gameStateRef.current;

      if (currentGState === GameState.PLAYING) {
        // Camera shake decay calculation
        if (shakeRemaining > 0) {
          shakeRemaining--;
          const shakeIntensity = 0.28 * (shakeRemaining / 16);
          camera.heightOffset = 2.4 + (Math.random() * 2 - 1) * shakeIntensity;
          camera.rotationOffset = 180 + (Math.random() * 2 - 1) * shakeIntensity * 12;
        } else {
          camera.heightOffset = 2.4;
          camera.rotationOffset = 180;
        }

        // 1. Advance Player Position Z
        playerStats.distance += playerStats.speed;
        
        // Speed scaling difficulty multiplier (increases smoothly over time and distance)
        const baseSpeed = selectedClassRef.current.includes('Pilot') ? 0.33 : selectedClassRef.current.includes('Siren') ? 0.25 : 0.28;
        // Allows speed to scale up to 1.9x base speed as the run distance increases
        const targetMultiplier = 1.0 + Math.min(0.9, playerStats.distance * 0.0002);
        playerStats.speed = baseSpeed * targetMultiplier;
        
        // Shift Z-root of characters
        characterRoot.position.z = playerStats.distance;

        // PointLight follows the player's focus path
        pointLight.position.x = characterRoot.position.x;
        pointLight.position.z = characterRoot.position.z + 5;

        // 2. Interpolate Lane Shifts
        playerStats.currentX += (playerStats.targetX - playerStats.currentX) * 0.15;
        characterRoot.position.x = playerStats.currentX;

        // Tilt torso/arms slightly when shifting lanes left/right to achieve professional animation weight
        characterRoot.rotation.z = -(playerStats.targetX - playerStats.currentX) * 0.14;

        // 3. Jump Flight Arc Calculations (Standard parabolic flight)
        if (playerStats.isJumping) {
          playerStats.jumpTime += 0.045;
          const jumpHeightFactor = Math.sin(playerStats.jumpTime * Math.PI); // Parabola curve
          playerStats.y = jumpHeightFactor * 2.25; // Scale height to jump over blocks securely

          if (playerStats.jumpTime >= 1.0) {
            playerStats.isJumping = false;
            playerStats.y = 0.0;
          }
          characterRoot.position.y = playerStats.y;
        }

        // 4. Slide Duration tracking
        if (playerStats.isSliding) {
          playerStats.slideTime += 0.038;
          if (playerStats.slideTime >= 1.0) {
            playerStats.isSliding = false;
            
            // Restore normal tall posture
            coreBody.scaling.y = 1.0;
            coreBody.position.y = 0.75;
            headVisor.position.y = 1.6;
          }
        }

        // 5. Aesthetic visual arm and leg swings mapping
        if (!playerStats.isJumping && !playerStats.isSliding) {
          const runCycle = (playerStats.distance * 0.45);
          armL.rotation.x = Math.sin(runCycle) * 0.85;
          armR.rotation.x = -Math.sin(runCycle) * 0.85;
          legL.rotation.x = -Math.sin(runCycle) * 0.85;
          legR.rotation.x = Math.sin(runCycle) * 0.85;
        } else if (playerStats.isJumping) {
          // Dynamic tuck visual
          armL.rotation.x = -0.5;
          armR.rotation.x = -0.5;
          legL.rotation.x = 0.3;
          legR.rotation.x = 0.3;
        } else if (playerStats.isSliding) {
          // Slide pose
          armL.rotation.x = 1.2;
          armR.rotation.x = 1.2;
          legL.rotation.x = -1.0;
          legR.rotation.x = -1.0;
        }

        // Slowly decay energy bar over travel
        playerStats.energy = Math.max(0, playerStats.energy - 0.02);

        // Update temporary rotating hexagonal force-field visual effect
        if (playerStats.hexShieldTime > 0 || playerStats.magnetTime > 0) {
          const maxTime = Math.max(playerStats.hexShieldTime, playerStats.magnetTime);
          
          if (playerStats.hexShieldTime > 0) playerStats.hexShieldTime -= 1;
          if (playerStats.magnetTime > 0) playerStats.magnetTime -= 1;
          
          hexForceField.isVisible = true;
          
          // Fast continuous spin on multiple axes for high-tech holographic simulation feel
          const spinSpeed = playerStats.magnetTime > 0 ? 0.085 : 0.045;
          hexForceField.rotation.y += spinSpeed;
          hexForceField.rotation.x += spinSpeed * 0.35;
          
          // Set color based on active effect: magnet takes visual precedence with a magenta/pink hue
          if (playerStats.magnetTime > 0) {
            hexForceFieldMat.emissiveColor = new Color3(1.0, 0.0, 0.5); // Pink/Magenta for Magnetism
            hexForceFieldMat.diffuseColor = new Color3(0.8, 0.0, 0.4);
          } else {
            hexForceFieldMat.emissiveColor = new Color3(0.0, 0.85, 0.6); // Cyan/Green for Shield/Energy
            hexForceFieldMat.diffuseColor = new Color3(0.0, 1.0, 0.7);
          }
          
          // Interpolate/fade alpha
          if (maxTime < 15) {
            // Fade out at the end of the duration
            hexForceFieldMat.alpha = (maxTime / 15) * 0.38;
          } else if (hexForceFieldMat.alpha < 0.38) {
            // Smoothly fade in upon activation
            hexForceFieldMat.alpha = Math.min(0.38, hexForceFieldMat.alpha + 0.05);
          }
          
          if (playerStats.hexShieldTime === 0 && playerStats.magnetTime === 0) {
            hexForceField.isVisible = false;
            hexForceFieldMat.alpha = 0.0;
          }
        }

        // Decay combo timers in real-time
        if (playerStats.comboCount > 0) {
          playerStats.comboDecay -= 1;
          if (playerStats.comboDecay <= 0) {
            playerStats.comboCount = 0;
            playerStats.comboMultiplier = 1;
            playerStats.comboMessage = 'COMBO LOST';
            playerStats.comboMessageTime = 60; // show 'COMBO LOST' for 1 second
          }
        }

        if (playerStats.comboMessageTime > 0) {
          playerStats.comboMessageTime -= 1;
          if (playerStats.comboMessageTime === 0) {
            playerStats.comboMessage = '';
          }
        }

        // Map relative scores (including multiplier-driven bonus scores)
        playerStats.score = Math.floor(playerStats.distance + (playerStats.coins * 350) + playerStats.bonusScore);

        // Sync visual data updates down to overlay HUD Component
        if (frameCycle % 4 === 0) {
          onUpdateState({
            lane: playerStats.lane,
            isJumping: playerStats.isJumping,
            isSliding: playerStats.isSliding,
            score: playerStats.score,
            distance: playerStats.distance,
            energy: playerStats.energy,
            speed: playerStats.speed,
            health: playerStats.health,
            magnetTime: playerStats.magnetTime,
            hasShield: playerStats.hasShield,
            comboCount: playerStats.comboCount,
            comboMultiplier: playerStats.comboMultiplier,
            comboMessage: playerStats.comboMessage,
            comboMessageTime: playerStats.comboMessageTime,
            currentWeapon: playerStats.currentWeapon,
            weaponAmmo: playerStats.weaponAmmo,
            weaponCooldown: playerStats.weaponCooldown,
            autoFireEnabled: playerStats.autoFireEnabled,
          });
        }

        // 6. Level Spawning and garbage dispose management
        if (playerStats.distance > currentSpawnZ - (TRACK_PLATE_SIZE * 3)) {
          createTrackPlate(currentSpawnZ);
          spawnObstaclesOnPlate(currentSpawnZ);
          currentSpawnZ += TRACK_PLATE_SIZE;
        }

        // Dispose spent plates and obstacles far behind
        if (trackPlates.length > 0 && trackPlates[0].position.z < playerStats.distance - TICKS_CLEANUP()) {
          const discarded = trackPlates.shift();
          discarded?.dispose(true);
        }

        // 7. Active Collisions Physics Solver
        for (let idx = obstacles.length - 1; idx >= 0; idx--) {
          const obs = obstacles[idx];
          
          if (obs.mesh.isDisposed()) {
            obstacles.splice(idx, 1);
            continue;
          }

          const characterZ = characterRoot.position.z;
          const characterX = characterRoot.position.x;
          const characterY = characterRoot.position.y;

          // Active Magnet Attraction: Pull coins (RIFT_CHARGER), energy cells (ENERGY_GATE), shield powerups, and magnets within a 3-unit radius of the player position
          const isCollectible = 
            obs.data.type === ObstacleType.ENERGY_GATE || 
            obs.data.type === ObstacleType.RIFT_CHARGER || 
            obs.data.type === ObstacleType.SHIELD_POWERUP ||
            obs.data.type === ObstacleType.MAGNET;

          if (playerStats.magnetTime > 0 && isCollectible) {
            const playerPos = characterRoot.position.clone();
            playerPos.y = characterY + 0.85; // Target collection height
            const dist = Vector3.Distance(obs.mesh.position, playerPos);
            const MAGNET_RADIUS = 3.0; // 3-unit radius detection and attraction range
            if (dist <= MAGNET_RADIUS) {
              obs.mesh.position = Vector3.Lerp(obs.mesh.position, playerPos, 0.25); // Smooth rapid interpolation
            }
          }

          const obstacleZ = obs.mesh.position.z;

          // Garbage collect obstacles far behind the player to preserve memory/performance
          if (obstacleZ < characterRoot.position.z - 25) {
            disposeObstacle(obs.mesh);
            obstacles.splice(idx, 1);
            continue;
          }

          // Gently rotate and bob collectible power-up items
          if (
            obs.data.type === ObstacleType.ENERGY_GATE || 
            obs.data.type === ObstacleType.RIFT_CHARGER || 
            obs.data.type === ObstacleType.SHIELD_POWERUP ||
            obs.data.type === ObstacleType.MAGNET
          ) {
            obs.mesh.rotation.y += 0.04;
            obs.mesh.rotation.x += 0.025;
            obs.mesh.position.y = (obs.data.type === ObstacleType.ENERGY_GATE ? 0.85 : 0.75) + Math.sin(frameCycle * 0.05) * 0.15;
          }

          // Animate structural gate pillars
          if (obs.data.type === ObstacleType.GATE_PILLAR) {
            const isRising = obs.mesh.name.includes("rising");
            const distanceToPlayer = obstacleZ - characterRoot.position.z;
            
            // Trigger animation when player gets within 45 units
            if (distanceToPlayer > 0 && distanceToPlayer < 45) {
              const t = Math.max(0, Math.min(1, (45 - distanceToPlayer) / 33));
              const ease = t * t * (3 - 2 * t); // Smooth cubic ease-in-out / slam
              
              if (isRising) {
                const oldY = obs.mesh.position.y;
                obs.mesh.position.y = -2.5 + ease * 3.75; // reaches 1.25 (blocks lane)
                
                // Play metallic slam sound at critical block height
                if (oldY <= 0.5 && obs.mesh.position.y > 0.5 && !obs.mesh.metadata?.triggeredSfx) {
                  playSynthSFX('slam');
                  if (!obs.mesh.metadata) obs.mesh.metadata = {};
                  obs.mesh.metadata.triggeredSfx = true;
                }
              } else {
                const oldY = obs.mesh.position.y;
                obs.mesh.position.y = 6.0 - ease * 4.2; // reaches 1.8 (blocks lane)
                
                // Play metallic slam sound when it drops past 3.0
                if (oldY >= 3.0 && obs.mesh.position.y < 3.0 && !obs.mesh.metadata?.triggeredSfx) {
                  playSynthSFX('slam');
                  if (!obs.mesh.metadata) obs.mesh.metadata = {};
                  obs.mesh.metadata.triggeredSfx = true;
                }
              }
            } else if (distanceToPlayer >= 45) {
              obs.mesh.position.y = isRising ? -2.5 : 6.0;
            }
          }

          // Animate flying drones horizontally
          if (obs.data.type === ObstacleType.DRONE) {
            // Spin propellers/rotors
            if (obs.mesh.metadata?.rotorL) {
              obs.mesh.metadata.rotorL.rotation.y += 0.35;
            }
            if (obs.mesh.metadata?.rotorR) {
              obs.mesh.metadata.rotorR.rotation.y += 0.35;
            }

            // Gently bob up and down around its customized altitude
            const baseAlt = obs.mesh.metadata?.baseAltitude ?? 1.15;
            obs.mesh.position.y = baseAlt + Math.sin(frameCycle * 0.1) * 0.12;

            const isLeftToRight = obs.mesh.metadata?.leftToRight;
            const speedMultiplier = obs.mesh.metadata?.speedMultiplier || 1.0;
            const distanceToPlayer = obstacleZ - characterRoot.position.z;

            // Trigger active flight crossing when player gets close
            if (distanceToPlayer > -15 && distanceToPlayer < 55) {
              const baseRange = 70;
              const progress = Math.max(0, Math.min(1, ((55 - distanceToPlayer) * speedMultiplier) / baseRange));
              const startX = isLeftToRight ? -4.8 : 4.8;
              const endX = isLeftToRight ? 4.8 : -4.8;
              
              // Smooth interpolation
              obs.mesh.position.x = startX + progress * (endX - startX);
              
              // Tilt/roll visual effect based on movement direction
              const tiltDir = isLeftToRight ? -1 : 1;
              obs.mesh.rotation.z = tiltDir * 0.22;
            } else if (distanceToPlayer >= 55) {
              // Parked on the side waiting to fly
              obs.mesh.position.x = isLeftToRight ? -4.8 : 4.8;
              obs.mesh.rotation.z = 0;
            } else {
              // Past the player: fly off-screen completely
              const endX = isLeftToRight ? 4.8 : -4.8;
              obs.mesh.position.x = endX;
              obs.mesh.rotation.z = 0;
            }
          }

          // AABB Physics solver setup
          const obstacleX = obs.mesh.position.x;
          const obstacleY = obs.mesh.position.y;

          // Safe margin ranges for lane width alignment
          const deltaZ = Math.abs(characterZ - obstacleZ);
          const deltaX = Math.abs(characterX - obstacleX);

          // Approximate AABB envelope crosscheck (Y bounding check depends on active slide dimensions)
          let collisionDetected = false;
          
          if (deltaZ < 1.05 && deltaX < 1.1) {
            // Lane align correct & positioning overlapping, now crosscheck height criteria
            if (obs.data.type === ObstacleType.BARRIER_LOW) {
              // Low hurdles: can ONLY jump over to survive (Player must be in flight)
              if (characterY < 0.65) collisionDetected = true;
            } else if (obs.data.type === ObstacleType.BARRIER_HIGH) {
              // High Arch scanners: can ONLY slide under to survive
              if (!playerStats.isSliding) collisionDetected = true;
            } else if (obs.data.type === ObstacleType.SPIKE_ROCK) {
              // Rocks blocks: always hits if in lane regardless of height
              collisionDetected = true;
            } else if (obs.data.type === ObstacleType.GATE_PILLAR) {
              // Structural gate pillar: hits if it has moved into blocking position
              const isRising = obs.mesh.name.includes("rising");
              if (isRising) {
                if (obstacleY > -0.5) {
                  collisionDetected = true;
                }
              } else {
                if (obstacleY < 5.0) {
                  collisionDetected = true;
                }
              }
            } else if (obs.data.type === ObstacleType.DRONE) {
              // Drone sweeps lanes: must dodge depending on its altitude type
              const droneType = obs.mesh.metadata?.droneAltitudeType || 'mid';
              if (droneType === 'low') {
                // Low flying drone: must jump to dodge (collision if on ground or sliding)
                if (characterY < 0.65) {
                  collisionDetected = true;
                }
              } else if (droneType === 'high') {
                // High flying drone: must slide to dodge (collision if running tall or jumping)
                if (!playerStats.isSliding) {
                  collisionDetected = true;
                }
              } else {
                // Mid flying drone: can either jump or slide to survive
                if (!playerStats.isJumping && !playerStats.isSliding) {
                  collisionDetected = true;
                }
              }
            } else if (obs.data.type === ObstacleType.ENERGY_GATE) {
              // Positives: Collect energy gates when player bounding box crosses its height slot
              if (Math.abs(characterY + 0.85 - obstacleY) < 1.2) {
                // Collect and delete
                playSynthSFX('collect');
                createCollectionParticles(obs.mesh.position.clone(), false);
                playerStats.energy = Math.min(100, playerStats.energy + 20);
                playerStats.hexShieldTime = 90; // Activate rotating hexagonal force-field visual
                playerStats.coins += 1;
                addComboPoints(1);
                disposeObstacle(obs.mesh);
                obstacles.splice(idx, 1);
              }
            } else if (obs.data.type === ObstacleType.RIFT_CHARGER) {
              // Collect multipliers speed gates
              if (Math.abs(characterY + 0.85 - obstacleY) < 1.2) {
                playSynthSFX('speed_boost');
                createCollectionParticles(obs.mesh.position.clone(), true);
                playerStats.coins += 3; // Huge score boost
                addComboPoints(3);
                playerStats.energy = Math.min(100, playerStats.energy + 40);
                playerStats.hexShieldTime = 90; // Activate rotating hexagonal force-field visual
                disposeObstacle(obs.mesh);
                obstacles.splice(idx, 1);
              }
            } else if (obs.data.type === ObstacleType.SHIELD_POWERUP) {
              // Collect protection shield power-up
              if (Math.abs(characterY + 0.85 - obstacleY) < 1.2) {
                playSynthSFX('speed_boost');
                createCollectionParticles(obs.mesh.position.clone(), true);
                playerStats.hasShield = true;
                protectionShieldHull.isVisible = true;
                playerStats.hexShieldTime = 90; // Activate rotating hexagonal force-field visual
                playerStats.coins += 1;
                addComboPoints(1);
                disposeObstacle(obs.mesh);
                obstacles.splice(idx, 1);
              }
            } else if (obs.data.type === ObstacleType.MAGNET) {
              // Collect Magnet power-up: starts attracting nearby coins/cells
              if (Math.abs(characterY + 0.85 - obstacleY) < 1.2) {
                playSynthSFX('speed_boost');
                createCollectionParticles(obs.mesh.position.clone(), true);
                playerStats.magnetTime = 300; // 5 seconds of active magnetism
                playerStats.coins += 1;
                addComboPoints(1);
                disposeObstacle(obs.mesh);
                obstacles.splice(idx, 1);
              }
            }
          }

          if (collisionDetected) {
            // Reset combo on collision impact
            playerStats.comboCount = 0;
            playerStats.comboMultiplier = 1;
            playerStats.comboDecay = 0;
            playerStats.comboMessage = 'COMBO BROKEN';
            playerStats.comboMessageTime = 60; // Show for 1 second

            if (playerStats.hasShield) {
              // Shield absorbed the impact!
              playerStats.hasShield = false;
              protectionShieldHull.isVisible = false;
              
              // Play a protective break visual effect and sound
              playSynthSFX('slam');
              createCollectionParticles(characterRoot.position.clone(), true);
              
              disposeObstacle(obs.mesh);
              obstacles.splice(idx, 1);
              continue;
            }

            // Process negative impact collision
            playSynthSFX('damage');
            shakeRemaining = 16;
            triggerDamageFlashRef.current();
            disposeObstacle(obs.mesh); // Delete obstacle to prevent double impacts
            obstacles.splice(idx, 1);
            
            // Deduct health
            playerStats.health = Math.max(0, playerStats.health - 25);
            
            // Flash character red for damage cues
            let duration = 0;
            const flash = setInterval(() => {
              duration++;
              coreBody.material = (duration % 2 === 0) ? warningRedMat : metalDullMat;
              if (duration >= 6) {
                clearInterval(flash);
                coreBody.material = metalDullMat;
              }
            }, 80);

            onUpdateState({ health: playerStats.health });

            if (playerStats.health <= 0) {
              gameStateRef.current = GameState.GAMEOVER;
              onGameOver();
            }
          }
        }
      }

      scene.render();
    });

    const TICKS_CLEANUP = () => 45;

    // Automatic canvas resize handlers
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup resources
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleWindowClick);
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, [gameState]);

  return (
    <div className="relative w-full h-full min-h-[420px] bg-[#020305] border border-stone-850 rounded-xl overflow-hidden shadow-2xl">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block focus:outline-none pointer-events-auto"
        id="babylon-graphics-surface"
      />
      {/* Damage Overlay red vignette */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-200 z-10 select-none bg-[radial-gradient(circle,transparent_30%,rgba(239,68,68,0.45)_100%)] border-[5px] border-red-500/40 ${
          damageFlash ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Background neon grid layer backing */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.01)_0%,transparent_100%)] pointer-events-none" />
    </div>
  );
}
