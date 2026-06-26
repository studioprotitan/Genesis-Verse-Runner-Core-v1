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
  TransformNode,
  DynamicTexture,
  Mesh,
  SceneLoader
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import '@babylonjs/inspector';
import { GameState, Lane, ObstacleType, ObstacleData, PlayerState, WeaponType, CollectibleData } from '../types';

const primaryGlbUrl = '/jog-fwd.glb';
const fallbackGlbUrl = '/idle.glb';

interface GameCanvasProps {
  gameState: GameState;
  selectedGear: {
    visorColor: string;
    armorColor: string;
    chestColor: string;
    hasShield: boolean;
    hasJetpack: boolean;
    weaponType: WeaponType;
  };
  onStatsUpdate: (stats: PlayerState) => void;
  onGameOver: () => void;
}

export default function GameCanvas({
  gameState,
  selectedGear,
  onStatsUpdate,
  onGameOver
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [inspectorVisible, setInspectorVisible] = useState<boolean>(false);
  const isMutedRef = useRef<boolean>(false);

  const toggleInspector = () => {
    if (!sceneRef.current) return;
    const isVisible = !inspectorVisible;
    setInspectorVisible(isVisible);
    if (isVisible) {
      sceneRef.current.debugLayer.show({ overlay: true });
    } else {
      sceneRef.current.debugLayer.hide();
    }
  };

  // Sound effects generator
  const playSynthSFX = (type: 'jump' | 'slide' | 'collect' | 'damage' | 'speed_boost' | 'slam') => {
    if (isMutedRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'jump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'slide') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'collect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'damage') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'speed_boost') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Audio block safety
    }
  };

  useEffect(() => {
    if (!canvasRef.current || gameState !== GameState.PLAYING) return;

    // 1. Engine & Scene Setup
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    sceneRef.current = scene;

    scene.clearColor = new Color3(0.015, 0.02, 0.035).toColor4(1);

    // 2. Camera tracking
    const camera = new ArcRotateCamera('gameCamera', -Math.PI / 2, Math.PI / 2.3, 5.5, new Vector3(0, 1.2, 0), scene);
    camera.lowerRadiusLimit = 4.5;
    camera.upperRadiusLimit = 8.5;
    camera.lowerBetaLimit = 1.0;
    camera.upperBetaLimit = 1.5;

    // 3. Cyber Lights
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.55;
    hemiLight.groundColor = new Color3(0.05, 0.08, 0.15);

    const fillLight = new PointLight('fillLight', new Vector3(-2.5, 1.5, -2.0), scene);
    fillLight.intensity = 0.65;
    fillLight.diffuse = Color3.FromHexString(selectedGear.chestColor);

    const keyLight = new PointLight('keyLight', new Vector3(2.5, 3.0, 2.0), scene);
    keyLight.intensity = 0.7;
    keyLight.diffuse = Color3.FromHexString(selectedGear.visorColor);

    // 4. Custom Materials Setup
    const metalBodyMat = new StandardMaterial('metalBodyMat', scene);
    metalBodyMat.diffuseColor = Color3.FromHexString(selectedGear.armorColor);
    metalBodyMat.specularColor = new Color3(0.6, 0.6, 0.8);

    const neonVisorMat = new StandardMaterial('neonVisorMat', scene);
    neonVisorMat.emissiveColor = Color3.FromHexString(selectedGear.visorColor);

    const chestEmissiveMat = new StandardMaterial('chestEmissiveMat', scene);
    chestEmissiveMat.emissiveColor = Color3.FromHexString(selectedGear.chestColor);

    const metalDullMat = new StandardMaterial('metalDullMat', scene);
    metalDullMat.diffuseColor = new Color3(0.2, 0.2, 0.22);

    // 5. Build Runner Highway Planes (The Track)
    const laneWidth = 2.0;
    const trackLength = 160.0;

    const trackMat = new StandardMaterial('trackMat', scene);
    trackMat.diffuseColor = new Color3(0.03, 0.04, 0.07);
    trackMat.emissiveColor = new Color3(0.01, 0.015, 0.025);

    const trackLeft = CreateBox('trackLeft', { width: laneWidth, height: 0.1, depth: trackLength }, scene);
    trackLeft.position.set(-laneWidth, -0.05, trackLength / 2 - 10);
    trackLeft.material = trackMat;

    const trackCenter = CreateBox('trackCenter', { width: laneWidth, height: 0.1, depth: trackLength }, scene);
    trackCenter.position.set(0, -0.05, trackLength / 2 - 10);
    trackCenter.material = trackMat;

    const trackRight = CreateBox('trackRight', { width: laneWidth, height: 0.1, depth: trackLength }, scene);
    trackRight.position.set(laneWidth, -0.05, trackLength / 2 - 10);
    trackRight.material = trackMat;

    // High contrast neon borders
    const borderL = CreateBox('borderL', { width: 0.08, height: 0.15, depth: trackLength }, scene);
    borderL.position.set(-laneWidth * 1.5, 0.02, trackLength / 2 - 10);
    const borderMat = new StandardMaterial('borderMat', scene);
    borderMat.emissiveColor = new Color3(0.95, 0.49, 0.15); // Neon tactical orange
    borderL.material = borderMat;

    const borderR = borderL.clone('borderR');
    borderR.position.x = laneWidth * 1.5;

    // 6. Character Base Skeleton & Setup
    const characterRoot = new TransformNode('charRoot', scene);
    characterRoot.position.set(0, 0.08, 0);

    // High-poly procedural torso components
    const coreBody = CreateCylinder('coreBody', { height: 1.4, diameterTop: 0.48, diameterBottom: 0.35, tessellation: 48 }, scene);
    coreBody.position.y = 0.75;
    coreBody.material = metalBodyMat;
    coreBody.parent = characterRoot;

    const headVisor = CreateSphere('headVisor', { diameter: 0.48, segments: 48 }, scene);
    headVisor.position.y = 1.6;
    headVisor.material = neonVisorMat;
    headVisor.parent = characterRoot;

    const chestPlate = CreateBox('chestPlate', { width: 0.45, height: 0.45, depth: 0.25 }, scene);
    chestPlate.position.set(0, 0.9, 0.18);
    chestPlate.material = chestEmissiveMat;
    chestPlate.parent = characterRoot;

    const armL = CreateCylinder('armL', { height: 0.8, diameter: 0.18, tessellation: 36 }, scene);
    armL.position.set(-0.38, 0.95, 0);
    armL.material = metalDullMat;
    armL.parent = characterRoot;

    const armR = armL.clone('armR');
    armR.position.x = 0.38;
    armR.parent = characterRoot;

    const legL = CreateCylinder('legL', { height: 0.8, diameter: 0.2, tessellation: 36 }, scene);
    legL.position.set(-0.22, 0.35, 0);
    legL.material = metalDullMat;
    legL.parent = characterRoot;

    const legR = legL.clone('legR');
    legR.position.x = 0.22;
    legR.parent = characterRoot;

    // Translucent shield
    const hexForceField = CreateSphere('hexForceField', { diameter: 2.1, segments: 64 }, scene);
    hexForceField.position.y = 0.9;
    const shieldMat = new StandardMaterial('shieldMat', scene);
    shieldMat.diffuseColor = new Color3(0.1, 0.8, 1.0);
    shieldMat.emissiveColor = new Color3(0.15, 0.9, 1.0);
    shieldMat.alpha = 0.22;
    hexForceField.material = shieldMat;
    hexForceField.parent = characterRoot;
    hexForceField.isVisible = selectedGear.hasShield;

    // GLTF Loading and Animation Setup
    let hasLoadedGltf = false;
    let loadedRoot: any = null;
    let isTemporarilyStaggered = false;
    const loadedAnims: {
      idle?: any;
      running?: any;
      jumping?: any;
      sliding?: any;
      stagger?: any;
      dead?: any;
    } = {};

    let currentAnimState: 'IDLE' | 'RUNNING' | 'JUMPING' | 'SLIDING' | 'STAGGER' | 'DEAD' = 'RUNNING';

    const playLoadedAnim = (state: typeof currentAnimState) => {
      if (currentAnimState === state) return;
      
      const prevAnim = loadedAnims[currentAnimState.toLowerCase() as keyof typeof loadedAnims];
      let nextAnim = loadedAnims[state.toLowerCase() as keyof typeof loadedAnims];
      
      if (!nextAnim) {
        if (state === 'JUMPING' || state === 'SLIDING' || state === 'STAGGER') {
          nextAnim = loadedAnims.running || loadedAnims.idle;
        } else if (state === 'DEAD') {
          nextAnim = loadedAnims.stagger || loadedAnims.idle;
        }
      }
      
      currentAnimState = state;
      
      if (nextAnim) {
        const loop = (state !== 'JUMPING' && state !== 'STAGGER' && state !== 'DEAD');
        
        if (prevAnim && prevAnim !== nextAnim) {
          let progress = 0;
          const blendTime = 0.12; // 120ms
          nextAnim.play(loop);
          nextAnim.weight = 0.01;
          
          const observer = scene.onBeforeRenderObservable.add(() => {
            progress += engine.getDeltaTime() / 1000;
            const ratio = Math.min(1.0, progress / blendTime);
            prevAnim.weight = 1.0 - ratio;
            nextAnim.weight = ratio;
            if (ratio >= 1.0) {
              prevAnim.stop();
              scene.onBeforeRenderObservable.remove(observer);
            }
          });
        } else {
          nextAnim.play(loop);
          nextAnim.weight = 1.0;
        }
      }
    };

    const loadGltfModel = (url: string): Promise<any> => {
      const lastSlash = url.lastIndexOf('/');
      const rootUrl = lastSlash !== -1 ? url.substring(0, lastSlash + 1) : '';
      const fileName = lastSlash !== -1 ? url.substring(lastSlash + 1) : url;
      return SceneLoader.ImportMeshAsync('', rootUrl, fileName, scene);
    };

    // Load character model
    loadGltfModel(primaryGlbUrl)
      .catch((err) => {
        console.warn(`Failed to load primary jog glTF (${primaryGlbUrl}), trying fallback idle glTF (${fallbackGlbUrl}):`, err);
        return loadGltfModel(fallbackGlbUrl);
      })
      .then((result) => {
        console.log('GLTF character model loaded successfully in GameCanvas:', result);
        loadedRoot = result.meshes[0];
        loadedRoot.parent = characterRoot;
        loadedRoot.scaling = new Vector3(1, 1, 1);
        loadedRoot.position = Vector3.Zero();

        // Hide procedural mesh placeholders
        coreBody.isVisible = false;
        headVisor.isVisible = false;
        chestPlate.isVisible = false;
        armL.isVisible = false;
        armR.isVisible = false;
        legL.isVisible = false;
        legR.isVisible = false;

        hasLoadedGltf = true;

        // Store animation groups
        const animGroups = result.animationGroups;
        animGroups.forEach((g: any) => {
          g.stop();
          g.weight = 0.0;
        });

        const findAnim = (keywords: string[]) => {
          return animGroups.find((g: any) => {
            const n = g.name.toLowerCase();
            return keywords.some((kw: string) => n.includes(kw));
          });
        };

        loadedAnims.idle = findAnim(['idle', 'hero']);
        loadedAnims.running = findAnim(['walk_fwd', 'run', 'jog', 'walk', 'cst-ert-walk-a', 'jog-fwd', 'jog_fwd']);
        loadedAnims.jumping = findAnim(['jump', 'leap', 'air']);
        loadedAnims.sliding = findAnim(['slide', 'crouch']);
        loadedAnims.stagger = findAnim(['damage', 'stagger', 'hit', 'pain']);
        loadedAnims.dead = findAnim(['crash', 'dead', 'die', 'collapse']);

        // Fallback for running animation if no explicit keyword matched
        if (!loadedAnims.running && animGroups.length > 0) {
          loadedAnims.running = animGroups[0];
        }

        // Set initial running animation
        if (loadedAnims.running) {
          loadedAnims.running.play(true);
          loadedAnims.running.weight = 1.0;
          currentAnimState = 'RUNNING';
        } else if (loadedAnims.idle) {
          loadedAnims.idle.play(true);
          loadedAnims.idle.weight = 1.0;
          currentAnimState = 'IDLE';
        }
      })
      .catch((err) => {
        console.warn('Failed to load any character glTF. Falling back to high-detail procedural meshes:', err);
      });

    // 7. Dynamic Obstacles Spawning & Pooling
    const activeObstacles: { mesh: Mesh; data: ObstacleData }[] = [];
    const activeCollectibles: { mesh: Mesh; data: CollectibleData }[] = [];

    const obstacleMaterials: Record<ObstacleType, StandardMaterial> = {
      [ObstacleType.WALL]: new StandardMaterial('wallMat', scene),
      [ObstacleType.SPIKE_ROCK]: new StandardMaterial('spikeMat', scene),
      [ObstacleType.DRONE]: new StandardMaterial('droneMat', scene),
      [ObstacleType.LOW_BARRIER]: new StandardMaterial('barrierMat', scene),
    };

    obstacleMaterials[ObstacleType.WALL].diffuseColor = new Color3(0.8, 0.1, 0.1);
    obstacleMaterials[ObstacleType.WALL].emissiveColor = new Color3(0.4, 0.05, 0.05);

    obstacleMaterials[ObstacleType.SPIKE_ROCK].diffuseColor = new Color3(0.4, 0.3, 0.3);
    obstacleMaterials[ObstacleType.SPIKE_ROCK].emissiveColor = new Color3(0.2, 0.05, 0.0);

    obstacleMaterials[ObstacleType.DRONE].diffuseColor = new Color3(0.1, 0.8, 0.8);
    obstacleMaterials[ObstacleType.DRONE].emissiveColor = new Color3(0.0, 0.4, 0.4);

    obstacleMaterials[ObstacleType.LOW_BARRIER].diffuseColor = new Color3(0.8, 0.8, 0.1);
    obstacleMaterials[ObstacleType.LOW_BARRIER].emissiveColor = new Color3(0.4, 0.4, 0.05);

    const coinMat = new StandardMaterial('coinMat', scene);
    coinMat.emissiveColor = new Color3(0.95, 0.65, 0.0);

    const energyMat = new StandardMaterial('energyMat', scene);
    energyMat.emissiveColor = new Color3(0.1, 0.95, 0.1);

    const spawnObstacle = (zPosition: number) => {
      const typeList = Object.values(ObstacleType);
      const chosenType = typeList[Math.floor(Math.random() * typeList.length)];
      const chosenLane = [Lane.LEFT, Lane.CENTER, Lane.RIGHT][Math.floor(Math.random() * 3)];

      let mesh: Mesh;
      if (chosenType === ObstacleType.WALL) {
        mesh = CreateBox('wall', { width: laneWidth, height: 2.2, depth: 0.5 }, scene);
        mesh.position.set(chosenLane * laneWidth, 1.1, zPosition);
      } else if (chosenType === ObstacleType.SPIKE_ROCK) {
        mesh = CreateCylinder('spike', { height: 1.2, diameterTop: 0, diameterBottom: 0.8, tessellation: 8 }, scene);
        mesh.position.set(chosenLane * laneWidth, 0.6, zPosition);
      } else if (chosenType === ObstacleType.DRONE) {
        mesh = CreateSphere('drone', { diameter: 0.6, segments: 12 }, scene);
        mesh.position.set(chosenLane * laneWidth, 1.6, zPosition);
      } else {
        mesh = CreateBox('barrier', { width: laneWidth, height: 0.5, depth: 0.4 }, scene);
        mesh.position.set(chosenLane * laneWidth, 0.25, zPosition);
      }

      mesh.material = obstacleMaterials[chosenType];
      activeObstacles.push({
        mesh,
        data: {
          id: Math.random().toString(),
          type: chosenType,
          lane: chosenLane,
          zPosition,
          hasBeenPassed: false
        }
      });
    };

    const spawnCollectible = (zPosition: number) => {
      const type = Math.random() > 0.4 ? 'COIN' : 'ENERGY_CELL';
      const chosenLane = [Lane.LEFT, Lane.CENTER, Lane.RIGHT][Math.floor(Math.random() * 3)];
      
      let mesh: Mesh;
      if (type === 'COIN') {
        mesh = CreateCylinder('coin', { height: 0.08, diameter: 0.4, tessellation: 12 }, scene);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(chosenLane * laneWidth, 0.6, zPosition);
        mesh.material = coinMat;
      } else {
        mesh = CreateBox('energy', { width: 0.3, height: 0.4, depth: 0.3 }, scene);
        mesh.position.set(chosenLane * laneWidth, 0.6, zPosition);
        mesh.material = energyMat;
      }

      activeCollectibles.push({
        mesh,
        data: {
          id: Math.random().toString(),
          type,
          lane: chosenLane,
          zPosition,
          hasBeenCollected: false
        }
      });
    };

    // Pre-populate some obstacles and collectibles far out
    for (let i = 25; i < 150; i += 22) {
      if (Math.random() > 0.3) spawnObstacle(i);
      if (Math.random() > 0.4) spawnCollectible(i + 10);
    }

    // 8. Game Run-Loop variables & Logic
    const playerStats: PlayerState = {
      distance: 0,
      speed: 15.0, // standard forward m/s speed
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      shieldActive: selectedGear.hasShield,
      shieldRemaining: selectedGear.hasShield ? 100 : 0,
      score: 0,
      coins: 0,
      multiplier: 1,
      currentLane: Lane.CENTER,
      targetLaneX: 0,
      xPosition: 0,
      isJumping: false,
      isSliding: false
    };

    let laneTransitionSpeed = 0.15;
    let jumpTime = 0;
    const jumpDuration = 0.8;
    let slideTime = 0;
    const slideDuration = 0.7;

    // Keyboard Action handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') {
        if (playerStats.currentLane === Lane.CENTER) {
          playerStats.currentLane = Lane.LEFT;
        } else if (playerStats.currentLane === Lane.RIGHT) {
          playerStats.currentLane = Lane.CENTER;
        }
      } else if (k === 'arrowright' || k === 'd') {
        if (playerStats.currentLane === Lane.CENTER) {
          playerStats.currentLane = Lane.RIGHT;
        } else if (playerStats.currentLane === Lane.LEFT) {
          playerStats.currentLane = Lane.CENTER;
        }
      } else if ((k === 'arrowup' || k === 'w' || k === ' ') && !playerStats.isJumping && !playerStats.isSliding) {
        playerStats.isJumping = true;
        jumpTime = 0;
        playSynthSFX('jump');
      } else if ((k === 'arrowdown' || k === 's') && !playerStats.isSliding && !playerStats.isJumping) {
        playerStats.isSliding = true;
        slideTime = 0;
        playSynthSFX('slide');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000;
      time += dt;

      // Slowly increase speed up to 25.0 max limit
      playerStats.speed = Math.min(25.0, playerStats.speed + dt * 0.05);

      // Travel distance
      const frameDist = playerStats.speed * dt;
      playerStats.distance += frameDist;
      playerStats.score = Math.floor(playerStats.distance * 1.5) + playerStats.coins * 50;

      // Linear lane interpolation
      playerStats.targetLaneX = playerStats.currentLane * laneWidth;
      playerStats.xPosition += (playerStats.targetLaneX - playerStats.xPosition) * laneTransitionSpeed;

      // Handle jump height calculation
      let jumpY = 0.0;
      if (playerStats.isJumping) {
        jumpTime += dt;
        const progress = jumpTime / jumpDuration;
        if (progress >= 1.0) {
          playerStats.isJumping = false;
        } else {
          // Parabolic jump arc
          jumpY = Math.sin(progress * Math.PI) * 1.45;
        }
      }

      // Handle slide height scaling
      if (playerStats.isSliding) {
        slideTime += dt;
        if (slideTime >= slideDuration) {
          playerStats.isSliding = false;
          coreBody.scaling.y = 1.0;
          coreBody.position.y = 0.75;
          headVisor.position.y = 1.6;

          if (hasLoadedGltf && loadedRoot) {
            loadedRoot.scaling.y = 1.0;
            loadedRoot.position.y = 0;
          }
        } else {
          coreBody.scaling.y = 0.5;
          coreBody.position.y = 0.35;
          headVisor.position.y = 0.8;
        }
      }

      // Position character root mesh
      characterRoot.position.set(playerStats.xPosition, jumpY + 0.08, 0);

      // 9. Synchronize model animations / Swings
      if (hasLoadedGltf) {
        if (playerStats.health <= 0) {
          playLoadedAnim('DEAD');
        } else if (isTemporarilyStaggered) {
          playLoadedAnim('STAGGER');
        } else if (playerStats.isJumping) {
          playLoadedAnim('JUMPING');
        } else if (playerStats.isSliding) {
          playLoadedAnim('SLIDING');
          if (!loadedAnims.sliding && loadedRoot) {
            loadedRoot.scaling.y = 0.55;
            loadedRoot.position.y = -0.3;
          }
        } else {
          playLoadedAnim('RUNNING');
        }
      } else {
        if (!playerStats.isJumping && !playerStats.isSliding) {
          const runCycle = (playerStats.distance * 0.45);
          armL.rotation.x = Math.sin(runCycle) * 0.85;
          armR.rotation.x = -Math.sin(runCycle) * 0.85;
          legL.rotation.x = -Math.sin(runCycle) * 0.85;
          legR.rotation.x = Math.sin(runCycle) * 0.85;
        } else if (playerStats.isJumping) {
          armL.rotation.x = -0.5;
          armR.rotation.x = -0.5;
          legL.rotation.x = 0.3;
          legR.rotation.x = 0.3;
        } else if (playerStats.isSliding) {
          armL.rotation.x = 1.2;
          armR.rotation.x = 1.2;
          legL.rotation.x = -1.0;
          legR.rotation.x = -1.0;
        }
      }

      // Slowly decay energy bar
      playerStats.energy = Math.max(0, playerStats.energy - dt * 2.5);

      // Rotate coins and collectibles
      activeCollectibles.forEach((col) => {
        col.mesh.rotation.y += dt * 3.0;
      });

      // Move obstacles and collectibles closer to player
      activeObstacles.forEach((obs) => {
        obs.mesh.position.z -= frameDist;
        obs.data.zPosition = obs.mesh.position.z;
      });

      activeCollectibles.forEach((col) => {
        col.mesh.position.z -= frameDist;
        col.data.zPosition = col.mesh.position.z;
      });

      // Spawn new far elements procedurally as we run
      const spawnChance = dt * 1.5;
      if (Math.random() < spawnChance) {
        const farZ = 120.0;
        if (Math.random() > 0.4) spawnObstacle(farZ);
        if (Math.random() > 0.3) spawnCollectible(farZ + 12);
      }

      // Cleanup elements passed behind player (Z < -5)
      for (let i = activeObstacles.length - 1; i >= 0; i--) {
        const obs = activeObstacles[i];
        if (obs.mesh.position.z < -5.0) {
          obs.mesh.dispose();
          activeObstacles.splice(i, 1);
        }
      }

      for (let i = activeCollectibles.length - 1; i >= 0; i--) {
        const col = activeCollectibles[i];
        if (col.mesh.position.z < -5.0) {
          col.mesh.dispose();
          activeCollectibles.splice(i, 1);
        }
      }

      // 10. Direct Collision Detections (AABB box check overlap)
      const playerRadius = 0.42;
      const playerZ = 0.0;

      activeObstacles.forEach((obs) => {
        if (obs.data.hasBeenPassed) return;

        // Check lane matching and Z distance overlap
        const isSameLane = obs.data.lane === playerStats.currentLane;
        const zDist = Math.abs(obs.mesh.position.z - playerZ);

        if (isSameLane && zDist < 0.65) {
          let hasCollision = false;

          if (obs.data.type === ObstacleType.WALL) {
            // High wall: collides unless sliding
            if (!playerStats.isSliding) hasCollision = true;
          } else if (obs.data.type === ObstacleType.LOW_BARRIER) {
            // Low barrier: collides unless jumping
            if (!playerStats.isJumping) hasCollision = true;
          } else if (obs.data.type === ObstacleType.SPIKE_ROCK) {
            // Ground spikes: collides unless jumping
            if (!playerStats.isJumping) hasCollision = true;
          } else if (obs.data.type === ObstacleType.DRONE) {
            // Floating drone: collides unless sliding
            if (!playerStats.isSliding) hasCollision = true;
          }

          if (hasCollision) {
            obs.data.hasBeenPassed = true;
            playSynthSFX('damage');

            if (playerStats.shieldActive) {
              playerStats.shieldActive = false;
              playerStats.shieldRemaining = 0;
              hexForceField.isVisible = false;
            } else {
              playerStats.health = Math.max(0, playerStats.health - 25);
              isTemporarilyStaggered = true;
              
              // Simple flash visual feedback
              let duration = 0;
              const flash = setInterval(() => {
                coreBody.material = (duration % 2 === 0) ? chestEmissiveMat : metalBodyMat;
                duration++;
                if (duration >= 6) {
                  clearInterval(flash);
                  coreBody.material = metalBodyMat;
                  isTemporarilyStaggered = false;
                }
              }, 80);
            }

            if (playerStats.health <= 0) {
              onGameOver();
            }
          }
        }
      });

      // Collectibles overlap checking
      activeCollectibles.forEach((col) => {
        if (col.data.hasBeenCollected) return;

        const isSameLane = col.data.lane === playerStats.currentLane;
        const zDist = Math.abs(col.mesh.position.z - playerZ);

        if (isSameLane && zDist < 0.8) {
          col.data.hasBeenCollected = true;
          col.mesh.dispose();
          playSynthSFX('collect');

          if (col.data.type === 'COIN') {
            playerStats.coins += 1;
            playerStats.score += 50;
          } else {
            // Fill energy
            playerStats.energy = Math.min(playerStats.maxEnergy, playerStats.energy + 30);
          }
        }
      });

      // Forward live stats update to React state
      onStatsUpdate({ ...playerStats });
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      sceneRef.current = null;
      engine.dispose();
    };
  }, [gameState]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block outline-none" />

      {/* Development Debug Inspector Overlay Toggle Button */}
      <button
        onClick={toggleInspector}
        className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-black/70 hover:bg-black/90 border border-[#F27D26]/40 hover:border-[#F27D26] rounded text-[10px] font-mono tracking-wider text-[#F27D26] uppercase select-none transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-lg"
        title="Toggle Babylon.js Inspector to debug glTF meshes & skeleton"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${inspectorVisible ? 'bg-green-500 animate-ping' : 'bg-[#F27D26]'}`} />
        {inspectorVisible ? 'Close Inspector' : 'Debug Inspector'}
      </button>
    </div>
  );
}
