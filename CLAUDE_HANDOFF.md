# CLAUDE AI COLLABORATION PROTOCOL // HANDOFF LEDGER

Welcome, Agent Claude. This handoff document establishes full context alignment for the **Abyssum Runner** endless 3D game project so you can seamlessly continue editing, debugging, or expanding features without loss of fidelity.

---

## 1. PROJECT ARCHITECTURE & CORES
Abyssum Runner is a high-fidelity, retro-tech sci-fi styled 3D endless runner game built in **React 19**, **Vite 6**, **Tailwind CSS v4**, and powered by **Babylon.js (v9.x)**.

### System Directory Map:
*   `/index.html`: Entry point.
*   `/src/main.tsx`: Standard React StrictMode mounting entry.
*   `/src/App.tsx`: App shell, Operator selection console screen, state machine controllers, log panels, and UI layout wrapping.
*   `/src/types.ts`: Core type interfaces (`PlayerState`, `ScoreEntry`, `ObstacleData`) and enums (`GameState`, `Lane`, `ObstacleType`).
*   `/src/index.css`: Global Tailwind CSS v4 directives with custom sci-fi theme colors (`#F27D26`), CRT scanlines, CRT screen flicker, and carbon fiber procedural background pattern styles.
*   `/src/lib/supabase.ts`: Online/offline high-score database syncing ledger client.
*   `/src/components/GameCanvas.tsx`: Core 3D engine workspace. Coordinates the BabylonJS canvas lifecycle, player camera tracking, keyboard/tap controllers, procedural endless track segment spawning, collision solver (AABB physics), sound effects synthesizer (`AudioContext`), and particle emitters.
*   `/src/components/GameHUD.tsx`: Interactive overlays. Displays active diagnostic indicators, live counters, sound states, and a real-time responsive SVG wireframe bone rig diagnostic panel.
*   `/src/components/Leaderboard.tsx`: Run submission form and top player ranking table.

---

## 2. RECENT ENHANCEMENTS & PROBLEM SOLVING

### A. Resolution of Browser "Script error."
*   **Root Cause**: The 3D engine was fetching an external particle texture from GitHub assets (`https://raw.githubusercontent.com/...`). Inside the restricted AI Studio iframe sandbox, cross-origin restrictions blocks WebGL textures, masking the failure as a generic uncatchable browser `Script error.` which crashes execution.
*   **Engineering Fix**: Implemented a procedural `DynamicTexture` using HTML5 Canvas inside `GameCanvas.tsx`. It draws a high-performance glowing radial gradient circle locally at runtime, completely eliminating any external web requests and solving the Script error!

### B. Polish of Collectibles (Energy Crystals & Rift Chargers)
*   **Dynamic Motion**: Collectibles are no longer static. They now rotate around their axes and bob gracefully up and down using sine wave functions (`Math.sin(frameCycle * 0.05) * 0.15`) inside the render loop.
*   **Visual Particle Explosions**: Programmed a temporary particle burst splash system (`createCollectionParticles`) that instantiates a burst emitter at the harvested collectible's coordinates upon impact, showering the player in themed sparks (Gold-Orange sparks for `RIFT_CHARGER` and Neon-Blue sparks for `ENERGY_GATE`).

### C. Cross Chat Handoff Protocol
*   **Handoff Dialog**: Created a beautiful interactive Claude Handoff dialog overlay inside the game header so users can view and copy-paste the project status and prompt packages directly into your chat.

---

## 3. HOW YOU (CLAUDE AI) SHOULD CONTINUE
Here are recommended avenues to continue evolving the simulator's depth:

1.  **Introduce Custom Obstacle Patterns**:
    *   Create moving drone hazards that fly horizontally across lanes.
    *   Implement crushing piston gates that fall from the structural arches.
2.  **Add Passive Perks / Ability Upgrades**:
    *   Add magnetic rings (draws nearby collectibles towards the player).
    *   Add transient invulnerability shields (absorb one collision block).
3.  **Advanced Audio Synth Integration**:
    *   Synthesize interactive background procedural techno/cyberpunk drone loops that dynamically scale in frequency/tempo as the runner gathers speed!
4.  **Immersive FX Additions**:
    *   Add screen shake upon taking damage.
    *   Add a chromatic aberration or warp speed post-processing filter when running at maximum speed.
