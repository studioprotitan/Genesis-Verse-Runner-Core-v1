# **GenesisVerse_TrimSheet_Layout.md**  
**MOAI SSOT — Unified Texture Sheet Layout Specification**  
**Asset governed:** `src/assets/GenesisVerse_TrimSheet.png` (or compiled runtime texture sheets)  
**Target Resolution:** $2048 \times 2048$ pixels (Power of Two)

---

## **1. Purpose & Core Methodology**
The **GenesisVerse Trim Sheet** is the foundational visual asset for texturing character elements, modular operator gear, environment segments, and mechanical props in the *Abyssum Runner* 3D workspace.

By packing multiple tiling borders, armor plates, carbon-fiber backings, active neon conduits, and custom decals into a single, cohesive, high-density texture sheet, we achieve:
- **Zero Draw-Call overhead** via batching of meshes that share a single material.
- **Perfect aesthetic consistency** across all character classes (Commander, Formula Pilot, AshcoreSiren) and their weapon sets.
- **Minimal memory footprint** (ideal for mobile and sandboxed WebGL iframe environments).

---

## **2. Layout Grid Map (Pixel & UV Coordinates)**

The texture sheet is organized into specific horizontal lanes (Trims) and quadrant panels, mapping $X$ coordinate to $U$ and $Y$ coordinate to $V$.

```
(0,2048)                                                                (2048,2048)
+-----------------------------------------------------------------------+ (0,1.0)
|                 ZONE A: PRIMARY & SECONDARY ARMOR PLATING             |
|                       U: 0.0 - 1.0, V: 0.75 - 1.0                     |
+-----------------------------------------------------------------------+ (0,0.75)
|                 ZONE B: CHARACTER GEAR & MECHANICAL COMPONENTS        |
|                       U: 0.0 - 1.0, V: 0.50 - 0.75                    |
+-----------------------------------------------------------------------+ (0,0.50)
|                 ZONE C: EMISSIVE NEON LIGHT CONDUITS                  |
|                       U: 0.0 - 1.0, V: 0.25 - 0.50                    |
+-----------------------------------------------------------------------+ (0,0.25)
| ZONE D1: CARBON FIBER INTERIORS  | ZONE D2: DECALS & BRANDING LABELS |
| U: 0.0 - 0.50, V: 0.0 - 0.25     | U: 0.50 - 1.0, V: 0.0 - 0.25       |
+-----------------------------------------------------------------------+ (0,0)
(0,0)                                                                   (2048,0)
```

---

## **3. Zone Specifications**

### **Zone A: Primary & Secondary Armor Plating**
- **UV Range**: $U = [0.0, 1.0]$, $V = [0.75, 1.0]$ (Pixel Range: $1536$ to $2048$ Y-axis)
- **Tiling**: Horizontal tiling enabled.
- **Description**: Features high-contrast beveled panels in off-white composite ceramics, anodized grey steels, and dark titanium plating. Includes pre-baked edge wear and micro-scratches.
- **Application**: 
  - Operator chestplates, shoulder spaulders, and knee/shin guards.
  - Base plating for heavy shields and weapon chassis housings.

### **Zone B: Character Gear & Mechanical Components**
- **UV Range**: $U = [0.0, 1.0]$, $V = [0.50, 0.75]$ (Pixel Range: $1024$ to $1536$ Y-axis)
- **Tiling**: Horizontal tiling enabled.
- **Description**: Details modular hard-surface components, heat sinks, ventilation grills, strap anchors, rivets, and weapon accessory rails.
- **Application**:
  - Backpack thruster nozzles, joint casings (elbow and knee joints), belt utility pouches.
  - Internal barrels, sights, and magazines for the *Plasma Rift* and *Scatter Cannon*.

### **Zone C: Emissive Neon Light Conduits**
- **UV Range**: $U = [0.0, 1.0]$, $V = [0.25, 0.50]$ (Pixel Range: $512$ to $1024$ Y-axis)
- **Tiling**: Horizontal tiling enabled.
- **Description**: Concentrated active glow channels flanking dark protective rubber insulation. Features dual emissive sub-lanes:
  - **CST-Orange Channel** (`#F27D26`): High-intensity hot plasma lines for active acceleration zones, booster indicators, and core warnings.
  - **ERT-Cyan Channel** (`#12E2F8`): Steady, cool quantum-energy conduits for status indicators, shield containment lines, and visor optics.
- **Application**:
  - Visor optical strips, armor plate trim glows, dynamic floating neural braids on the *AshcoreSiren*.
  - Projectile trails and energy cores on weapons.

### **Zone D1: Carbon Fiber & Fiber-Optic Weaves**
- **UV Range**: $U = [0.0, 0.50]$, $V = [0.0, 0.25]$ (Pixel Range: $0$ to $512$ Y-axis, Left Half)
- **Tiling**: Both axes enabled.
- **Description**: High-density twill weave composite. Employs fine, dark anisotropic specular reflections.
- **Application**:
  - Inner linings of armor suits, light exoskeleton struts, and weapon handguards/grips.

### **Zone D2: Custom Decals & Branding Labels**
- **UV Range**: $U = [0.50, 1.0]$, $V = [0.0, 0.25]$ (Pixel Range: $0$ to $512$ Y-axis, Right Half)
- **Tiling**: **None** (Strictly single-instance mapping).
- **Description**: Hard-surface decals, caution warnings, and division insignias, including:
  - Caution stripes (CST warning bands).
  - Operator markings (`CST-01`, `ERT-X9`, `MOAI`).
  - Circular connection ring interfaces for modular upgrades.
- **Application**:
  - Applied as localized decals onto flat armor plates, helmet domes, and weapon side-receivers.

---

## **4. PBR Texture Channel Packing (MR-AO-E Spec)**

To optimize asset transfers over the web and reduce GPU memory overhead, the trim sheet utilizes **Channel Packing**. Instead of separate texture files for metallic, roughness, ambient occlusion, and emissive properties, we combine these grayscale maps into a single **RGBA** image container:

| Channel | Material Property | Description |
| :---: | :--- | :--- |
| **Red (R)** | **Metallic (Metalness)** | Whiter pixels ($1.0$) represent pure metal surfaces (e.g., Zone B screws and grills); black pixels ($0.0$) represent non-metals (e.g., Zone D1 Carbon Fiber). |
| **Green (G)** | **Roughness** | Whiter pixels ($1.0$) represent matte/rough surfaces (e.g., rubber gaskets); black pixels ($0.0$) represent glossy surfaces (e.g., polished armor plates). |
| **Blue (B)** | **Ambient Occlusion (AO)** | Pre-baked contact shadows in cracks and bevel crevices. $0.0$ is full occlusion (shadow), $1.0$ is fully unoccluded. |
| **Alpha (A)** | **Emissive Mask / Glow** | Pure white pixels ($1.0$) isolate areas that glow in the dark (e.g., Zone C Neon Conduits and visor optics). Allows intense post-processing bloom. |

---

## **5. UV Mapping Best Practices & Integration**

1. **Pixel Snapping**: When laying out UV coordinates, snap boundary vertices exactly to the horizontal dividing thresholds ($0.25$, $0.50$, $0.75$, $1.0$) to avoid pixel bleed from adjacent zones.
2. **Emissive Channel Handling**: Ensure the emissive texture channel is multiplied by a user-controlled intensity factor (e.g., $1.5$ to $3.0$) in the shader to achieve active bloom in dark areas.
3. **BabylonJS Material Mapping**:
   ```typescript
   const trimMaterial = new BABYLON.PBRMaterial("genesisTrimMat", scene);
   
   // Base Albedo Texture
   trimMaterial.albedoTexture = new BABYLON.Texture("/assets/GenesisVerse_TrimSheet.png", scene);
   
   // Metallic, Roughness, and Ambient Occlusion Packed Texture (R=Metallic, G=Roughness, B=AO)
   const ormTexture = new BABYLON.Texture("/assets/GenesisVerse_TrimSheet_ORM.png", scene);
   trimMaterial.metallicTexture = ormTexture;
   trimMaterial.useRoughnessFromMetallicTextureAlpha = false;
   trimMaterial.useRoughnessFromMetallicTextureGreen = true;
   trimMaterial.useMetallnessFromMetallicTextureBlue = false; // standard channel mapping
   
   // Emissive Map setup using the Packed Mask or Alpha channel
   trimMaterial.emissiveTexture = trimMaterial.albedoTexture; // Or separate emissive map
   trimMaterial.emissiveColor = new BABYLON.Color3(1.0, 1.0, 1.0);
   ```
