import { GLOBAL, aastep, bitangentNoise, colorUtils, easings, falloff, fit, fpsHelpers, imagefit, linearstep, matrix, msdf, noiseTex, rotations, sinenoise } from "./chunks";

export const roomRingVert = /* glsl */ `
//- edit
${GLOBAL}

varying vec2 vUv;


vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, s, -s, c);
    return m * v;
}

void main() {
    vUv = uv;

    vec3 pos = position;
    pos.xz = rotate(pos.xz, -time * 0.2);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const roomRingFrag = /* glsl */ `
//- edit
${GLOBAL}

varying vec2 vUv;

void main() {

    vec3 color = vec3(2.0);

    // draw ring
    float dist = length(vUv - 0.5);
    float alpha = smoothstep(0.5, 0.3, dist);
    alpha *= smoothstep(0.3, 0.4, dist);
    alpha *= smoothstep(0.03, 0.1, abs(vUv.x - 0.5));
    // alpha *= smoothstep(0.04, 0.09, abs(vUv.y - 0.5));

    // subtle animation
    alpha *= mix(1.0, 0.8, sin(time * 2.0 + dist + vUv.x * 2.0 + vUv.y) * 0.5 + 0.5);

    gl_FragColor = vec4(color, alpha);
}
`;

export const floorVert = /* glsl */ `
//- edit
${GLOBAL}
${rotations}

attribute float animationmask;
attribute float iteration;
attribute float glow;

uniform float uRotationTime;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vPosOriginal;
varying float vGlow;

void main() {
    vUv = uv;
    vGlow = glow;
    vPosOriginal = position;

    vec3 pos = position;

    float t = uRotationTime;


    // pos.y -= animationmask * 0.015;

    // animate individual pieces
    vec3 axis = normalize(vec3(0.0, 0.5, 1.0));
    axis = rotate3D(axis, vec3(0.0, 1.0, 0.0), t * 1.25 + iteration * 1.2);
    float angle = 0.03 * animationmask;
    pos = rotate3D(pos, axis, angle);

    pos.y -= sin(iteration - t) * 0.01 * animationmask;
    pos.y -= animationmask * 0.04;

    // pos.y -= (sin(time + iteration * 0.2) * 0.5 + 0.5) * animationmask * 0.05;
    // pos.y -= animationmask * 0.03;

    vPos = pos;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const floorFrag = /* glsl */ `
//- edit
${GLOBAL}
${falloff}
${sinenoise}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vPosOriginal;
varying float vGlow;

uniform sampler2D tMap;
uniform sampler2D tPerlin;
uniform float uAlpha;
uniform vec3 uColor1;
uniform vec3 uColor2;

void main() {
    float posLen = length(vPos.xz);
    // baked texture
    vec3 color = texture2D(tMap, vUv).rgb;
    color *= mix(0.65, 1.0, vPos.x * 0.5 + 0.5);
    color += (vPos.x + 1.0) * 0.02;

    // background gradient
    vec2 screenUv = gl_FragCoord.xy / resolution;
    float diagonalGradient = (screenUv.x + screenUv.y) * 0.5;
    diagonalGradient *= sinenoise1(vec3(screenUv, time * 0.614)) * 0.5 + 0.5;
    diagonalGradient *= sinenoise1(vec3(screenUv * 2.0, time * 0.17)) * 0.5 + 0.5;
    vec3 bg = mix(uColor1, uColor2, diagonalGradient);

    // add a bit of smokeyness to lower part
    // float perlin = texture2D(tPerlin, vPos.xz * 18.0 + vec2(-time * 0.4, -time * 0.2)).r * 0.08;
    float depth = smoothstep(0.06, -0.2, vPos.y);

    // composite final color from baked texture and background gradient
    float radialGradient = smoothstep(1.4, 1.6, posLen);
    // color = mix(color, bg, clamp(radialGradient, 0.0, 1.0));

    // animate alpha on scroll
    float alpha = falloffsmooth(posLen * 3.0, 0.0, 6.0, 3.0, uAlpha);

    // fade to distance
    alpha *= smoothstep(1.99, 1.3, posLen);
    // float alpha = 1.0;

    // radial alpha
    // alpha *= radialGradient;
    // alpha *= 1.0 - pow(radialGradient, 2.0);

    // fake shadow
    float shadow = min(1.0, length(vPos * 1.5 + vec3(1.15, 0.0, -0.55)));
    shadow = pow(shadow, 2.0);
    shadow += sin(time * 3.3 + vPos.z * 5.0) * 0.1 + 0.1;
    shadow += sin(time * 3.1 + vPos.x * 4.0) * 0.1 + 0.1;
    shadow = mix(0.5, 1.0, shadow);
    color *= mix(vec3(0.5, 0.7, 1.0) * 0.1, vec3(1.0), shadow);

    vec3 blue = vec3(0.5, 0.7, 1.0);
    blue *= 1.0 - radialGradient;
    float glowModulation = smoothstep(0.087, -0.1, vPosOriginal.y);
    float animatedGlow = smoothstep(0.087, 0.05, vPosOriginal.y);
    animatedGlow *= sin(vPos.z * 5.0 + posLen * 10.0 - time * 0.75) * 0.5 + 0.5;
    // glowModulation = pow(glowModulation, 4.0);
    color += blue * glowModulation;
    color += blue * animatedGlow;




    gl_FragColor = vec4(color, alpha);
}
`;

export const forcefieldVert = /* glsl */ `
//- edit
${GLOBAL}
${matrix}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vEye;

void main() {
    vUv = uv;

    vec3 pos = position;
    vPos = (modelMatrix * vec4(position, 1.0)).xyz;

    // for fresnel
    vNormal = normalMatrix * normal;
    vEye = -(modelViewMatrix * vec4(position, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const forcefieldFrag = /* glsl */ `
//- edit
${GLOBAL}
${falloff}
${sinenoise}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vEye;

uniform float uAlpha;
uniform sampler2D tTriangles;

void main() {

    vec2 uv = vUv;

    // correct aspect for cylinder
    uv.x *= 2.0;

    vec3 pos = vPos;
    float t = time * 0.5;

    // animated noise
    float noise = sinenoise1(pos * 4.0 + vec3(0.0, t * 0.45, -t * 0.13)) * 0.5 + 0.5;
    noise *= sinenoise1(pos * 2.0 + vec3(t * 0.3, -t * 0.27, t * 0.2)) * 0.5 + 0.5;
    noise = sin(noise * 15.0 - t * 7.0) * 0.5 + 0.5;
    noise = pow(noise, 4.0);

    // triangle texture, distorted with above noise
    float triangles = texture2D(tTriangles, uv * 6.0 + vec2(noise * 0.05)).r;

    // fade at top, edges, slight fresnel
    float fresnel = 1.0 - max(0.0, dot(normalize(vNormal), normalize(vEye)));
    float softedge = 1.0 - smoothstep(0.65, 0.99, fresnel);
    fresnel = mix(fresnel, 1.0, 0.25);
    float fadetop = 1.0 - smoothstep(0.5, 1.0, vUv.y);

    // composite final alpha
    float alpha = (noise * triangles * 2.0 + noise * 0.03) * fresnel * softedge * fadetop;

    // animate on scroll
    alpha *= uAlpha;

    vec3 color = vec3(1.0);

    gl_FragColor = vec4(color, alpha);
}
`;

export const lightroomVert = /* glsl */ `
//- edit
${GLOBAL}

varying vec2 vUv;
varying vec3 vPos;

void main() {
    vUv = uv;

    vec3 pos = position;
    vPos = pos;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const lightroomFrag = /* glsl */ `
//- edit
${GLOBAL}
${falloff}
${sinenoise}

varying vec2 vUv;
varying vec3 vPos;

uniform sampler2D tDotPattern;
uniform float uAlpha;
uniform vec3 uColor1;
uniform vec3 uColor2;

float hash12(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

void main() {
    // background color gradient
    vec2 screenUv = gl_FragCoord.xy / resolution;
    float ramp = (screenUv.x + screenUv.y) * 0.5;
    ramp *= sinenoise1(vec3(screenUv, time * 0.614)) * 0.5 + 0.5;
    ramp *= sinenoise1(vec3(screenUv * 2.0, time * 0.17)) * 0.5 + 0.5;
    vec3 color = mix(uColor1, uColor2, ramp);
    color *= 1.1;

    // dot pattern
    vec2 dotUv = vUv * vec2(200.0, 100.0);
    float dots = texture2D(tDotPattern, dotUv).r;
    float dotid = hash12(floor(dotUv));
    float dotfade = 1.0 - abs(fract(dotid + time * 0.1) - 0.5) * 2.0;
    color += dots * dotfade * 2.0;

    // animate on scroll
    // float alpha = falloffsmooth(length(vPos.xz), 0.0, 10.1, 2.0, uAlpha);
    // color *= alpha;

    gl_FragColor = vec4(color, 1.0);
}
`;

export const textCylinderVert = /* glsl */ `
//- edit
${GLOBAL}

attribute float rand;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vWorldPos;
varying float vRand;

void main() {
    vUv = uv;

    vec3 pos = position;

    vPos = pos;
    vRand = rand;

    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const textCylinderFrag = /* glsl */ `
//- edit
${GLOBAL}
${falloff}

varying vec2 vUv;
varying vec3 vPos;
varying float vRand;

uniform sampler2D tMap;
uniform float uAlpha;

void main() {

    float alpha = texture2D(tMap, vUv).r;

    // fade by height
    alpha *= clamp(vPos.y * 2.0, 0.0, 1.0);

    // animate fade
    alpha *= sin(time * 2.0 + vRand * 10.0 + (vPos.x * 2.0 + vPos.z * 2.0)) * 0.5 + 0.5;

    // fade in on scroll
    float transition = falloffsmooth(length(vPos.xz), 0.0, 10.0, 3.0, uAlpha);
    alpha *= transition;
    alpha *= 0.7;

    alpha *= uAlpha;

    vec3 color = vec3(1.0);

    gl_FragColor = vec4(color, alpha);
}
`;

export const textCylinderOuterVert = /* glsl */ `
//- edit
${GLOBAL}

attribute float rand;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vWorldPos;
varying float vRand;

void main() {
    vUv = uv;

    vec3 pos = position;

    vPos = pos;
    vRand = rand;

    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const textCylinderOuterFrag = /* glsl */ `
//- edit
${GLOBAL}
${falloff}

varying vec2 vUv;
varying vec3 vPos;
varying float vRand;

uniform sampler2D tMap;
uniform float uAlpha;

void main() {

    float alpha = texture2D(tMap, vUv).r;

    // animate fade
    alpha *= sin(time * 2.0 + vRand * 10.0 + (vPos.x * 2.0 + vPos.z * 2.0 + vPos.y)) * 0.5 + 0.5;
    alpha *= 0.25;

    alpha *= uAlpha;

    vec3 color = vec3(1.0);

    gl_FragColor = vec4(color, alpha);
}
`;

export const arrowsVert = /* glsl */ `
attribute float side;
uniform float uWidth;
uniform float uScale;
uniform float uOpacity1;
uniform float uOpacity2;

varying float vOpacity;

void main() {
    vOpacity = mix(uOpacity1, uOpacity2, side * 0.5 + 0.5);
    vec3 pos = position * uScale + vec3(side, 0.0, 0.0) * uWidth;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const arrowsFrag = /* glsl */ `
uniform vec3 uColor;
varying float vOpacity;
void main() {
    float opacity = vOpacity;
    if (vOpacity < 1.0) {
        opacity = floor(mod(vOpacity * 6.0, 2.0));
    }

    gl_FragColor = vec4(uColor * opacity, 1.0);
}
`;

export const linkTextVert = /* glsl */ `
${matrix}
${falloff}

attribute vec3 textWeights;
uniform float uShow1;
uniform float uShow2;
uniform float uAlpha;

varying vec2 vUv;
varying float vAlpha;

void main() {
    float tr1 = falloff(textWeights.x, 0.0, 1.0, 0.1, clamp(uShow1, 0.0, 1.0));
    float tr2 = falloff(textWeights.x, 0.0, 1.0, 1.0, clamp(uShow2, 0.0, 1.0));

    vUv = uv;
    vUv.x = mod(uv.x + 0.125 * mod(floor((1.0 - tr2) * 5.753), 8.0), 1.0);
    vAlpha = tr1 * uAlpha;

    gl_Position = projectionMatrix * viewMatrix * billboardModelMatrix() * vec4(position, 1.0);
}
`;

export const linkTextFrag = /* glsl */ `
${msdf}
${fit}
${falloff}
${GLOBAL}

uniform sampler2D tMap;
uniform vec3 uColor;
uniform float uFadePosition;
uniform float uFadeMargin;

varying vec2 vUv;
varying float vAlpha;

void main() {
    vec2 uv = vUv;
    float alpha = vAlpha;
    alpha *= msdf(tMap, uv);

    alpha *= smoothstep(resolution.x * 0.5 + uFadePosition + uFadeMargin, resolution.x * 0.5 + uFadePosition, gl_FragCoord.x);
    alpha *= smoothstep(resolution.x * 0.5 - uFadePosition - uFadeMargin, resolution.x * 0.5 - uFadePosition, gl_FragCoord.x);

    gl_FragColor = vec4(uColor, alpha);
}
`;

export const visitBoxVert = /* glsl */ `
${matrix}

varying vec2 vUv;
flat varying vec2 vScale;

void main() {
    vUv = uv;
    vScale = getMatrixScale(modelMatrix).xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const visitBoxFrag = /* glsl */ `
${msdf}
${imagefit}

uniform sampler2D tMap;
uniform sampler2D tBlocks;
uniform vec3 uColor;
uniform float uShow;
uniform float uRand;

varying vec2 vUv;
flat varying vec2 vScale;

vec2 hash21(float p) {
    vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
}

void main() {
    vec2 uv = imagefitUV(vUv, vec2(textureSize(tMap, 0)), vScale, 1.0);
    float a = 1.0;

    if (uShow < 1.0) {
        // squared displacement
        float steps = 3.0;
        vec2 hash = hash21(floor(uShow * steps) / steps + uRand * 3.342);
        vec2 offset = hash * 2.0 - 1.0;
        vec2 scale = vec2(0.1, 0.15);
        vec2 blocksUV = uv * scale + uRand * 12.4242 + offset * uRand * 4.543;
        float blocks1 = texture2D(tBlocks, blocksUV).g * 2.0 - 1.0;
        float displacement = 0.025;
        uv += vec2(blocks1, 0.0) * displacement;

        // make it blink
        a *= sin(uShow * 30.0 + uRand * 12.4242) * 0.15 + 0.85;
        a *= step(0.01, uShow);

    }

    a *= msdf(tMap, uv);
    gl_FragColor = vec4(uColor, a);

    // gl_FragColor = vec4(uColor, 1.0);
}
`;

export const particlesVert = /* glsl */ `
${GLOBAL}

attribute vec4 rand;
attribute vec2 texuv;
uniform sampler2D tTexture1;
uniform sampler2D tTexture2;

uniform float uSize;

varying float vShadow;
varying float vVel;
varying float vY;

void main() {
    vec4 posData = texture2D(tTexture1, texuv);
    vec4 velData = texture2D(tTexture2, texuv);

    vec3 pos = posData.xyz;
    vec4 vPos = modelViewMatrix * vec4(pos, 1.0);
    float size = uSize;

    vShadow = posData.w;
    vVel = velData.w;
    vY = posData.y;

    gl_Position = projectionMatrix * vPos;
    gl_PointSize = size / length(vPos.xyz) * (resolution.y / 1300.0);
}
`;

export const particlesFrag = /* glsl */ `
${GLOBAL}
${aastep}
${fit}
${rotations}
${linearstep}

uniform vec3 uColorLight;
uniform vec3 uColorDark;
uniform vec3 uColorInitial;
uniform vec3 uColorFast;

uniform vec3 uLightPos;

uniform float uVisible;
uniform float uAlpha;
uniform float uInitialGlow;

varying float vShadow;
varying float vVel;
varying float vY;

void main() {
    float alpha = step(length(gl_PointCoord.xy - 0.5), 0.5) * uVisible;
    if (alpha < 0.001) discard;

    // calculate normal
    vec2 uv = 2.0 * gl_PointCoord.xy - 1.0;
    vec3 n = vec3(uv, sqrt(1.0 - clamp(dot(uv, uv), 0.0, 1.0)));
    n.y = 1.0 - n.y;

    // calculate light direction
    float lightShadow = max(0.0, dot(normalize(rotateY(3.1416) * uLightPos), normalize(n)));
    float ramp = lightShadow * vShadow;

    // base color
    vec3 color = mix(uColorDark, uColorLight, ramp);

    // highlight color for velocity
    color = mix(color, uColorFast, pow(fit(vVel, 0.003, 0.005, 0.0, 1.0), 2.0));

    // poor's man motion blur
    alpha *= max(uInitialGlow, pow(fit(vVel, 0.002, 0.007, 1.0, 0.0), 2.0) * 0.5 + 0.5);

    // we do a blending trick here. the initial hidden state requires: alpha 0, uInitialGlow 1 and color white
    // alpha must be animated first and the color used will be
    vec3 fadeInColor = mix(vec3(1.0), uColorInitial, linearstep(0.0, 1.0, uAlpha));
    color = mix(color, fadeInColor, uInitialGlow);

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), alpha * uAlpha);
}
`;

export const particlesSimVert = /* glsl */ `
attribute vec4 rand;
varying vec4 vRand;
void main() {
    vRand = rand;
    gl_Position = vec4(position, 1.0);
}
`;

export const particlesSimFrag = /* glsl */ `
varying vec4 vRand;

#define outPos pc_fragColor
uniform sampler2D tTexture1;

layout(location = 1) out highp vec4 outVel;
uniform sampler2D tTexture2;

uniform sampler2D tOrig;
uniform sampler2D tVel;

uniform mat4 uProjMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

uniform float uCubeSize;
uniform vec3 uLightPos;
uniform float uRotation;
uniform float uAdditionalNoise;
uniform float uShowNoise;
uniform float uInteractForce;

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp sampler3D;
#else
    precision mediump sampler3D;
#endif
uniform sampler3D tVolume;
uniform float uVolumeScale;

${GLOBAL}
${fpsHelpers}
${bitangentNoise}
${rotations}

void main() {
    ivec2 uv = ivec2(gl_FragCoord.xy);
    vec4 currentPos = texelFetch(tTexture1, uv, 0);
    vec4 currentVel = texelFetch(tTexture2, uv, 0);
    float positionLimit = uCubeSize * 0.5;

    // constant rotation
    mat3 rotMatrix = rotateY(uRotation);

    // sample volume
    vec3 samplePos = rotMatrix * (currentPos.xyz / uCubeSize) * uVolumeScale + 0.5;

    vec4 volData = texture(tVolume, samplePos);
    vec3 grad = normalize(volData.rgb * 2.0 - 1.0) * rotMatrix;
    float dist = (volData.a * 2.0 - 1.0) * 2.0;

    // velocity

    // fluid sim interaction
    float pushForce = 0.0005;
    vec4 wPos = uModelMatrix * vec4(currentPos.xyz, 1.0);
    vec4 vPos = uViewMatrix * wPos;
    vec4 posProjected = uProjMatrix * vPos;
    vec2 uvScreen = (posProjected.xy / posProjected.w + 1.0) * 0.5;
    vec3 vel = texture2D(tVel, uvScreen).xyz;
    vec3 up = vec3(uViewMatrix[0][1], uViewMatrix[1][1], uViewMatrix[2][1]);
    vec3 right = vec3(uViewMatrix[0][0], uViewMatrix[1][0], uViewMatrix[2][0]);
    vec3 disp = right * vel.x + up * vel.y;
    currentVel.xyz += disp * pushForce * dtRatio * uInteractForce;
    float invFluidStrength = 1.0 - length(vel) * 0.65 * uInteractForce;

    float additionalNoise = max(uAdditionalNoise, uShowNoise);

    // add curl noise
    float force1 = 0.0002 * (0.7 + 0.3 * vRand.z) + 0.0004 * additionalNoise;
    currentVel.xyz += BitangentNoise4D(vec4((currentPos.xyz) * 7.0, time * (1.0 + 0.7 * vRand.y))) * force1 * dtRatio;

    // towards origanl position
    vec4 origPos = texelFetch(tOrig, uv, 0);
    vec3 toOrig = origPos.xyz - currentPos.xyz;
    currentVel.xyz += (origPos.xyz - currentPos.xyz) * 0.001 * dtRatio * invFluidStrength;

    // towards the surface
    float force2 = 0.0015 * (0.7 + 0.3 * vRand.w);
    float signForce = mix(0.0, -0.3, sign(dist) + 1.0);
    currentVel.xyz += grad * force2 * signForce * dtRatio * invFluidStrength;

    // friction
    currentVel.xyz *= frictionFPS(0.9, dtRatio);

    // position

    // add vel to position
    currentPos.xyz += currentVel.xyz * dtRatio;

    // clamp position to a cube -> switch to cylinder
    currentPos.y = clamp(currentPos.y, -0.34, 0.35);
    currentPos.xz = normalize(currentPos.xz) * clamp(length(currentPos.xz), 0.0, 0.275);

    // https://developer.nvidia.com/gpugems/gpugems/part-iii-materials/chapter-16-real-time-approximations-subsurface-scattering
    vec3 lightPos = normalize(uLightPos);
    float wrap = 0.25;
    float dp = dot(lightPos, grad);
    float wrapDiffuse = max(0.0, (dp + wrap) / (1.0 + wrap));

    // bounce
    dp = -dp;
    wrapDiffuse += max(0.0, dp) * 0.1;

    // particles inside the volume are dark
    // currentPos.a = lerpFPS(currentPos.a, mix(wrapDiffuse * 0.2, wrapDiffuse, smoothstep(-0.05, -0.001, dist)), 0.2, dtRatio);
    float targetShadow = mix(wrapDiffuse * 0.2, wrapDiffuse, smoothstep(-0.05, -0.001, dist));
    currentPos.a = mix(targetShadow, currentPos.a, additionalNoise);

    // save the length of the velocity interpolated for emissiviness
    currentVel.a = lerpFPS(currentVel.a, length(currentVel.xyz), 0.035, dtRatio);

    outVel = currentVel;
    outPos = currentPos;
}
`;

export const ceilingSmokeVert = /* glsl */ `
//- edit
${GLOBAL}

varying float vFalloff;
varying vec2 vUv;
varying vec3 vPos;

void main() {
    vUv = uv;

    vec3 pos = position;
    vPos = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const ceilingSmokeFrag = /* glsl */ `
//- edit
${GLOBAL}
${falloff}

varying float vFalloff;
varying vec2 vUv;
varying vec3 vPos;

uniform sampler2D tWind;

void main() {
    vec2 screenUv = gl_FragCoord.xy / resolution;

    vec2 uv = vUv * vec2(0.5, 1.0);
    uv.x -= uv.y;
    float t = -time * 0.075;

    // layer to create organic smoke
    float wind = texture2D(tWind, uv * 1.0 + vec2(-t, t * 0.7)).r;
    wind *= texture2D(tWind, uv * 2.0 + vec2(-t, t * 0.7)).r;
    wind *= texture2D(tWind, uv * 3.0 + vec2(-t, t * 0.7)).r;

    float value = wind;

    // fade at inner and outer part of mesh
    float fade = 1.0;
    fade *= smoothstep(0.135, 0.25, vUv.x);
    fade *= smoothstep(1.0, 0.3, vUv.x);
    value *= fade;

    float glowMask = smoothstep(0.3, 0.45, vUv.x) * smoothstep(0.8, 0.4, vUv.x);
    // value += glowMask * 0.3;
    // value += pow(glowMask, 2.0) * wind * 0.2;

    // fade by depth
    // value *= vFalloff;

    // convert to linear(ish)
    float alpha = value;
    alpha *= 1.8;
    alpha = pow(alpha, 2.0);
    alpha += pow(screenUv.x, 2.0) * fade * 0.2;

    // inner circle
    float innerCircle = smoothstep(0.0, 0.1, vUv.x) * smoothstep(0.4, 0.1, vUv.x);
    alpha += innerCircle * fade * 0.4 * screenUv.x;
    alpha += innerCircle * wind * screenUv.x;

    vec3 color = vec3(0.9, 0.95, 1.0);

    gl_FragColor = vec4(color, alpha);
}
`;

export const groundSmokeVert = /* glsl */ `
//- edit
${GLOBAL}

varying float vFalloff;
varying vec2 vUv;
varying vec3 vPos;

void main() {
    vUv = uv;

    vec3 pos = position;
    vPos = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const groundSmokeFrag = /* glsl */ `
//- edit
${GLOBAL}
${falloff}

varying float vFalloff;
varying vec2 vUv;
varying vec3 vPos;

uniform sampler2D tWind;
uniform float uAlpha;

void main() {
    vec2 screenUv = gl_FragCoord.xy / resolution;

    vec2 uv = vUv * vec2(0.5, 1.0);
    uv.x -= uv.y;
    float t = time * 0.05 + 0.5;

    // layer to create organic smoke
    float wind = texture2D(tWind, uv * 1.0 + vec2(-t, t * 0.7)).r;
    wind *= texture2D(tWind, uv * 2.0 + vec2(-t, t * 0.7)).r;
    wind *= texture2D(tWind, uv * 3.0 + vec2(-t, t * 0.7)).r;

    float value = wind;

    // fade at inner and outer part of mesh
    float fade = 1.0;
    fade *= smoothstep(0.4, 0.5, vUv.x);
    fade *= smoothstep(1.0, 0.4, vUv.x);
    value *= fade;

    float glowMask = smoothstep(0.3, 0.45, vUv.x) * smoothstep(0.8, 0.4, vUv.x);
    // value += glowMask * 0.3;
    // value += pow(glowMask, 2.0) * wind * 0.2;

    // fade by depth
    // value *= vFalloff;

    // convert to linear(ish)
    float alpha = value;
    alpha *= 3.0;
    alpha = pow(alpha, 3.0);
    alpha += pow(screenUv.x, 2.0) * fade * 0.15;

    // animation
    alpha *= uAlpha;

    vec3 color = vec3(0.9, 0.95, 1.0);

    gl_FragColor = vec4(color, alpha);
}
`;

export const ambientVert = /* glsl */ `
${GLOBAL}

attribute vec3 random;

varying vec2 vUv;
varying float vLightFalloff;

uniform float uRotation;

void main() {
    vUv = uv;
    float t = time * 0.1;
    vec3 pos = position;
    pos.x += sin(t * 0.4 + position.z * 2.5) * 0.75;
    pos.y += sin(t * 0.2 + position.x * 2.5) * 0.75;
    pos.z += sin(t * 0.2 + position.y * 2.5) * 0.75;

    // pos.x = max(0.22, pos.x);
    // pos.z = max(0.22, pos.z);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    // scale larger with screen gradient
    vec2 ndc = gl_Position.xy / gl_Position.w;
    float size = mix(7.0, 12.0, random.x);
    gl_PointSize = size * resolution.y * 0.002;

    // random flicker
    vLightFalloff = sin(time * 1.8 + random.y * 22.43) * 0.4 + 0.6;
    vLightFalloff *= smoothstep(0.2, 0.24, length(pos.xz));
    vLightFalloff *= 1.25;
}
`;

export const ambientFrag = /* glsl */ `
${GLOBAL}

varying vec2 vUv;
varying float vLightFalloff;

uniform float uAlpha;

void main() {
    vec2 uv = gl_PointCoord.xy;
    uv.y = 1.0 - uv.y;

    float circularGrad = 1.0 - clamp(length(uv - 0.5) * 2.0, 0.0, 1.0);
    circularGrad *= pow(uv.x, 2.0);
    circularGrad = pow(circularGrad, 2.0);

    vec3 color = vec3(1.0);
    float alpha = circularGrad * vLightFalloff;
    alpha *= uAlpha;

    gl_FragColor = vec4(color, alpha);
}
`;

export const compositeFrag = /* glsl */ `
${GLOBAL}
${sinenoise}
${noiseTex}
${colorUtils}
${easings}

uniform sampler2D tDiffuse;

uniform sampler2D tBlue;
uniform vec2 uBlueOffset;

uniform sampler2D tScroll;
uniform float uRingProximity;
uniform vec3 uSquareAttr;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec3 scene;

    vec3 noise = getNoise(tBlue, gl_FragCoord.xy, uBlueOffset).rgb;

    if (uRingProximity > 0.0) {

        // main distortion
        uv -= 0.5;
        uv.x *= aspect;
        float angle = atan(uv.y, uv.x);
        float dist = length(uv);

        const float bluramount = 0.3;

        float angle1 = angle + bluramount * (noise.r - 0.5) * uRingProximity;
        vec2 newUv1 = vec2(cos(angle1), sin(angle1)) * dist;
        newUv1.x /= aspect;
        newUv1 += 0.5;

        // squares
        float dispSquares = texture2D(tScroll, newUv1 * 1.5 + uSquareAttr.rg).g * 2.0 - 1.0;
        newUv1 += dispSquares * 0.01 * uSquareAttr.b * uRingProximity;

        // read color
        scene = texture2D(tDiffuse, newUv1).rgb;

        // highlight only when not already white
        if (length(scene) < length(vec3(1.0))) {
            scene = rgb2hsv(scene);
            scene.g += 0.05 * uRingProximity;
            scene.b += 0.075 * uRingProximity;
            scene = hsv2rgb(scene);
        }

    } else {
        scene = texture2D(tDiffuse, uv).rgb;
    }

    vec3 sceneColor = scene;

    // glare
    float diagonalGradient = pow(vUv.x * vUv.y, 2.0);
    sceneColor += diagonalGradient * (sinenoise1(vec3(vUv.x * aspect, vUv.y, time * 0.5)) * 0.4 + 0.4) * vec3(0.8, 0.9, 1.0) * noise.b * 2.0;

    gl_FragColor = vec4(clamp(sceneColor, 0.0, 1.0), 1.0);
}
`;

