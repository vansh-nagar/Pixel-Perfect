# Tugboat — motion brief and blueprint

Source: a screenshot of a stylised boat game (no URL), supplied by Vansh. Discovery
(phases 2–4) was skipped because the reference was given. Forensics ran on the still
image alone, so the timings below are designed, not measured.

## Brief

```yaml
target:
  area: standalone 3D scene (playground → three-js grid)
  interaction: ambient loop + pointer steering
  style: toon, soft pastel, low-poly with plank detail
  content: [tugboat, sea, wake, ripples, smoke, piers, rock islands]

desired_motion:
  energy: medium, calm by default and lively under throttle
  complexity: high (one signature scene)
  characteristics: [buoyant, continuous, hand-drawn FX, no camera cuts]

exclude: [real water simulation, loaded models, post-processing]
```

## What the still shows

| Element | Read from the image | Rebuilt as |
|---|---|---|
| Tug | salmon plank hull, dark rub strip, stern rail, tyre fenders, cabin with white posts, plank roof, grey stack | procedural meshes on a custom two-band toon shader |
| Sea | flat saturated cyan, lighter painted patches, short white streaks, white flecks | one shader on a plane, water-anchored noise |
| Wake | two near-parallel white lines starting at the hull sides | ribbon rebuilt every frame from the stern's path |
| Churn | orange/white sketchy arcs behind the stern | dashed rings that expand and fade |
| Smoke | one translucent milky plume, not stacked puffs | billboarded noise blobs drawn through a stencil |
| Foam | white collars where rocks and posts meet water | ring shader on flat quads |
| Shadow | dark blue patch on the water left of the boat | SDF of hull + cabin in the water shader |
| Depth | heavy pale-cyan haze | linear fog matched to the sky's horizon colour |

## Blueprint

```yaml
world:
  type: open water, steer anywhere
  streaming: 40-unit chunks within 3 cells of the boat, seeded per cell (same props on return)
  precision: boat position in JS doubles; render origin snaps to multiples of 200, and every
    water pattern tiles at 200, so the snap is invisible
  collisions: two circles on the hull vs circles on rocks, islands, buoys and pier posts;
    a hit caps speed at 1.8, shakes the hull and drops splash rings
  speed: 5.5 u/s cruise → 11 full throttle, 1.4 braking (reduced motion: 2)

steering:
  rudder: pointer distance from centre (6% dead zone), or ←/→; autopilot wanders and
    swerves around obstacles when nobody drives
  yaw rate: up to 1.15 rad/s, scaled by speed; damped (λ 4) so turns ease in
  camera: chase yaw damped toward boat yaw (λ 2.4), so turns show the hull's side

intro:
  trigger: mount
  camera: orbit from front-left (θ=-1.9 rad, r=11, h=7.5) to chase (θ=0, r=8.2, h=4.6)
  duration: 2.6s, delay 0.2s, easing quart-out
  reduced_motion: skipped, starts in chase position

boat:
  heave: 0.05·sin(1.7t) + 0.025·sin(2.9t)
  pitch: 0.022·sin(1.25t), +0.055 bow-up at full throttle
  roll:  0.03·sin(1.05t), leans into turns (yaw rate × 0.1)
  throttle: damped 0 → 1 (λ 1.6 up, 1.1 down); FOV 50 → 56, camera pulls back

wake:
  sample: stern position every 0.14 units of travel, 150 samples (~21 units)
  width: half 0.95 + 0.1·distance; lines break into dashes as they age
  churn: noisy foam in the first third, longer under throttle

ripples:
  spawn: every 0.55s (0.26s at full throttle), 12 in the pool
  life: 1.5s; radius 0.45 → 1.25 cubic-out; carried along at 65% of boat speed
  splash: two larger static rings at the contact point on every hit

smoke:
  spawn: every 0.16s (0.07s at full throttle), 36 in the pool
  life: 2.4s; size 0.3 → 1.0; rises, decelerates, keeps 88% of the boat's momentum
  dissolve: noise-eroded edge shrinks with age; alpha fades with world height
```

## Motion language (local to this scene)

- Every loop is a sum of slow sines at unrelated frequencies, so nothing visibly repeats.
- Springs for position (steering), damping for state (throttle, yaw).
- All FX are anchored to the water, not the boat, except smoke (anchored to air).
- Off-screen the render loop stops; reduced motion keeps steering but calms the sea.
