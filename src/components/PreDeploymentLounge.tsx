import React, { useEffect, useRef, useState } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  PointLight,
  Color3,
  StandardMaterial,
  CreateCylinder,
  CreateSphere,
  CreateBox,
  CreateTorus,
  TransformNode,
  VertexData,
  Mesh,
  SceneLoader,
  Texture,
  Animation
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, Shield, Zap, Terminal, ChevronRight, Play, RefreshCw, 
  Settings, Layers, Radio, CheckCircle, Database, HelpCircle, 
  Sparkles, Eye, Volume2, VolumeX, Swords, Compass
} from 'lucide-react';

const idleGlbUrl = '/idle.glb';

interface PreDeploymentLoungeProps {
  onStartGame: (selectedGear: any) => void;
  savedHighScore?: number;
}

export default function PreDeploymentLounge({ onStartGame, savedHighScore = 0 }: PreDeploymentLoungeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const meshesRef = useRef<{
    characterRoot?: TransformNode;
    coreBody?: Mesh;
    headVisor?: Mesh;
    chestPlate?: Mesh;
    armL?: Mesh;
    armR?: Mesh;
    legL?: Mesh;
    legR?: Mesh;
    hudRing?: Mesh;
    protectionShieldHull?: Mesh;
    hexForceField?: Mesh;
  }>({});

  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStep, setLoadingStep] = useState<string>('Booting core terminal...');
  const [animationMode, setAnimationMode] = useState<'IDLE' | 'JOGGING'>('IDLE');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const animationModeRef = useRef<'IDLE' | 'JOGGING'>('IDLE');
  const loadedAnimsRef = useRef<{
    idleAnim?: any;
    jogAnim?: any;
    allGroups?: any[];
  }>({});

  useEffect(() => {
    animationModeRef.current = animationMode;
  }, [animationMode]);

  // Character customizable gear state
  const [gear, setGear] = useState({
    visorColor: '#00FFFF', // Cyan
    armorColor: '#3F3F46', // Zinc Dull Metal
    chestColor: '#F27D26', // Orange Emissive
    hasShield: true,
    hasJetpack: false,
    weaponType: 'PLASMA_BLADE' as 'PLASMA_BLADE' | 'BLASTER' | 'NONE'
  });

  // Sound generator
  const playUISfx = (type: 'click' | 'toggle' | 'boot' | 'launch') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'toggle') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.setValueAtTime(500, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'boot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'launch') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio context block safety
    }
  };

  // Loading steps Simulation
  useEffect(() => {
    const steps = [
      { text: 'Accessing tactical database...', duration: 400, prg: 20 },
      { text: 'Calibrating character telemetry...', duration: 500, prg: 45 },
      { text: 'Scanning for local assets (idle.glb)...', duration: 600, prg: 70 },
      { text: 'Mounting holograph visualizer...', duration: 400, prg: 100 }
    ];

    let currentStep = 0;
    const runSteps = () => {
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep].text);
        setLoadingProgress(steps[currentStep].prg);
        setTimeout(() => {
          currentStep++;
          runSteps();
        }, steps[currentStep].duration);
      } else {
        setIsLoading(false);
        playUISfx('boot');
      }
    };

    runSteps();
  }, []);

  // Set up 3D Scene
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;

    // 1. Engine & Scene Setup
    const engine = new Engine(canvasRef.current, true);
    engineRef.current = engine;
    const scene = new Scene(engine);
    sceneRef.current = scene;

    scene.clearColor = new Color3(0.015, 0.02, 0.035).toColor4(1);

    // 2. Beautiful Camera Layout
    const camera = new ArcRotateCamera('loungeCamera', -Math.PI / 2.5, Math.PI / 2.2, 4.5, new Vector3(0, 0.9, 0), scene);
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 2.5;
    camera.upperRadiusLimit = 7.0;
    camera.lowerBetaLimit = 0.5;
    camera.upperBetaLimit = Math.PI / 1.8;

    // 3. Cybernetic Lights Configuration
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.65;
    hemiLight.groundColor = new Color3(0.05, 0.08, 0.15);
    hemiLight.diffuse = new Color3(0.8, 0.9, 1.0);

    const keyLight = new PointLight('keyLight', new Vector3(2.5, 3.0, 2.0), scene);
    keyLight.intensity = 0.8;
    keyLight.diffuse = new Color3(1.0, 0.6, 0.3); // Warm sun accent

    const fillLight = new PointLight('fillLight', new Vector3(-2.5, 1.5, -2.0), scene);
    fillLight.intensity = 0.6;
    fillLight.diffuse = new Color3(0.1, 0.7, 1.0); // Cool neon backfill

    // 4. Materials setup
    const metalBodyMat = new StandardMaterial('metalBodyMat', scene);
    metalBodyMat.diffuseColor = Color3.FromHexString(gear.armorColor);
    metalBodyMat.specularColor = new Color3(0.8, 0.8, 1.0);
    metalBodyMat.roughness = 0.15;

    const neonVisorMat = new StandardMaterial('neonVisorMat', scene);
    neonVisorMat.emissiveColor = Color3.FromHexString(gear.visorColor);
    neonVisorMat.diffuseColor = Color3.FromHexString(gear.visorColor);

    const chestEmissiveMat = new StandardMaterial('chestEmissiveMat', scene);
    chestEmissiveMat.emissiveColor = Color3.FromHexString(gear.chestColor);

    const metalDullMat = new StandardMaterial('metalDullMat', scene);
    metalDullMat.diffuseColor = new Color3(0.2, 0.2, 0.22);
    metalDullMat.specularColor = new Color3(0.3, 0.3, 0.3);

    const gridPlatformMat = new StandardMaterial('platformMat', scene);
    gridPlatformMat.diffuseColor = new Color3(0.05, 0.08, 0.12);
    gridPlatformMat.emissiveColor = new Color3(0.01, 0.03, 0.06);

    // 5. Interactive Platform Base Ring
    const baseGrid = CreateCylinder('baseGrid', { height: 0.06, diameter: 2.8, tessellation: 48 }, scene);
    baseGrid.position.y = -0.03;
    baseGrid.material = gridPlatformMat;

    const edgeRing = CreateTorus('edgeRing', { diameter: 2.8, thickness: 0.04, tessellation: 64 }, scene);
    edgeRing.position.y = 0.01;
    const ringMat = new StandardMaterial('ringMat', scene);
    ringMat.emissiveColor = new Color3(0.95, 0.49, 0.15); // Tactical orange glow ring
    ringMat.alpha = 0.8;
    edgeRing.material = ringMat;

    // 6. Character Base Skeleton & Node Structure
    const characterRoot = new TransformNode('charRoot', scene);
    characterRoot.position.y = 0.08;
    meshesRef.current.characterRoot = characterRoot;

    // High-poly procedural torso components
    const coreBody = CreateCylinder('coreBody', { 
      height: 1.4, 
      diameterTop: 0.48, 
      diameterBottom: 0.35,
      tessellation: 48,
      subdivisions: 4
    }, scene);
    coreBody.position.y = 0.75;
    coreBody.material = metalBodyMat;
    coreBody.parent = characterRoot;
    meshesRef.current.coreBody = coreBody;

    // High-poly visor (head)
    const headVisor = CreateSphere('headVisor', { diameter: 0.48, segments: 48 }, scene);
    headVisor.position.y = 1.6;
    headVisor.material = neonVisorMat;
    headVisor.parent = characterRoot;
    meshesRef.current.headVisor = headVisor;

    // Beveled Chest Plate
    const chestPlate = CreateBox('chestPlate', { width: 0.45, height: 0.45, depth: 0.25 }, scene);
    chestPlate.position.set(0, 0.9, 0.18);
    chestPlate.material = chestEmissiveMat;
    chestPlate.parent = characterRoot;
    meshesRef.current.chestPlate = chestPlate;

    // Arms
    const armL = CreateCylinder('armL', { height: 0.8, diameter: 0.18, tessellation: 36 }, scene);
    armL.position.set(-0.38, 0.95, 0);
    armL.material = metalDullMat;
    armL.parent = characterRoot;
    meshesRef.current.armL = armL;

    const armR = armL.clone('armR');
    armR.position.x = 0.38;
    armR.parent = characterRoot;
    meshesRef.current.armR = armR;

    // Legs
    const legL = CreateCylinder('legL', { height: 0.8, diameter: 0.2, tessellation: 36 }, scene);
    legL.position.set(-0.22, 0.35, 0);
    legL.material = metalDullMat;
    legL.parent = characterRoot;
    meshesRef.current.legL = legL;

    const legR = legL.clone('legR');
    legR.position.x = 0.22;
    legR.parent = characterRoot;
    meshesRef.current.legR = legR;

    // HUD Indicator above head
    const hudRing = CreateCylinder('hudRing', { height: 0.05, diameter: 0.9, tessellation: 64 }, scene);
    hudRing.position.y = 2.15;
    const hudRingMat = new StandardMaterial('hudMat', scene);
    hudRingMat.emissiveColor = Color3.FromHexString(gear.chestColor);
    hudRingMat.alpha = 0.45;
    hudRing.material = hudRingMat;
    hudRing.parent = characterRoot;
    meshesRef.current.hudRing = hudRing;

    // Translucent protective sphere shield
    const protectionShieldHull = CreateSphere('protectionShieldHull', { diameter: 2.1, segments: 64 }, scene);
    protectionShieldHull.position.y = 0.9;
    const protectionShieldHullMat = new StandardMaterial('shieldMat', scene);
    protectionShieldHullMat.diffuseColor = new Color3(0.1, 0.8, 1.0);
    protectionShieldHullMat.emissiveColor = new Color3(0.15, 0.9, 1.0);
    protectionShieldHullMat.alpha = 0.22;
    protectionShieldHull.material = protectionShieldHullMat;
    protectionShieldHull.parent = characterRoot;
    protectionShieldHull.isVisible = gear.hasShield;
    meshesRef.current.protectionShieldHull = protectionShieldHull;

    // Jetpack backpack block
    const jetpack = CreateBox('jetpack', { width: 0.3, height: 0.5, depth: 0.25 }, scene);
    jetpack.position.set(0, 0.9, -0.22);
    const jetpackMat = new StandardMaterial('jetpackMat', scene);
    jetpackMat.diffuseColor = new Color3(0.2, 0.2, 0.25);
    jetpack.material = jetpackMat;
    jetpack.parent = characterRoot;
    jetpack.isVisible = gear.hasJetpack;

    // Attempt to load idle.glb
    const lastSlash = idleGlbUrl.lastIndexOf('/');
    const rootUrl = lastSlash !== -1 ? idleGlbUrl.substring(0, lastSlash + 1) : '';
    const fileName = lastSlash !== -1 ? idleGlbUrl.substring(lastSlash + 1) : idleGlbUrl;

    let hasLoadedGltf = false;
    SceneLoader.ImportMeshAsync('', rootUrl, fileName, scene)
      .then((result) => {
        console.log('GLTF loaded inside Pre-deployment Viewer:', result);
        const loadedRoot = result.meshes[0];
        loadedRoot.parent = characterRoot;
        loadedRoot.scaling = new Vector3(1, 1, 1);
        loadedRoot.position = Vector3.Zero();

        // Hide procedural components to use glTF model
        coreBody.isVisible = false;
        headVisor.isVisible = false;
        chestPlate.isVisible = false;
        armL.isVisible = false;
        armR.isVisible = false;
        legL.isVisible = false;
        legR.isVisible = false;
        jetpack.isVisible = false;

        hasLoadedGltf = true;

        // Extract Animations
        const animGroups = result.animationGroups;
        animGroups.forEach(g => g.stop());

        const idle = animGroups.find(g => {
          const n = g.name.toLowerCase();
          return n.includes('idle') || n.includes('hero');
        });
        const jog = animGroups.find(g => {
          const n = g.name.toLowerCase();
          return n.includes('walk') || n.includes('run') || n.includes('jog') || n.includes('cst-ert-walk-a');
        });

        loadedAnimsRef.current = {
          idleAnim: idle,
          jogAnim: jog,
          allGroups: animGroups
        };

        // Start initial animation based on current mode
        if (animationModeRef.current === 'IDLE' && idle) {
          idle.start(true);
        } else if (animationModeRef.current === 'JOGGING') {
          if (jog) jog.start(true);
          else if (idle) idle.start(true);
        }
      })
      .catch((err) => {
        console.warn('Could not load local idle.glb. Running ultra-beautiful procedural render:', err);
      });

    // 7. Render Loop with Procedural swing / walk animations
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      time += engine.getDeltaTime() / 1000;

      // Rotate edge platform ring slowly
      edgeRing.rotation.y = time * 0.15;
      hudRing.rotation.y = -time * 0.35;

      // Float the HUD ring above head
      hudRing.position.y = 2.15 + Math.sin(time * 2.0) * 0.04;

      if (!hasLoadedGltf) {
        // Run procedural skeleton cycle based on selection
        if (animationModeRef.current === 'IDLE') {
          // Slow dynamic breathing
          characterRoot.position.y = Math.sin(time * 1.5) * 0.02 + 0.08;
          headVisor.rotation.x = Math.sin(time * 1.5) * 0.03;
          headVisor.rotation.y = Math.cos(time * 0.5) * 0.05;

          armL.rotation.x = Math.sin(time * 1.5) * 0.08;
          armL.rotation.z = -0.1 + Math.sin(time * 0.5) * 0.02;

          armR.rotation.x = -Math.sin(time * 1.5) * 0.08;
          armR.rotation.z = 0.1 - Math.sin(time * 0.5) * 0.02;

          legL.rotation.x = 0;
          legL.rotation.z = -0.05;
          legR.rotation.x = 0;
          legR.rotation.z = 0.05;
        } else {
          // Energetic Jog cycle
          characterRoot.position.y = Math.abs(Math.sin(time * 4)) * 0.1 + 0.06;
          headVisor.rotation.x = 0.1 + Math.sin(time * 4) * 0.03;

          armL.rotation.x = -Math.sin(time * 4) * 0.55;
          armL.rotation.z = -0.15;
          armR.rotation.x = Math.sin(time * 4) * 0.55;
          armR.rotation.z = 0.15;

          legL.rotation.x = Math.sin(time * 4) * 0.5;
          legL.rotation.z = -0.02;
          legR.rotation.x = -Math.sin(time * 4) * 0.5;
          legR.rotation.z = 0.02;
        }
      } else {
        // Even with 3D model, can rotate base or bob slightly if desired, or let animation group execute
        if (animationModeRef.current === 'JOGGING' && !loadedAnimsRef.current.jogAnim) {
          characterRoot.position.y = Math.abs(Math.sin(time * 4)) * 0.08 + 0.08;
          characterRoot.rotation.x = 0.1; // Forward lean
        } else {
          characterRoot.position.y = 0.08;
          characterRoot.rotation.x = 0;
        }
      }
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, [isLoading]);

  // Synchronize dynamic customizations
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const vMat = scene.getMaterialByName('neonVisorMat') as StandardMaterial;
    if (vMat) {
      vMat.emissiveColor = Color3.FromHexString(gear.visorColor);
      vMat.diffuseColor = Color3.FromHexString(gear.visorColor);
    }

    const cMat = scene.getMaterialByName('chestEmissiveMat') as StandardMaterial;
    if (cMat) {
      cMat.emissiveColor = Color3.FromHexString(gear.chestColor);
    }

    const bMat = scene.getMaterialByName('metalBodyMat') as StandardMaterial;
    if (bMat) {
      bMat.diffuseColor = Color3.FromHexString(gear.armorColor);
    }

    if (meshesRef.current.protectionShieldHull) {
      meshesRef.current.protectionShieldHull.isVisible = gear.hasShield;
    }
  }, [gear]);

  // Synchronize Animations Mode
  useEffect(() => {
    const { idleAnim, jogAnim, allGroups } = loadedAnimsRef.current;
    if (allGroups && allGroups.length > 0) {
      allGroups.forEach(g => g.stop());
      if (animationMode === 'IDLE') {
        if (idleAnim) idleAnim.start(true);
        else allGroups[0].start(true);
      } else if (animationMode === 'JOGGING') {
        if (jogAnim) jogAnim.start(true);
        else if (idleAnim) idleAnim.start(true);
        else allGroups[0].start(true);
      }
    }
  }, [animationMode]);

  return (
    <div className="relative w-full h-screen bg-[#030712] text-zinc-100 flex flex-col md:flex-row overflow-hidden">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#030712] flex flex-col items-center justify-center p-6 border-4 border-zinc-900"
          >
            <div className="w-full max-w-md p-6 bg-black/60 border border-zinc-800 rounded-lg relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#F27D26] to-transparent animate-pulse" />
              <div className="flex items-center gap-3 mb-6">
                <Cpu className="text-[#F27D26] w-6 h-6 animate-spin" />
                <div>
                  <h2 className="text-sm font-mono tracking-wider text-[#F27D26] uppercase">SYSTEM LOADING</h2>
                  <p className="text-xs text-zinc-500 font-mono">CYBERNETIC_PLATFORM_V4.0</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400 animate-pulse">{loadingStep}</span>
                  <span className="text-[#F27D26] font-bold">{loadingProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-orange-600 to-[#F27D26]" 
                    initial={{ width: '0%' }}
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT: Cyber Control Panel */}
      <div className="w-full md:w-96 bg-zinc-950 border-r border-zinc-850 flex flex-col z-10 overflow-y-auto">
        {/* Terminal Header */}
        <div className="p-5 border-b border-zinc-850 bg-black/50 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F27D26] animate-ping" />
              <h1 className="text-sm font-bold tracking-wider font-mono text-[#F27D26] uppercase">PILOT LOUNGE</h1>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">LAUNCH_SEQUENCE_READY</p>
          </div>
          <button 
            onClick={() => {
              setIsMuted(!isMuted);
              playUISfx('toggle');
            }}
            className="p-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 rounded text-zinc-400 hover:text-white transition"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>

        {/* Saved Stats */}
        <div className="p-4 mx-4 mt-4 bg-zinc-900/60 border border-zinc-800/80 rounded flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#F27D26] w-4 h-4" />
            <span className="text-xs font-mono text-zinc-400 uppercase">Personal Best:</span>
          </div>
          <span className="text-sm font-mono font-bold text-white tracking-wider">{savedHighScore} pts</span>
        </div>

        {/* Customize Panel tabs */}
        <div className="p-5 flex-1 space-y-6">
          {/* Section 1: Customize Gear */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Settings size={14} className="text-[#F27D26]" />
              <h2 className="text-xs font-bold tracking-wider font-mono text-zinc-400 uppercase">TELEMETRY ACCESS</h2>
            </div>

            {/* Armor Color */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Armor Shell Plating</label>
              <div className="flex gap-2">
                {[
                  { hex: '#3F3F46', name: 'Titanium' },
                  { hex: '#1E293B', name: 'Cyber Blue' },
                  { hex: '#450A0A', name: 'Crimson' },
                  { hex: '#14532D', name: 'Matrix Green' },
                  { hex: '#1E1B4B', name: 'Void Purple' }
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => {
                      setGear({ ...gear, armorColor: color.hex });
                      playUISfx('click');
                    }}
                    className={`w-6 h-6 rounded border transition-all ${
                      gear.armorColor === color.hex 
                        ? 'border-[#F27D26] scale-110 shadow-[0_0_8px_rgba(242,125,38,0.3)]' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Visor Color */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">HUD Visor Emissive</label>
              <div className="flex gap-2">
                {[
                  { hex: '#00FFFF', name: 'Tactical Cyan' },
                  { hex: '#EF4444', name: 'Rage Red' },
                  { hex: '#22C55E', name: 'Safe Green' },
                  { hex: '#EAB308', name: 'Warn Yellow' },
                  { hex: '#EC4899', name: 'Neon Pink' }
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => {
                      setGear({ ...gear, visorColor: color.hex });
                      playUISfx('click');
                    }}
                    className={`w-6 h-6 rounded border transition-all ${
                      gear.visorColor === color.hex 
                        ? 'border-[#F27D26] scale-110 shadow-[0_0_8px_rgba(242,125,38,0.3)]' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Chest Core Color */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Chest Reactor Core</label>
              <div className="flex gap-2">
                {[
                  { hex: '#F27D26', name: 'Standard Orange' },
                  { hex: '#A855F7', name: 'Void Purple' },
                  { hex: '#06B6D4', name: 'Hydro Cyan' },
                  { hex: '#10B981', name: 'Bio Green' },
                  { hex: '#F43F5E', name: 'Thermal Red' }
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => {
                      setGear({ ...gear, chestColor: color.hex });
                      playUISfx('click');
                    }}
                    className={`w-6 h-6 rounded border transition-all ${
                      gear.chestColor === color.hex 
                        ? 'border-[#F27D26] scale-110 shadow-[0_0_8px_rgba(242,125,38,0.3)]' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Force Fields & Systems */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Layers size={14} className="text-[#F27D26]" />
              <h2 className="text-xs font-bold tracking-wider font-mono text-zinc-400 uppercase">SHIELD / SUBSYSTEMS</h2>
            </div>

            <div className="space-y-3">
              {/* Force Shield */}
              <button
                onClick={() => {
                  setGear({ ...gear, hasShield: !gear.hasShield });
                  playUISfx('toggle');
                }}
                className="w-full flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded text-left transition hover:border-zinc-700"
              >
                <div className="flex items-center gap-2.5">
                  <Shield size={14} className={gear.hasShield ? 'text-cyan-400' : 'text-zinc-500'} />
                  <span className="text-xs font-mono uppercase tracking-wide">Dynamic Force Shield</span>
                </div>
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${gear.hasShield ? 'bg-cyan-500' : 'bg-zinc-700'}`}>
                  <div className={`bg-white w-3 h-3 rounded-full shadow transition-transform duration-200 transform ${gear.hasShield ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>

              {/* Jetpack */}
              <button
                onClick={() => {
                  setGear({ ...gear, hasJetpack: !gear.hasJetpack });
                  playUISfx('toggle');
                }}
                className="w-full flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded text-left transition hover:border-zinc-700"
              >
                <div className="flex items-center gap-2.5">
                  <Zap size={14} className={gear.hasJetpack ? 'text-amber-400' : 'text-zinc-500'} />
                  <span className="text-xs font-mono uppercase tracking-wide">Backpack Jetpack Booster</span>
                </div>
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${gear.hasJetpack ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                  <div className={`bg-white w-3 h-3 rounded-full shadow transition-transform duration-200 transform ${gear.hasJetpack ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Weapon Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Swords size={14} className="text-[#F27D26]" />
              <h2 className="text-xs font-bold tracking-wider font-mono text-zinc-400 uppercase">WEAPONRY SYSTEM</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'NONE', label: 'None' },
                { type: 'PLASMA_BLADE', label: 'Plasma Blade' },
                { type: 'BLASTER', label: 'Blaster Pistol' }
              ].map((wpn) => (
                <button
                  key={wpn.type}
                  onClick={() => {
                    setGear({ ...gear, weaponType: wpn.type as any });
                    playUISfx('click');
                  }}
                  className={`py-2 px-1 border rounded text-[10px] font-mono uppercase text-center transition ${
                    gear.weaponType === wpn.type 
                      ? 'border-[#F27D26] bg-[#F27D26]/10 text-white font-bold' 
                      : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {wpn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Launch Button Action */}
        <div className="p-5 border-t border-zinc-850 bg-black/50">
          <button
            onClick={() => {
              playUISfx('launch');
              onStartGame(gear);
            }}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-[#F27D26] hover:from-orange-500 hover:to-orange-600 border border-orange-500 hover:border-orange-400 text-white font-bold font-mono text-xs tracking-wider uppercase rounded shadow-lg flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(242,125,38,0.45)] transition cursor-pointer"
          >
            <Play size={14} fill="currentColor" />
            Launch Runner Mission
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* RIGHT: Immersive 3D Viewer Area */}
      <div className="flex-1 relative flex flex-col min-h-0">
        {/* Hologram visualizer grid overlay */}
        <div className="absolute inset-0 z-0 bg-radial-gradient from-transparent to-[#030712] opacity-80 pointer-events-none" />
        
        {/* Babylon 3D Canvas */}
        <canvas ref={canvasRef} className="w-full h-full outline-none z-0" />

        {/* 3D Action HUD / Mode Control Buttons */}
        <div className="absolute bottom-5 left-5 right-5 z-20 flex flex-col md:flex-row gap-3 justify-between items-center pointer-events-auto">
          {/* Active animation selection */}
          <div className="bg-black/80 border border-zinc-800/80 p-2 rounded flex gap-1.5 backdrop-blur-md">
            <button
              onClick={() => {
                setAnimationMode('IDLE');
                playUISfx('click');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-[10px] font-bold font-mono uppercase tracking-wider transition ${
                animationMode === 'IDLE' 
                  ? 'bg-[#F27D26] text-black border-[#F27D26]' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
              }`}
            >
              <Compass size={11} />
              Idle Stance
            </button>
            <button
              onClick={() => {
                setAnimationMode('JOGGING');
                playUISfx('click');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-[10px] font-bold font-mono uppercase tracking-wider transition ${
                animationMode === 'JOGGING' 
                  ? 'bg-[#F27D26] text-black border-[#F27D26]' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
              }`}
            >
              <RefreshCw size={11} className={animationMode === 'JOGGING' ? 'animate-spin' : ''} />
              Jog Test Cycle
            </button>
          </div>

          {/* Model detection feedback */}
          <div className="px-3 py-2 bg-black/80 border border-zinc-800/80 rounded flex items-center gap-2 backdrop-blur-md">
            <Eye size={12} className="text-[#F27D26] animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Asset Source: <span className="text-white font-bold font-mono">/src/components/idle.glb</span>
            </span>
          </div>
        </div>

        {/* Technical crosshair and decorations */}
        <div className="absolute inset-x-12 top-12 bottom-24 border border-cyan-500/10 pointer-events-none flex items-center justify-center">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#F27D26]/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#F27D26]/40" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#F27D26]/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#F27D26]/40" />
        </div>
      </div>
    </div>
  );
}
