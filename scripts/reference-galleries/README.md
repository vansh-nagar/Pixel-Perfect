# Reference galleries

Inspected live references and their public application bundles on 2026-09-11.
The components live in the existing library routes; no separate showcase route.

## Orbit to Fullscreen

Reference: https://brand.squarespace.com/
Public HomeCarousel implementation: `c6L-yBQa.js`.
The reference uses a six-item X/Z ring, a parent tilt up to -45 degrees during
interaction, spring stiffness 80–100 / damping 20 for navigation, and 0.8-second
power2.out expansion. Inactive planes scale to .3 desktop / .25 mobile.

Adaptation: a coordinated ring with a -32-degree tilt and -9-degree roll, the library’s existing six
photo assets, and a native modal dialog for actual full-viewport viewing. Rotation
and perspective are shared across cards. Opening takes 1.65 seconds; image
switching contracts, rotates, and expands. Closing reverses into the same gallery
position and restores focus and page scrolling. Custom `images`, `duration`, and
`autoRotate` props. Reduced motion removes the tween and automatic rotation.

The first implementation's independent sine-wave Y movement and per-card size
pulses were removed after visual review. The modal perspective origin interpolates
from the preview center to the viewport center so the handoff preserves geometry.

## Glass Scroll Navbar

Reference: https://www.gionatannese.com/projects
Public renderer: `3zt4mi0z0e4-j.js`.
The reference renders the gallery into a Three.js target, then applies a postprocess
lens to the top/bottom 8% of the screen. Circular sag is `1-sqrt(1-t*t)`, strength1,
curve1, chromatic .01, with 16 weighted spectral samples. Navigation is layered
after the distortion. Native-looking frosted blur alone does not match this.

Adaptation: top lens over a native scrollable, accessible DOM gallery. A viewport
canvas receives the same image positions and feeds a small WebGL pass with
the recovered sag and spectral sampling. The demo is image-only, using the existing local photo assets: no inner navbar,
headings, captions, poster text, footer, or hero gap. `projects`, `band`, `strength`,
`chromatic`, and `className` configure reuse. No global wheel hijacking,
continuous idle render loop, or scroll-linked React state. Frame updates occur on
scroll, resize and asset loads. DOM + blur fallback remains if WebGL or CORS fails.

## Creative Space Gallery

Reference: https://www.gionatannese.com/
Public renderer: `2g16axkqp2g6-.js`.
Recovered distribution: 18 points on a Fibonacci sphere; radius250 and plane82
reference pixels, 3:4 image crop, perspective FOV60, camera distance12. All planes
counterrotate against the group quaternion to remain camera-facing. This produces
an overlapping image field with depth rather than visibly tilted image cards.

Motion: drag impulse .001 per pixel, friction .94 per 60Hz frame, smoothing .11,
automatic rotation .001 radians per frame around an axis tilted23 degrees. Auto
rotation stops after interaction. The component normalizes damping for frame time,
uses pointer capture for mouse/touch, and supports keyboard arrows, Home reset,
Enter image enlargement, and Escape return. DOM image planes use the equivalent
perspective projection, avoiding a second WebGL renderer in the gallery.

Demo media uses the same six `/image-animations/photo-*.jpg` assets as adjacent
library examples, repeated across the 18 positions. Custom `images` replace it.
Both image demos use transparent surfaces, rounded cards and theme tokens.
The reference branding, imagery and custom Reset view control are omitted.
The reusable interaction omits the branded homepage nav and long site preloader.
No exact pixel parity is claimed for the different-sized embedded library preview.
