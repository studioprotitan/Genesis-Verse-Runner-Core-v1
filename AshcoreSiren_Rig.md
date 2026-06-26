# **AshcoreSiren_Rig.md**  
**MOAI SSOT — Humanoid Rig Specification: AshcoreSiren**  
**Asset governed:** `src/components/siren.glb` (AshcoreSiren Class)  
**Parent Rig Specification:** Conforms to the canonical humanoid template defined in `Commander_Rig.md`.

---

## **1. Purpose & Class Overview**
The **AshcoreSiren** (formerly Abyssusiren) represents the ritual-tech division of the CST-ERT program. This operator uses a levitating chassis driven by quantum electromagnetics rather than contact thrusters. 

Because the AshcoreSiren has no ground impact during running, its rig utilizes a customized hovering posture and features several dangling, deforming energy conduits (floating ribbon ribbons and power cables) that react dynamically to acceleration and steering.

---

## **2. Skeleton Specification (Siren Dynamic Ribbons)**

The core humanoid skeleton is identical to the `Commander_Rig` to ensure perfect weapon-handling and collision boundary mappings, but it adds secondary **ribbon/cable bone chains** for dynamic secondary physics simulation.

### **2.1 Extended Bone Hierarchy & Chain Nodes**
```
Siren_Rig (Root)
└── Pelvis
     ├── Spine_01
     │    ├── Spine_02
     │    │    └── Chest
     │    │         ├── Neck
     │    │         │    └── Head
     │    │         │         ├── Hair_L_01 ── Hair_L_02 ── Hair_L_03 (Dynamics)
     │    │         │         └── Hair_R_01 ── Hair_R_02 ── Hair_R_03 (Dynamics)
     │    │         ├── L_Clavicle
     │    │         │    └── L_UpperArm
     │    │         │         └── L_Forearm
     │    │         │              └── L_Hand
     │    │         └── R_Clavicle
     │    │              └── R_UpperArm
     │    │                   └── R_Forearm
     │    │                        └── R_Hand
     ├── L_Ribbon_01 ── L_Ribbon_02 ── L_Ribbon_03 (Dangling conduit, hips-anchored)
     ├── R_Ribbon_01 ── R_Ribbon_02 ── R_Ribbon_03 (Dangling conduit, hips-anchored)
     ├── L_Thigh
     │    └── L_Calf
     │         └── L_Foot
     └── R_Thigh
          └── R_Calf
               └── R_Foot
```

### **2.2 Dynamic Secondary Chains Constraints**
- **Dynamic Hair Chains (`Hair_L_01` to `Hair_R_03`)**: Anchored to the `Head` bone. Simulates the movement of trailing fiber-optic neural cables.
- **Dynamic Ribbon Chains (`L_Ribbon_01` to `R_Ribbon_03`)**: Anchored to the `Pelvis` bone. Represents active energy-routing conduits.
- **Baking Rule**: Animation keys for these chains must **not** be baked into the FBX/GLB. Instead, their transformations are driven procedurally at runtime inside the BabylonJS loop using a spring-damper or verlet integration algorithm, or simple sine-wave swaying.

---

## **3. Mesh Architecture & Naming Conventions**

The AshcoreSiren model is divided into four distinct meshes to facilitate the setup of heavy neon emission and translucent glowing shrouds.

| Mesh Name | Description | Vertex Limit | Materials Assigned |
| :--- | :--- | :--- | :--- |
| `Siren_Body` | Core torso, mechanical faceplate, and primary containment chassis. | 5,200 | `M_Siren_Plate`, `M_Neon_Conduits` |
| `Siren_Limbs` | Mechanical floating arm bars and legs (fused at feet into a levitation needle). | 4,000 | `M_Siren_Plate`, `M_Anodized_Metal` |
| `Siren_Shrouds` | Floating fabric-like energy collectors. Must be double-sided. | 2,500 | `M_Quantum_Shroud` (Semi-transparent) |
| `Siren_Conduits` | Neural braids and dangling power-lines. | 1,800 | `M_Neon_Conduits` (Intense Emissive) |

### **Shroud Material Spec (`M_Quantum_Shroud`)**:
The energy collector shrouds use a semi-transparent, highly-emissive shader to simulate plasma-woven fabrics.
- **Alpha Mode**: `BABYLON.Engine.ALPHA_COMBINE` (Traditional blend)
- **Emissive Intensity**: 2.5
- **Two-Sided Rendering**: Enabled (`backFaceCulling = false`)
- **Fresnel Parameters**: Configured on the Emissive channel to make the edges glow brighter than the center.

---

## **4. Levitation & Hovering Physics Constraints**

Because the AshcoreSiren does not run, its standard locomotion is a **glide loop** with an embedded vertical oscillation.

### **4.1 Locomotion Vertical Oscillation Formula**
The vertical position offset ($Y_{\text{lev}}$) is computed dynamically inside the loop:
$$Y_{\text{lev}} = Y_{\text{base}} + \sin(\text{frameCycle} \times 0.08) \times 0.12\text{m}$$

- This produces a smooth, continuous hover bobbing effect.
- The default $Y_{\text{base}}$ coordinate is set to $0.4\text{m}$ above the track plane, making the operator appear floating at all times.

### **4.2 Animation Clip Metrics**
| Clip Name | Target FPS | Total Frames | Loop Behavior | Keyframes Driven |
| :--- | :--- | :--- | :--- | :--- |
| `Siren_Hover_Run` | 60 | 60 (1.0s) | Loop | Body posture tilts forward, hands float |
| `Siren_Hover_Slide` | 60 | 30 (0.5s) | Hold End | Body collapses into horizontal needle pose |
| `Siren_Hover_Jump` | 60 | 40 (0.66s) | Single-Shot | Legs retract, body arches backward |
| `Siren_Discharge` | 60 | 20 (0.33s) | Single-Shot | Spine and arms expand; intense emissive spike |

---

## **5. Material & Neon Emissive Setup**

To ensure the AshcoreSiren looks striking under any scene lighting, the `M_Neon_Conduits` material must be configured with a **glowing bloom filter**.

- **Emissive Color**: `RGB(0.12, 0.95, 0.88)` (Bright electric cyan) or `RGB(0.95, 0.12, 0.42)` (Deep magenta/pink)
- **Bloom Threshold**: Set to `0.85` inside the rendering pipeline to ensure only the neon conduits receive the post-processing glow effect, preventing the entire character mesh from washing out.

---

## **6. Compliance Validation Checklist**

- [ ] Auxiliary ribbon and hair chains follow hierarchical index rules exactly.
- [ ] Legs are styled to end in a tapered, fused levitation prong to prevent foot-sliding artifacts during glide loops.
- [ ] No keyframe translations are present on the `Pelvis` other than vertical hover offsets.
- [ ] Standardized bone offsets match the `Commander_Rig` coordinates to prevent weapon grip floating errors.
