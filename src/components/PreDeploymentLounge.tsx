import React, { useEffect, useRef, useState } from 'react';
import { 
  Engine, 
  Scene, 
  Vector3, 
  Color3, 
  StandardMaterial, 
  ArcRotateCamera, 
  HemisphericLight, 
  PointLight, 
  Mesh, 
  CreateBox, 
  CreateCylinder, 
  CreateSphere, 
  CreateTorus, 
  TransformNode,
  SceneLoader
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, Shield, Zap, Terminal, ChevronRight, Play, RefreshCw, 
  Settings, Layers, Radio, CheckCircle, Database, HelpCircle 
} from 'lucide-react';

interface PreDeploymentLoungeProps {
  onDeploy: () => void;
  onQuit: () => void;
  selectedClass: string;
}

export function PreDeploymentLounge({ onDeploy, onQuit, selectedClass }: PreDeploymentLoungeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStep, setLoadingStep] = useState<string>('Booting core terminal...');
  const [animationMode, setAnimationMode] = useState<'IDLE' | 'JOGGING'>('IDLE');
  
  // Commander customizable gear state
  const [gear, setGear] = useState({
    headwrap: true,
    crownSeal: true,
    conduitCore: true,
    bracers: true,
    commandCoat: true,
  });

  // Babylon refs to modify meshes in real-time when toggled
  const meshesRef = useRef<{
    headwrapMesh?: Mesh;
    crownSealMesh?: Mesh;
    conduitCoreMesh?: Mesh;
    bracersL?: Mesh;
    bracersR?: Mesh;
    coatPlates?: Mesh[];
    characterRoot?: TransformNode;
    headVisor?: Mesh;
    armL?: Mesh;
    armR?: Mesh;
    legL?: Mesh;
    legR?: Mesh;
  }>({});

  // Stats calculation based on gear equipped
  const getStats = () => {
    let speed = 75;
    let armor = 80;
    let energy = 60;

    if (gear.headwrap) speed += 15;
    if (gear.commandCoat) armor += 20;
    if (gear.crownSeal) energy += 25;
    if (gear.conduitCore) {
      energy += 15;
      speed += 5;
    }
    if (gear.bracers) armor += 10;

    return { speed, armor, energy };
  };

  const stats = getStats();

  // Simulated GLTF asset loading log system
  useEffect(() => {
    const steps = [
      { prg: 10, text: 'Mapping deep sector signal channels...' },
      { prg: 25, text: 'Resolving @babylonjs/loaders GLTF/GLB formats...' },
      { prg: 45, text: 'Attempting to fetch remote /idle.glb container...' },
      { prg: 65, text: 'GLB container empty. Initiating high-poly procedural fallback...' },
      { prg: 80, text: 'Injecting CST-ERT Commander mesh metadata nodes...' },
      { prg: 95, text: 'Establishing 3D Pre-Deployment viewport loop...' },
      { prg: 100, text: 'Pre-Deployment Lounge ready.' }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setLoadingProgress(steps[stepIdx].prg);
        setLoadingStep(steps[stepIdx].text);
        stepIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
        }, 600);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Initialize 3D Engine & Scene
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // Deep space backdrop
    scene.clearColor = new Color3(0.015, 0.02, 0.03).toColor4(1);
    scene.ambientColor = new Color3(0.08, 0.1, 0.15);

    // Cinematic orbiting camera
    const camera = new ArcRotateCamera(
      'loungeCamera',
      -Math.PI / 2.3, // alpha (rotation)
      Math.PI / 2.2,  // beta (tilt)
      5.2,            // radius
      new Vector3(0, 0.9, 0), // target (look at chest)
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 3.0;
    camera.upperRadiusLimit = 8.0;
    camera.lowerBetaLimit = 0.2;
    camera.upperBetaLimit = Math.PI / 2 - 0.05; // Prevent dipping underground
    scene.activeCamera = camera;

    // Soft surrounding lights
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.65;
    hemiLight.diffuse = new Color3(0.45, 0.6, 0.9);
    hemiLight.specular = new Color3(0.2, 0.3, 0.5);

    // Warm high-intensity key spot light for dramatic outlines
    const spotLight = new PointLight('spotLight', new Vector3(2.5, 4, -2.5), scene);
    spotLight.intensity = 1.2;
    spotLight.diffuse = new Color3(0.95, 0.49, 0.15); // Emissive orange

    const rimLight = new PointLight('rimLight', new Vector3(-3, 2, 3), scene);
    rimLight.intensity = 0.8;
    rimLight.diffuse = new Color3(0.1, 0.7, 1.0); // Teal rim glow

    // Materials registry
    const metalDarkMat = new StandardMaterial('metalDarkMat', scene);
    metalDarkMat.diffuseColor = new Color3(0.12, 0.14, 0.18);
    metalDarkMat.specularColor = new Color3(0.5, 0.5, 0.5);

    const metalRedMat = new StandardMaterial('metalRedMat', scene);
    metalRedMat.diffuseColor = new Color3(0.58, 0.08, 0.08);
    metalRedMat.specularColor = new Color3(0.9, 0.4, 0.4);
    metalRedMat.emissiveColor = new Color3(0.15, 0.02, 0.02);

    const goldMat = new StandardMaterial('goldMat', scene);
    goldMat.diffuseColor = new Color3(0.95, 0.7, 0.15);
    goldMat.specularColor = new Color3(1.0, 0.9, 0.6);
    goldMat.emissiveColor = new Color3(0.2, 0.15, 0.0);

    const glowOrangeMat = new StandardMaterial('glowOrangeMat', scene);
    glowOrangeMat.emissiveColor = new Color3(0.95, 0.49, 0.15);
    glowOrangeMat.diffuseColor = new Color3(0.2, 0.1, 0.0);

    const glowBlueMat = new StandardMaterial('glowBlueMat', scene);
    glowBlueMat.emissiveColor = new Color3(0.1, 0.75, 1.0);
    glowBlueMat.diffuseColor = new Color3(0.0, 0.15, 0.25);

    const whiteWrapMat = new StandardMaterial('whiteWrapMat', scene);
    whiteWrapMat.diffuseColor = new Color3(0.9, 0.92, 0.95);
    whiteWrapMat.specularColor = new Color3(0.3, 0.3, 0.3);

    // ====================================================
    // 1. GLOWING RINGS PLATFORM
    // ====================================================
    const platformRoot = new TransformNode('platformRoot', scene);
    
    // Center dark block
    const baseCylinder = CreateCylinder('platformBase', { height: 0.12, diameter: 2.8 }, scene);
    baseCylinder.position.y = 0.01;
    baseCylinder.material = metalDarkMat;
    baseCylinder.parent = platformRoot;

    // Glowing inner ring
    const ringInner = CreateTorus('ringInner', { diameter: 1.8, thickness: 0.08, tessellation: 24 }, scene);
    ringInner.position.y = 0.04;
    ringInner.material = glowBlueMat;
    ringInner.parent = platformRoot;

    // Glowing middle ring
    const ringMid = CreateTorus('ringMid', { diameter: 2.4, thickness: 0.08, tessellation: 32 }, scene);
    ringMid.position.y = 0.02;
    ringMid.material = glowOrangeMat;
    ringMid.parent = platformRoot;

    // Glowing outer ring with floating segments
    const ringOuter = CreateTorus('ringOuter', { diameter: 3.1, thickness: 0.05, tessellation: 48 }, scene);
    ringOuter.position.y = 0.03;
    ringOuter.material = glowBlueMat;
    ringOuter.parent = platformRoot;

    // ====================================================
    // 2. RUNNER MODEL (PRODUCURAL FALLBACK / ASSET VIEWER)
    // ====================================================
    const characterRoot = new TransformNode('runnerRoot', scene);
    characterRoot.position.y = 0.08;
    meshesRef.current.characterRoot = characterRoot;

    // Attempt to load GLTF directly from assets
    SceneLoader.ImportMeshAsync('', '/', 'idle.glb', scene)
      .then((result) => {
        console.log('GLTF loaded successfully inside Pre-deployment Viewer:', result);
        // Position the loaded mesh properly on our rings platform
        const loadedRoot = result.meshes[0];
        loadedRoot.parent = characterRoot;
        loadedRoot.scaling = new Vector3(1, 1, 1);
        loadedRoot.position = Vector3.Zero();
      })
      .catch((err) => {
        console.warn('Empty/Invalid idle.glb. Generating highly-detailed procedural Commander framework matching design...', err);
        
        // Let's generate a stunning, faithful 3D model of the Commander
        
        // Leg Right and Left
        const legL = CreateCylinder('legL', { height: 0.65, diameter: 0.18 }, scene);
        legL.position.set(-0.2, 0.3, 0);
        legL.material = metalDarkMat;
        legL.parent = characterRoot;
        meshesRef.current.legL = legL;

        const legR = CreateCylinder('legR', { height: 0.65, diameter: 0.18 }, scene);
        legR.position.set(0.2, 0.3, 0);
        legR.material = metalDarkMat;
        legR.parent = characterRoot;
        meshesRef.current.legR = legR;

        // Custom golden-lined boots
        const bootL = CreateCylinder('bootL', { height: 0.25, diameterTop: 0.19, diameterBottom: 0.22 }, scene);
        bootL.position.y = -0.25;
        bootL.material = goldMat;
        bootL.parent = legL;

        const bootR = CreateCylinder('bootR', { height: 0.25, diameterTop: 0.19, diameterBottom: 0.22 }, scene);
        bootR.position.y = -0.25;
        bootR.material = goldMat;
        bootR.parent = legR;

        // Torso / Body Coat (Executive Rail Command Coat)
        const torso = CreateCylinder('torso', { height: 1.1, diameterTop: 0.45, diameterBottom: 0.32 }, scene);
        torso.position.y = 1.05;
        torso.material = metalRedMat;
        torso.parent = characterRoot;

        // Armor Plate (Front Coat flap / Gold details)
        const zipperStrip = CreateBox('zipper', { width: 0.04, height: 1.0, depth: 0.12 }, scene);
        zipperStrip.position.set(0, 0, 0.2);
        zipperStrip.material = goldMat;
        zipperStrip.parent = torso;

        // Decorative shoulder pads (Bracers style)
        const shoulderL = CreateSphere('shoulderL', { diameter: 0.32 }, scene);
        shoulderL.position.set(-0.35, 1.45, 0);
        shoulderL.material = goldMat;
        shoulderL.parent = characterRoot;

        const shoulderR = CreateSphere('shoulderR', { diameter: 0.32 }, scene);
        shoulderR.position.set(0.35, 1.45, 0);
        shoulderR.material = goldMat;
        shoulderR.parent = characterRoot;

        // Left and Right arm
        const armL = CreateCylinder('armL', { height: 0.65, diameter: 0.15 }, scene);
        armL.position.set(-0.38, 1.1, 0);
        armL.material = metalRedMat;
        armL.parent = characterRoot;
        meshesRef.current.armL = armL;

        const armR = CreateCylinder('armR', { height: 0.65, diameter: 0.15 }, scene);
        armR.position.set(0.38, 1.1, 0);
        armR.material = metalRedMat;
        armR.parent = characterRoot;
        meshesRef.current.armR = armR;

        // Head Visor node
        const headVisor = CreateSphere('headVisor', { diameter: 0.4 }, scene);
        headVisor.position.y = 1.72;
        headVisor.material = metalDarkMat;
        headVisor.parent = characterRoot;
        meshesRef.current.headVisor = headVisor;

        const faceShield = CreateBox('faceShield', { width: 0.24, height: 0.14, depth: 0.12 }, scene);
        faceShield.position.set(0, 0.02, 0.16);
        faceShield.material = glowBlueMat;
        faceShield.parent = headVisor;

        // ====================================================
        // OPTIONAL CUSTOMIZABLE GEARS (TOGGLE VISIBILITY)
        // ====================================================
        
        // 1. Oracle Interface Headwrap
        const headwrapMesh = CreateCylinder('headwrap', { height: 0.15, diameterTop: 0.42, diameterBottom: 0.41 }, scene);
        headwrapMesh.position.y = 1.88;
        headwrapMesh.material = whiteWrapMat;
        headwrapMesh.parent = characterRoot;
        meshesRef.current.headwrapMesh = headwrapMesh;

        // 2. Executive Crown Seal (glowing circle behind head or chest)
        const crownSealMesh = CreateTorus('crownSeal', { diameter: 0.45, thickness: 0.05, tessellation: 16 }, scene);
        crownSealMesh.position.set(0, 1.15, -0.25);
        crownSealMesh.rotation.x = Math.PI / 2;
        crownSealMesh.material = goldMat;
        crownSealMesh.parent = characterRoot;
        meshesRef.current.crownSealMesh = crownSealMesh;

        // 3. Signal Conduit Core (chest glowing cell)
        const conduitCoreMesh = CreateSphere('conduitCore', { diameter: 0.18 }, scene);
        conduitCoreMesh.position.set(0, 1.25, 0.2);
        conduitCoreMesh.material = glowBlueMat;
        conduitCoreMesh.parent = characterRoot;
        meshesRef.current.conduitCoreMesh = conduitCoreMesh;

        // 4. Command Bracers
        const bracersL = CreateCylinder('bracersL', { height: 0.35, diameter: 0.18 }, scene);
        bracersL.position.y = -0.15;
        bracersL.material = goldMat;
        bracersL.parent = armL;
        meshesRef.current.bracersL = bracersL;

        const bracersR = CreateCylinder('bracersR', { height: 0.35, diameter: 0.18 }, scene);
        bracersR.position.y = -0.15;
        bracersR.material = goldMat;
        bracersR.parent = armR;
        meshesRef.current.bracersR = bracersR;

        // 5. Rail Command Coat plates
        const coatPlateL = CreateBox('coatPlateL', { width: 0.06, height: 0.8, depth: 0.24 }, scene);
        coatPlateL.position.set(-0.25, 0.7, 0.1);
        coatPlateL.rotation.z = -0.12;
        coatPlateL.material = metalRedMat;
        coatPlateL.parent = characterRoot;

        const coatPlateR = CreateBox('coatPlateR', { width: 0.06, height: 0.8, depth: 0.24 }, scene);
        coatPlateR.position.set(0.25, 0.7, 0.1);
        coatPlateR.rotation.z = 0.12;
        coatPlateR.material = metalRedMat;
        coatPlateR.parent = characterRoot;

        meshesRef.current.coatPlates = [coatPlateL, coatPlateR];
      });

    // ====================================================
    // ANIMATION & RENDER TICK LOOP
    // ====================================================
    let time = 0;
    const renderLoop = () => {
      time += 0.035;

      // Rotate glowing platform rings
      ringInner.rotation.y = time * 0.4;
      ringMid.rotation.y = -time * 0.6;
      ringOuter.rotation.y = time * 0.25;

      // Gently bob platform slightly
      platformRoot.position.y = Math.sin(time * 0.8) * 0.02;

      // Procedural animations if refs are active
      const { 
        characterRoot: root, headVisor, armL, armR, legL, legR, 
        conduitCoreMesh, crownSealMesh 
      } = meshesRef.current;

      if (root) {
        if (animationMode === 'IDLE') {
          // Slow breathing animation
          root.position.y = Math.sin(time * 1.5) * 0.02 + 0.08;
          
          if (headVisor) headVisor.rotation.x = Math.sin(time * 1.5) * 0.03;
          if (headVisor) headVisor.rotation.y = Math.cos(time * 0.5) * 0.05;

          if (armL) {
            armL.rotation.x = Math.sin(time * 1.5) * 0.08;
            armL.rotation.z = -0.1 + Math.sin(time * 0.5) * 0.02;
          }
          if (armR) {
            armR.rotation.x = -Math.sin(time * 1.5) * 0.08;
            armR.rotation.z = 0.1 - Math.sin(time * 0.5) * 0.02;
          }

          if (legL) {
            legL.rotation.x = 0;
            legL.rotation.z = -0.05;
          }
          if (legR) {
            legR.rotation.x = 0;
            legR.rotation.z = 0.05;
          }
        } else {
          // Energetic Jogging running cycle
          root.position.y = Math.abs(Math.sin(time * 4)) * 0.1 + 0.06;
          
          if (headVisor) headVisor.rotation.x = 0.1 + Math.sin(time * 4) * 0.03;

          if (armL) {
            armL.rotation.x = -Math.sin(time * 4) * 0.55;
            armL.rotation.z = -0.15;
          }
          if (armR) {
            armR.rotation.x = Math.sin(time * 4) * 0.55;
            armR.rotation.z = 0.15;
          }

          if (legL) {
            legL.rotation.x = Math.sin(time * 4) * 0.5;
            legL.rotation.z = -0.02;
          }
          if (legR) {
            legR.rotation.x = -Math.sin(time * 4) * 0.5;
            legR.rotation.z = 0.02;
          }
        }

        // Animate floating items (Conduit core pulse, crown seal rotate)
        if (conduitCoreMesh) {
          const pulse = 0.8 + Math.abs(Math.sin(time * 2)) * 0.3;
          conduitCoreMesh.scaling.set(pulse, pulse, pulse);
        }
        if (crownSealMesh) {
          crownSealMesh.rotation.y = time * 0.8;
          crownSealMesh.position.y = 1.15 + Math.sin(time * 1.5) * 0.04;
        }
      }

      scene.render();
    };

    engine.runRenderLoop(renderLoop);

    // Watch resize
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, [isLoading, animationMode]);

  // Synchronize gear visibility checkboxes
  useEffect(() => {
    const { 
      headwrapMesh, crownSealMesh, conduitCoreMesh, 
      bracersL, bracersR, coatPlates 
    } = meshesRef.current;

    if (headwrapMesh) headwrapMesh.isVisible = gear.headwrap;
    if (crownSealMesh) crownSealMesh.isVisible = gear.crownSeal;
    if (conduitCoreMesh) conduitCoreMesh.isVisible = gear.conduitCore;
    
    if (bracersL) bracersL.isVisible = gear.bracers;
    if (bracersR) bracersR.isVisible = gear.bracers;

    if (coatPlates) {
      coatPlates.forEach(plate => {
        plate.isVisible = gear.commandCoat;
      });
    }
  }, [gear]);

  const toggleGear = (item: keyof typeof gear) => {
    setGear(prev => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#030508] select-none" id="pre-deployment-portal">
      <AnimatePresence mode="wait">
        {isLoading ? (
          // ====================================================
          // LOADER SCREEN FOR PRE-DEPLOYMENT GLTF
          // ====================================================
          <motion.div 
            key="pre-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#030509] flex flex-col justify-center items-center z-50 p-6"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(242,125,38,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none mix-blend-overlay opacity-30" />
            <div className="w-full max-w-md space-y-8 relative">
              
              {/* High-tech corners */}
              <div className="absolute -top-4 -left-4 w-3.5 h-3.5 border-t border-l border-[#F27D26]" />
              <div className="absolute -top-4 -right-4 w-3.5 h-3.5 border-t border-r border-[#F27D26]" />
              <div className="absolute -bottom-4 -left-4 w-3.5 h-3.5 border-b border-l border-[#F27D26]" />
              <div className="absolute -bottom-4 -right-4 w-3.5 h-3.5 border-b border-r border-[#F27D26]" />

              <div className="text-center space-y-3">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-[#F27D26] animate-pulse" />
                  <div className="absolute inset-0 rounded-full border border-[#F27D26]/20 border-t-[#F27D26] animate-spin" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-black text-[#F27D26] tracking-[0.2em] uppercase">
                    GLTF CALIBRATION SEQUENCE
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                    System Asset Initialization Node
                  </p>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9.5px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5 uppercase font-bold text-zinc-500">
                    <Database size={11} className="text-[#F27D26]" />
                    Container Cache
                  </span>
                  <span className="font-bold text-[#F27D26]">{loadingProgress}%</span>
                </div>
                
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-650 via-[#F27D26] to-amber-500 rounded-full shadow-[0_0_8px_rgba(242,125,38,0.5)]"
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ ease: "easeInOut", duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Console Logs Output */}
              <div className="bg-black/85 border border-[#F27D26]/10 rounded-lg p-3 h-24 overflow-y-auto no-scrollbar font-mono text-[9px] text-zinc-400 space-y-1.5">
                <div className="text-emerald-500 flex items-center gap-1">
                  <span className="text-[8px] px-1 bg-emerald-950/50 border border-emerald-900 rounded">SYS</span>
                  <span>Engine status initialized. WebSocket idle...</span>
                </div>
                <div className="text-amber-500 flex items-center gap-1">
                  <span className="text-[8px] px-1 bg-amber-950/50 border border-amber-900 rounded">GLTF</span>
                  <span>{loadingStep}</span>
                </div>
                <div className="text-zinc-600 flex items-center gap-1">
                  <span>&gt; Mounting client renderer frame...</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // ====================================================
          // PRE-DEPLOYMENT LOUNGE WORKSPACE
          // ====================================================
          <motion.div 
            key="pre-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative"
          >
            {/* Background cyber grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(242,125,38,0.03)_0%,transparent_75%)] pointer-events-none z-0" />

            {/* 3D Viewport Column */}
            <div className="flex-1 flex flex-col min-h-0 relative z-10 border-b lg:border-b-0 lg:border-r border-zinc-900">
              
              {/* Header inside viewport */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
                <span className="text-[8.5px] font-mono text-[#F27D26] font-bold tracking-[0.25em] uppercase">
                  ACTIVE VIEWPORT // ORBIT CALIBRATED
                </span>
                <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">
                  CST-ERT COMMANDER 3D RIG
                </h3>
              </div>

              {/* Animation controls overlay */}
              <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                <button
                  onClick={() => setAnimationMode('IDLE')}
                  className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-1 border cursor-pointer ${
                    animationMode === 'IDLE'
                      ? 'bg-[#F27D26] text-black border-[#F27D26]'
                      : 'bg-zinc-950/90 text-zinc-400 border-zinc-850 hover:bg-zinc-900'
                  }`}
                >
                  <RefreshCw size={11} className={animationMode === 'IDLE' ? 'animate-spin' : ''} />
                  Idle Stance
                </button>
                <button
                  onClick={() => setAnimationMode('JOGGING')}
                  className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-1 border cursor-pointer ${
                    animationMode === 'JOGGING'
                      ? 'bg-[#F27D26] text-black border-[#F27D26]'
                      : 'bg-zinc-950/90 text-zinc-400 border-zinc-850 hover:bg-zinc-900'
                  }`}
                >
                  <Layers size={11} />
                  Jog Test Cycle
                </button>
              </div>

              {/* Viewport instruction card */}
              <div className="absolute top-4 right-4 z-20 bg-zinc-950/80 border border-zinc-850/60 p-2.5 rounded-lg text-right pointer-events-none">
                <span className="text-[8px] font-mono text-zinc-500 block uppercase font-bold">ArcRotate Camera</span>
                <span className="text-[9.5px] font-mono text-zinc-300 block font-bold">DRAG OR ORBIT SCREEN TO INSPECT</span>
              </div>

              {/* Interactive canvas element */}
              <canvas ref={canvasRef} className="w-full h-full flex-1 touch-none outline-none" />
            </div>

            {/* ====================================================
                MTD GLTF CARD HOLDER (CUSTOMIZER PANEL)
               ==================================================== */}
            <div className="w-full lg:w-[380px] bg-zinc-950/70 backdrop-blur-md flex flex-col p-5 md:p-6 min-h-0 overflow-y-auto no-scrollbar relative z-10 border-t lg:border-t-0 border-zinc-900 select-text">
              
              {/* Card Holder Branding */}
              <div className="border-b border-[#F27D26]/20 pb-4 mb-5 space-y-2 select-text">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F27D26] animate-pulse" />
                  <span className="text-[10px] font-mono font-black text-[#F27D26] tracking-[0.25em] uppercase">
                    MTD GLTF CARD HOLDER
                  </span>
                </div>
                
                <h2 className="text-xl font-serif font-black text-white uppercase tracking-wider leading-tight">
                  CST-ERT COMMANDER
                </h2>
                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                  <span>DESIGNATION: CST-ERT-CMD-77A</span>
                  <span className="text-emerald-500 font-bold bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/40">
                    STATUS: SECURED
                  </span>
                </div>
              </div>

              {/* Commander Interactive Gear System */}
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-[10.5px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <Settings size={12} className="text-[#F27D26]" />
                    Commander Gear Configuration
                  </h3>
                  
                  <div className="space-y-2.5">
                    {/* Item 1: Headwrap */}
                    <div 
                      onClick={() => toggleGear('headwrap')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        gear.headwrap 
                          ? 'bg-[#F27D26]/5 border-[#F27D26]/40 text-zinc-100' 
                          : 'bg-black/40 border-zinc-900/65 text-zinc-500 hover:border-zinc-800'
                      }`}
                    >
                      <div className="space-y-0.5 pointer-events-none">
                        <span className="text-[10px] font-serif font-black block uppercase tracking-wide">
                          Oracle Interface Headwrap
                        </span>
                        <span className="text-[8.5px] font-mono text-zinc-500 block">
                          Neural Command Uplink (+15% speed)
                        </span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        gear.headwrap ? 'bg-[#F27D26] border-[#F27D26]' : 'border-zinc-800'
                      }`}>
                        {gear.headwrap && <span className="w-1.5 h-1.5 bg-black rounded-sm" />}
                      </div>
                    </div>

                    {/* Item 2: Crown Seal */}
                    <div 
                      onClick={() => toggleGear('crownSeal')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        gear.crownSeal 
                          ? 'bg-[#F27D26]/5 border-[#F27D26]/40 text-zinc-100' 
                          : 'bg-black/40 border-zinc-900/65 text-zinc-500 hover:border-zinc-800'
                      }`}
                    >
                      <div className="space-y-0.5 pointer-events-none">
                        <span className="text-[10px] font-serif font-black block uppercase tracking-wide">
                          Executive Crown Seal
                        </span>
                        <span className="text-[8.5px] font-mono text-zinc-500 block">
                          CST High-level Authorization (+25% energy)
                        </span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        gear.crownSeal ? 'bg-[#F27D26] border-[#F27D26]' : 'border-zinc-800'
                      }`}>
                        {gear.crownSeal && <span className="w-1.5 h-1.5 bg-black rounded-sm" />}
                      </div>
                    </div>

                    {/* Item 3: Conduit Core */}
                    <div 
                      onClick={() => toggleGear('conduitCore')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        gear.conduitCore 
                          ? 'bg-[#F27D26]/5 border-[#F27D26]/40 text-zinc-100' 
                          : 'bg-black/40 border-zinc-900/65 text-zinc-500 hover:border-zinc-800'
                      }`}
                    >
                      <div className="space-y-0.5 pointer-events-none">
                        <span className="text-[10px] font-serif font-black block uppercase tracking-wide">
                          Signal Conduit Core
                        </span>
                        <span className="text-[8.5px] font-mono text-zinc-500 block">
                          Oracle battlegrid receptor (+15% energy, +5% speed)
                        </span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        gear.conduitCore ? 'bg-[#F27D26] border-[#F27D26]' : 'border-zinc-800'
                      }`}>
                        {gear.conduitCore && <span className="w-1.5 h-1.5 bg-black rounded-sm" />}
                      </div>
                    </div>

                    {/* Item 4: Command Bracers */}
                    <div 
                      onClick={() => toggleGear('bracers')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        gear.bracers 
                          ? 'bg-[#F27D26]/5 border-[#F27D26]/40 text-zinc-100' 
                          : 'bg-black/40 border-zinc-900/65 text-zinc-500 hover:border-zinc-800'
                      }`}
                    >
                      <div className="space-y-0.5 pointer-events-none">
                        <span className="text-[10px] font-serif font-black block uppercase tracking-wide">
                          Command Bracers
                        </span>
                        <span className="text-[8.5px] font-mono text-zinc-500 block">
                          Holographic tactical HUD controllers (+10% armor)
                        </span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        gear.bracers ? 'bg-[#F27D26] border-[#F27D26]' : 'border-zinc-800'
                      }`}>
                        {gear.bracers && <span className="w-1.5 h-1.5 bg-black rounded-sm" />}
                      </div>
                    </div>

                    {/* Item 5: Command Coat */}
                    <div 
                      onClick={() => toggleGear('commandCoat')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        gear.commandCoat 
                          ? 'bg-[#F27D26]/5 border-[#F27D26]/40 text-zinc-100' 
                          : 'bg-black/40 border-zinc-900/65 text-zinc-500 hover:border-zinc-800'
                      }`}
                    >
                      <div className="space-y-0.5 pointer-events-none">
                        <span className="text-[10px] font-serif font-black block uppercase tracking-wide">
                          Rail Command Coat
                        </span>
                        <span className="text-[8.5px] font-mono text-zinc-500 block">
                          Adaptive fibers climate-sealed fabric (+20% armor)
                        </span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        gear.commandCoat ? 'bg-[#F27D26] border-[#F27D26]' : 'border-zinc-800'
                      }`}>
                        {gear.commandCoat && <span className="w-1.5 h-1.5 bg-black rounded-sm" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Calibrated Stats */}
                <div className="space-y-3 pt-4 border-t border-zinc-900/60">
                  <h3 className="text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1">
                    Calibrated Output Metrics
                  </h3>
                  
                  <div className="space-y-2">
                    {/* Speed Stat */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9.5px] font-mono text-zinc-550">
                        <span className="uppercase flex items-center gap-1">
                          <Radio size={10} className="text-[#F27D26]" />
                          Run Velocity (SPEED)
                        </span>
                        <span className="text-zinc-350 font-bold">{stats.speed}%</span>
                      </div>
                      <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F27D26]" style={{ width: `${stats.speed}%` }} />
                      </div>
                    </div>

                    {/* Armor Stat */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9.5px] font-mono text-zinc-550">
                        <span className="uppercase flex items-center gap-1">
                          <Shield size={10} className="text-[#F27D26]" />
                          Hull Armor Resistance (HP)
                        </span>
                        <span className="text-zinc-350 font-bold">{stats.armor}%</span>
                      </div>
                      <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F27D26]" style={{ width: `${stats.armor}%` }} />
                      </div>
                    </div>

                    {/* Energy Stat */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9.5px] font-mono text-zinc-550">
                        <span className="uppercase flex items-center gap-1">
                          <Zap size={10} className="text-yellow-500 animate-pulse" />
                          Capacitor Energy Charge
                        </span>
                        <span className="text-zinc-350 font-bold">{stats.energy}%</span>
                      </div>
                      <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F27D26]" style={{ width: `${stats.energy}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deployment Action CTA */}
              <div className="pt-6 border-t border-zinc-900 mt-6 space-y-2 select-text">
                <button
                  onClick={onDeploy}
                  className="py-4.5 px-6 bg-gradient-to-r from-red-650 via-[#F27D26] to-amber-500 hover:from-red-600 hover:to-amber-450 text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all shadow-[0_0_24px_rgba(242,125,38,0.2)] hover:shadow-[0_0_32px_rgba(242,125,38,0.3)] hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 w-full font-serif"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>DEPLOY CALIBRATED RUNNER</span>
                </button>
                
                <button
                  onClick={onQuit}
                  className="w-full py-2.5 text-zinc-500 hover:text-zinc-300 font-mono text-[9.5px] uppercase tracking-widest cursor-pointer hover:bg-zinc-950/40 rounded-lg transition-colors border border-transparent hover:border-zinc-900/60"
                >
                  Return to Character Chamber
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
