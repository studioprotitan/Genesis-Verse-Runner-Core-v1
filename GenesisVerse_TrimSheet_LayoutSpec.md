# **GenesisVerse_TrimSheet.png Layout Spec**  
**MOAI SSOT — Unified Texture Specification: Trim Sheet**  
**Asset governed:** `src/assets/GenesisVerse_TrimSheet.png` (or compiled runtime textures)  
**Target Resolution:** $2048 \times 2048$ pixels (Power of Two)

---

## **1. Purpose & Core Methodology**
The **GenesisVerse Trim Sheet** is the foundational visual asset for texturing the environment, track segments, obstacles, and mechanical props in the *Abyssum Runner* 3D workspace.

By packing multiple tiling borders, metallic panels, carbon fiber weaves, neon conduits, and decals into a single, cohesive, high-density texture sheet, we achieve:
- **Zero Draw-Call overhead** via batching of meshes that share a single material.
- **Perfect aesthetic consistency** across obstacles, track plates, and gate arches.
- **Minimal memory footprint** (ideal for mobile and sandboxed web runtimes).

---

## **2. Layout Grid Map (Pixel & UV Coordinates)**

The texture sheet is organized horizontally into specialized horizontal lanes (Borders/Trims) and quadrant panels.

```
+-----------------------------------------------------------------------+ (0,1)
|                         ZONE A: CARBON FIBER                          |
|                       U: 0.0 - 1.0, V: 0.75 - 1.0                     |
+-----------------------------------------------------------------------+ (0,0.75)
|                       ZONE B: SCIFI METALLIC PLATES                   |
|                       U: 0.0 - 1.0, V: 0.50 - 0.75                    |
+-----------------------------------------------------------------------+ (0,0.50)
|                       ZONE C: NEON LIGHT CONDUITS                     |
|                       U: 0.0 - 1.0, V: 0.25 - 0.50                    |
+-----------------------------------------------------------------------+ (0,0.25)
| ZONE D1: HAZARD STRIPES    | ZONE D2: DECALS & LABELS                 |
| U: 0.0 - 0.50, V: 0.0 - 0.25| U: 0.50 - 1.0, V: 0.0 - 0.25             |
+-----------------------------------------------------------------------+ (0,0)
(0,0)                                                                   (1,0)
```

---

## **3. Detailed Zone Specifications**

### **Zone A: Carbon Fiber Procedural Panel**
- **UV Range**: $U = [0.0, 1.0]$, $V = [0.75, 1.0]$ (Pixel Range: $0$ to $512$ Y-axis)
- **Tiling**: Horizontal tiling enabled.
- **Description**: Micro-weave carbon fiber pattern with deep charcoal-gray values and a subtle anisotropic sheen.
- **Application**: Used for primary track lanes, runner footboards, and backplates of heavy pillars.

### **Zone B: Sci-Fi Metallic Panels & Bevels**
- **UV Range**: $U = [0.0, 1.0]$, $V = [0.50, 0.75]$ (Pixel Range: $512$ to $1024$ Y-axis)
- **Tiling**: Horizontal tiling enabled.
- **Description**: Medium-intensity brushed titanium metal strips with inset grooves, beveled rivets, and mechanical radiator vents.
- **Application**: Structural archways, heavy barriers, drone housings, and spike baseplates.

### **Zone C: Neon Energy Conduits & Circuit Lines**
- **UV Range**: $U = [0.0, 1.0]$, $V = [0.25, 0.50]$ (Pixel Range: $1024$ to $1536$ Y-axis)
- **Tiling**: Horizontal tiling enabled.
- **Description**: Embedded conduits featuring dual emissive channels (CST-Orange and ERT-Cyan) flanked by dark protective rubber shielding.
- **Application**: Outer track border tubes, active laser gates, floating drone optical sensors, and power-up rings.

### **Zone D1: Active Hazard Striping**
- **UV Range**: $U = [0.0, 0.50]$, $V = [0.0, 0.25]$ (Pixel Range: $1536$ to $2048$ Y-axis, Left Half)
- **Tiling**: Both axes enabled.
- **Description**: High-contrast, $45^\circ$-angled hazard bars styled in warning colors: Matte-Black (`#121212`) paired with active CST-Orange (`#F27D26`).
- **Application**: Dangerous obstacles, spikes, sliding barrier edges, and danger margins of the track.

### **Zone D2: Custom Mechanical Decals & Numeric Labels**
- **UV Range**: $U = [0.50, 1.0]$, $V = [0.0, 0.25]$ (Pixel Range: $1536$ to $2048$ Y-axis, Right Half)
- **Tiling**: **None** (Strictly non-tiling single-instance mapping).
- **Description**: Hard-surface technical decals, including:
  - Warning icons (radiation, high-voltage)
  - Number markings: `CST-01`, `CST-02`, `ERT-99`
  - Text anchors: `CAUTION: CORROSIVE SYSTEM`, `MOAI RIG STABILIZER`
- **Application**: Splatted onto pillars, player armor pads, gate pillars, and collectible nodes.

---

## **4. PBR Texture Channel Packing (MR-AO-E Spec)**

To optimize asset transfers over the web, the trim sheet utilizes **Channel Packing**. Instead of separate texture files for metallic, roughness, and ambient occlusion, we combine these grayscale maps into a single **RGBA** image container:

| Channel | Material Property | Description |
| :---: | :--- | :--- |
| **Red (R)** | **Metallic (Metalness)** | Whiter pixels ($1.0$) represent pure metal; black pixels ($0.0$) represent non-metals (carbon fiber). |
| **Green (G)** | **Roughness** | Whiter pixels ($1.0$) represent matte/rough surfaces; black pixels ($0.0$) represent glossy glass/mirrors. |
| **Blue (B)** | **Ambient Occlusion (AO)** | Shadows baked in micro-crevices. $0.0$ is full shadow, $1.0$ is fully unoccluded. |
| **Alpha (A)** | **Emissive Mask / Height** | Defines which areas glow in the dark (Neon conduits, visor, glowing markings). |

---

## **5. UV Mapping Best Practices in Blender / BabylonJS**

1. **Bevel Alignment**: Align your mesh's beveled edges exactly with the border seams of Zone B to bake high-fidelity lighting details without actual high-poly counts.
2. **Horizontal Snapping**: When laying out UVs, snap vertices on the V-axis exactly to the horizontal thresholds ($0.25$, $0.50$, $0.75$, $1.0$) to prevent pixel bleed from adjacent zones.
3. **Texture Addressing Mode**: Set both `uAng` and `vAng` addressing to **Tiling / Repeat** inside BabylonJS:
   ```ts
   const trimMaterial = new BABYLON.PBRMaterial("trimSheetMat", scene);
   trimMaterial.albedoTexture = new BABYLON.Texture("/assets/GenesisVerse_TrimSheet.png", scene);
   trimMaterial.albedoTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
   trimMaterial.albedoTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
   ```
