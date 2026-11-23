import * as THREE from "three";

/**
 * See-through glass. WebGL can't sample the page underneath, so instead of
 * refracting it this keeps the page visible and draws what glass adds on
 * top: a faint tint, edges that brighten as faces turn away (fresnel) with
 * each colour channel falling off at a different rate (the RGB fringe of a
 * prism), and sharp highlights from two fixed lights.
 */
/**
 * @param size Rough half-extent of the geometry in local units, so the
 *   diagonal sheen spans the whole object (the logo mark is ~0.6).
 */
export function makeGlassMaterial(theme: "light" | "dark", size = 0.6) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uDark: { value: theme === "dark" ? 1 : 0 },
      uSize: { value: size / 0.6 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec2 vLocal;
      uniform float uSize;
      void main() {
        vLocal = position.xy / uSize;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uDark;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec2 vLocal;
      void main() {
        vec3 n = normalize(vNormal);
        if (!gl_FrontFacing) n = -n;
        vec3 v = normalize(vView);
        float f = 1.0 - abs(dot(n, v));

        vec3 rim = vec3(pow(f, 2.0));
        // Prism fringe: a thin rainbow band at mid angles (zero face-on and
        // at full grazing), like light splitting at a glass edge.
        float band = f * (1.0 - f) * 4.0;
        vec3 fringe = band * band * 0.35 * vec3(
          sin(f * 14.0),
          sin(f * 14.0 + 2.094),
          sin(f * 14.0 + 4.188)
        );

        vec3 l1 = normalize(vec3(-0.4, 0.8, 0.6));
        vec3 l2 = normalize(vec3(0.7, -0.3, 0.5));
        float spec = pow(max(dot(reflect(-l1, n), v), 0.0), 60.0)
                   + 0.6 * pow(max(dot(reflect(-l2, n), v), 0.0), 30.0);
        // Facets catch the light differently, so the 3D form reads.
        float facet = 0.5 + 0.5 * dot(n, l1);

        // Fake environment reflection: bright "sky" above, darker below,
        // plus a diagonal streak. It slides across the faces as the logo
        // turns, which is what makes a flat face read as glass.
        vec3 r = reflect(-v, n);
        float sky = smoothstep(-0.3, 0.9, r.y);
        float streak = smoothstep(0.75, 0.95, sin((r.x + r.y) * 5.0) * 0.5 + 0.5);
        // Diagonal sheen across the logo itself, so faces pointing straight
        // at the camera still get a glass gradient instead of a flat fill.
        float sheen = smoothstep(-0.8, 0.8, vLocal.x * 0.6 + vLocal.y);
        float env = clamp(0.35 * sky + 0.3 * streak + 0.55 * sheen, 0.0, 1.0);

        vec3 col;
        float a;
        if (uDark > 0.5) {
          col = vec3(0.85, 0.9, 1.0) * (0.25 + 0.75 * env) * (0.6 + 0.4 * facet)
              + rim * 0.9 + fringe + spec;
          a = 0.14 + 0.22 * env + 0.6 * rim.g + spec;
        } else {
          // On white, glass reads as a cool grey frost, darker where it
          // reflects the "floor" and at the edges.
          col = mix(vec3(0.62, 0.66, 0.72), vec3(0.97, 0.98, 1.0), env * (0.6 + 0.4 * facet));
          col = mix(col, vec3(0.45, 0.48, 0.54), rim.g) + fringe * 0.8 + spec;
          a = 0.28 + 0.2 * (1.0 - env) + 0.45 * rim.g + spec * 0.6;
        }
        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
      }
    `,
  });
}
