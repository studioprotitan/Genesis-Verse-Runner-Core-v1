# **FormulaPilot_Rig.md**  
**MOAI SSOT — Humanoid Rig Specification: Formula Pilot**  
**Asset governed:** `src/components/pilot.glb` (Formula Pilot Class)  
**Parent Rig Specification:** Conforms strictly to the canonical humanoid template defined in `Commander_Rig.md`.

---

## **1. Purpose & Class Overview**
The **Formula Pilot** is the high-velocity specialist of the CST-ERT program. This operator utilizes a slimmer, hyper-lightweight kinetic exoframing suit optimized for low wind resistance, extreme sliding speeds, and aerodynamic maneuvers.

This document serves as the **Single Source of Truth (SSOT)** for the Formula Pilot character model, bone weights, custom rig extensions, and class-specific mechanical constraints.

---

## **2. Skeleton Specification (Pilot Extensions)**

The Formula Pilot skeleton is built upon the identical bone hierarchy of the `Commander_Rig` to support complete animation retargeting, but introduces specific mechanical joints and accessory anchors.

### **2.1 Bone Hierarchy & Naming (Compliance Map)**
```
Pilot_Rig (Root)
└── Pelvis
     ├── Spine_01
     │    ├── Spine_02
     │    │    └── Chest
     │    │         ├── Neck
     │    │         │    └── Head (Helmet Anchor Node)
     │    │         ├── L_Clavicle
     │    │         │    └── L_UpperArm
     │    │         │         └── L_Forearm
     │    │         │              └── L_Hand
     │    │         └── R_Clavicle
     │    │              └── R_UpperArm
     │    │                   └── R_Forearm
     │    │                        └── R_Hand
     │    └── L_Thurster_Pivot (Accessory Bone)
     │    └── R_Thruster_Pivot (Accessory Bone)
     ├── L_Thigh
     │    └── L_Calf
     │         └── L_Foot
     └── R_Thigh
          └── R_Calf
               └── R_Foot
```

### **2.2 Accessory Bone Constraints**
- **`L_Thruster_Pivot` / `R_Thruster_Pivot`**: These auxiliary joints are anchored to `Spine_01` and control the orientation of the back-mounted micro-thrusters during jumps, slides, and dashes.
- **Rotation Bounds**: These bones are allowed non-deforming rotational keys (Y-axis pitching up to $\pm 45^\circ$) only during active thursting animation states.
- **No Mesh Deform**: No vertices of the core body mesh may be weighted to these accessory bones; they are strictly for mechanical orientation of the thruster nozzles.

---

## **3. Mesh Architecture & Naming Conventions**

To support modular gear swaps and dynamic damage/decal projection, the Formula Pilot model must be split into five distinct sub-meshes:

| Mesh Name | Description | Vertex Limit | Materials Assigned |
| :--- | :--- | :--- | :--- |
| `Pilot_Helmet` | Hard-surface aerodynamic helmet. Must include a distinct visor face. | 1,200 | `M_Visor_Iridescent` (Translucent), `M_Pilot_Armor` |
| `Pilot_Torso` | Backplate, chest plate, and shoulder exorail frames. | 4,500 | `M_Pilot_Armor`, `M_Conduit_Emissive` |
| `Pilot_Limbs` | Integrated limb sleeves, elbow guards, and knee slider plates. | 3,800 | `M_Pilot_Armor`, `M_Undersuit_Flex` |
| `Pilot_Thrusters` | Twin back-mounted thruster nacelles with hollow exhaust nozzles. | 1,500 | `M_Pilot_Armor`, `M_Thruster_Nozzle` |

### **Visor Material Spec (`M_Visor_Iridescent`)**:
The visor of the helmet uses a highly-reflective iridescent glass shader in BabylonJS.
- **Refraction Index**: 1.52 (Acrylic)
- **Metallic**: 1.0 (Mirror-like)
- **Roughness**: 0.05
- **Clearcoat**: Intensity: 1.0, Roughness: 0.01

---

## **4. Class-Specific Animation Specifications**

The Formula Pilot uses a more aggressive, lower-to-the-ground running posture compared to the Commander. All clip exports must adhere to these timing metrics:

### **4.1 Clip Metrics**
| Clip Name | Target FPS | Total Frames | Loop Behavior | Keyframes Driven |
| :--- | :--- | :--- | :--- | :--- |
| `Pilot_Run_HighSpeed` | 60 | 48 (0.8s) | Loop | Full Body + Thruster Rotations |
| `Pilot_Slide_Tuck` | 60 | 30 (0.5s) | Hold End | Hips, Legs, Spine (No Clavicles) |
| `Pilot_Dash_Left` | 60 | 18 (0.3s) | Single-Shot | Hips translation, Clavicle flares |
| `Pilot_Dash_Right` | 60 | 18 (0.3s) | Single-Shot | Hips translation, Clavicle flares |
| `Pilot_Thruster_Flare` | 60 | 24 (0.4s) | Single-Shot | Thruster_Pivot bones pitching down |

### **4.2 Joint Constraints During Slide**
During `Pilot_Slide_Tuck`, the `Pelvis` bone must descend to exactly $Y = 0.28\text{m}$ relative to the ground plane to guarantee correct collision capsule alignment with the hazard clearing height (1.1 meters).

---

## **5. Rig Optimization & gltfpack Directives**

The Formula Pilot must be optimized using the official project compilation pipeline to maintain a 60 FPS update rate inside WebGL environments.

### **gltfpack Command Sequence**
```bash
gltfpack -i pilot_raw.glb -o src/components/pilot.glb -cc -kn -mm -mi -v
```
- **`-cc`**: Compresses the meshes using Draco compression (essential for web payload speed).
- **`-kn`**: Preserves node names (critical for bone binding in BabylonJS `Skeleton` matching).
- **`-mm`**: Generates mipmaps for textures to prevent aliasing flicker at long camera distances.
- **`-mi`**: Instantiates meshes where appropriate (saves GPU memory on repeating gear decals).

---

## **6. Compliance Validation Checklist**

- [ ] Core bone naming matches `Pelvis`, `Spine_01`, `Chest`, `Neck`, `Head` exactly.
- [ ] Left-hand coordinate system matching BabylonJS conventions (Z-forward, Y-up).
- [ ] Mesh pivot is set to $0, 0, 0$ at ground contact level (between feet).
- [ ] No scale variables other than $1.0$ exist on any bone or mesh transform node.
- [ ] Visor mesh is detached to allow independent glass/transparency shader assignments.
