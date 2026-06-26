# **Commander Animation State Machine**  
**MOAI SSOT — Animation Controller & State Transition Specification**  
**Asset governed:** `src/components/idle.glb` & Animation Controller Architecture  
**Target Engine:** BabylonJS AnimationGroup Blending System

---

## **1. Purpose & Structural Architecture**
The **Commander Animation State Machine (ASM)** coordinates locomotion, physical acrobatics, weapon-firing poses, and damage stagger states dynamically in response to player keyboard commands, swipe gestures, and obstacle collision impacts.

This specification serves as the absolute blueprint for managing the transition weights, cross-fade blend speeds, and skeletal bone-masks used by the 3D runtime engine to keep animations liquid-smooth and highly responsive at 60 FPS.

---

## **2. State Machine Diagram (High-Level)**

```
        +-----------------------------------+
        |               IDLE                | <---------+
        +-----------------------------------+           |
          |                                 ^           |
          | Game Start                      | Game Reset|
          v                                 |           |
+-------------------+                 +---------------+ |
|      RUNNING      | --------------> |  DAMAGE_STAG  | |
+-------------------+                 +---------------+ |
  |      |      |                       |               |
  | Jump | Slide| Dash                  | Game Over     |
  v      v      v                       v               |
+------+------+------+                +---------------+ |
| JUMP |SLIDE | DASH | -------------> |  CRASH_DEAD   | |
+------+------+------+                +---------------+ |
  |      |                              ^               |
  | Land | Clear                        | Collision     |
  +------+------------------------------+---------------+
```

---

## **3. State Definitions & Blending Weights**

The ASM manages eight core states. Each state corresponds to one or more active BabylonJS `AnimationGroup` bindings.

| State Name | Loop Behavior | Root Motion | Default Speed Scale | Description |
| :--- | :---: | :---: | :---: | :--- |
| `IDLE` | Loop | None | $1.0$ | Operator breathing cycle while standing on character selection. |
| `RUNNING` | Loop | Z-Forward | Scales with Run Speed ($0.8$ to $1.9$) | Dynamic stride cycles. Speed of playback is locked to the player's runner velocity. |
| `JUMP_START`| Single | Y-Up | $1.2$ | Compression phase leading into physical vertical launch. |
| `JUMP_LOOP` | Loop | Static Y | $1.0$ | Trailing fall loop active while player vertical height is $> 0.2$ meters. |
| `SLIDING` | Loop | Static Low | $1.4$ | Crouch/slide posture. Lowers player collision capsule boundaries. |
| `DASH_L/R` | Single | X-Translation | $1.5$ | Sideways lane-change thrusting animation. |
| `DAMAGE_STAG`| Single | Z-Slow | $1.0$ | Temporary head-bobbing / step-stumble reaction on obstacle strike. |
| `CRASH_DEAD`| Single | Fused | $1.0$ | Collapse cycle onto track floor when energy cells hit $0$. |

---

## **4. Transition Ledger (Cross-Fade Blending)**

To prevent jagged snap-cuts between poses, all states must interpolate their skeletal weights smoothly. The transition speed is specified as a duration in seconds (`BlendMs` translated to BabylonJS weight increments).

| Source State | Destination State | Trigger Event / Condition | Blending Mode | Cross-Fade Duration (`BlendMs`) |
| :--- | :--- | :--- | :--- | :--- |
| `IDLE` | `RUNNING` | `GAME_PLAYING` starts | Linear Weight | $250\text{ ms}$ |
| `RUNNING` | `JUMP_START` | Jump action triggered | Exponential | $80\text{ ms}$ (Instantaneous) |
| `JUMP_START` | `JUMP_LOOP` | Jump clip completes | Linear Weight | $150\text{ ms}$ |
| `JUMP_LOOP` | `RUNNING` | Land contact ($Y = 0$) | Cubic Slerp | $120\text{ ms}$ |
| `RUNNING` | `SLIDING` | Slide action triggered | Linear Weight | $100\text{ ms}$ |
| `SLIDING` | `RUNNING` | Slide timer expires | Linear Weight | $200\text{ ms}$ |
| `RUNNING` | `DAMAGE_STAG`| Core collision sustained | Linear Weight | $50\text{ ms}$ (High urgency) |
| `DAMAGE_STAG`| `RUNNING` | Stagger clip completes | Linear Weight | $250\text{ ms}$ |
| `*` (Any) | `CRASH_DEAD` | Core energy depleted | Linear Weight | $80\text{ ms}$ (Skeletal collapse) |

---

## **5. Skeletal Bone-Masking (Additive Weapon Firing)**

The Commander can fire weapons (*Plasma Rift*, *Scatter Cannon*) while simultaneously running or jumping. To achieve this without duplicate run-and-shoot anim clips, we utilize **Bone-Masking** to split the skeleton:

- **Lower Body Group** (`Pelvis` down to `Foot_L`/`Foot_R`): Handles running, sliding, and jumping locomotion animations.
- **Upper Body Group** (`Spine_01` up to `Head` + `Hand_L`/`Hand_R`): Handles holding, aiming, and firing weapon recoil animations.

### **Skeletal Mask Splitting Rule (BabylonJS implementation)**
```ts
// 1. Establish the dividing joint
const spineJoint = skeleton.bones.find(b => b.name === "Spine_01");

// 2. Set weight mask properties 
runAnimationGroup.setWeightForAllAnimatables(1.0); // Full body default
fireAnimationGroup.setWeightForAllAnimatables(0.0); // Start dormant

// 3. Apply bone masking during live fire
scene.onBeforeRenderObservable.add(() => {
  if (isActivelyFiring) {
    // Upper body is driven entirely by Weapon Fire recoil
    spineJoint.getChildren().forEach(bone => {
      // Direct animatable weights of upper bones to weapon firing timeline
      bone.animations.forEach(anim => {
        // Blend weapon recoil weights to 1.0, and suppress running motion on these specific joints
      });
    });
  }
});
```

---

## **6. Complete TypeScript State Machine Implementation Example**

Here is the production-compliant implementation template for managing state-switching inside the core render loop.

```typescript
export enum AnimState {
  IDLE,
  RUNNING,
  SLIDING,
  JUMPING,
  STAGGER,
  DEAD
}

export class CommanderASM {
  private activeState: AnimState = AnimState.IDLE;
  private animGroups: Map<string, BABYLON.AnimationGroup> = new Map();
  private blendDuration: number = 0.15; // default 150ms

  constructor(groups: BABYLON.AnimationGroup[]) {
    groups.forEach(g => {
      this.animGroups.set(g.name.toLowerCase(), g);
      // Initialize dormant
      g.stop();
      g.weight = 0.0;
    });
    
    // Start idle active
    this.playClip("idle", 1.0, true);
  }

  public transitionTo(newState: AnimState, customBlend?: number) {
    if (this.activeState === newState) return;

    const prevClipName = this.getClipNameForState(this.activeState);
    const nextClipName = this.getClipNameForState(newState);

    const prevClip = this.animGroups.get(prevClipName);
    const nextClip = this.animGroups.get(nextClipName);

    const blendTime = customBlend !== undefined ? customBlend : this.blendDuration;

    if (prevClip && nextClip) {
      // Smoothly crossfade weights
      nextClip.play(newState !== AnimState.JUMPING && newState !== AnimState.STAGGER); // Loop appropriately
      
      // BabylonJS weight interpolation loop
      let progress = 0;
      const scene = prevClip.animatables[0]?.scene;
      
      if (scene) {
        const observer = scene.onBeforeRenderObservable.add(() => {
          progress += scene.getEngine().getDeltaTime() / 1000;
          const ratio = Math.min(1.0, progress / blendTime);

          prevClip.weight = 1.0 - ratio;
          nextClip.weight = ratio;

          if (ratio >= 1.0) {
            prevClip.stop();
            scene.onBeforeRenderObservable.remove(observer);
          }
        });
      }
    }

    this.activeState = newState;
  }

  private playClip(name: string, weight: number, loop: boolean) {
    const clip = this.animGroups.get(name);
    if (clip) {
      clip.weight = weight;
      clip.play(loop);
    }
  }

  private getClipNameForState(state: AnimState): string {
    switch (state) {
      case AnimState.IDLE: return "idle";
      case AnimState.RUNNING: return "walk_fwd";
      case AnimState.SLIDING: return "slide";
      case AnimState.JUMPING: return "jump";
      case AnimState.STAGGER: return "damage";
      case AnimState.DEAD: return "crash";
    }
  }
}
```
