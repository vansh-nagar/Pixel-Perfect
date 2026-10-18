import { aastep, easings, falloff, matrix, msdf, normals, rotateUV } from "./chunks";

export const GLOBAL = /* glsl */ `uniform vec2 resolution;\nuniform vec2 resolutionUI;\nuniform float aspect;\nuniform float time;\nuniform float dtRatio;`;

export const skyVert = /* glsl */ `
${GLOBAL}

varying vec2 vUv;
varying vec3 vPos;

void main() {
    vUv = uv;
    vPos = position;
    vec3 pos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const skyFrag = /* glsl */ `
${GLOBAL}

varying vec2 vUv;
varying vec3 vPos;

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uIntroColor;
uniform float uProgress;

void main() {

    // light to dark gradient
    vec2 screenUv = gl_FragCoord.xy / resolution;
    float grad = (screenUv.x + screenUv.y) * 0.5;
    grad = pow(grad, 2.0);
    vec3 color1 = uColor1;
    vec3 color2 = uColor2;
    vec3 color = mix(color2, color1, grad);

    // intro animation
    color = mix(uIntroColor, color, uProgress);

    gl_FragColor = vec4(color, 1.0);
}
`;

export const smokeVert = /* glsl */ `
${GLOBAL}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vWorldPos;

void main() {
    vUv = uv;
    vPos = position;
    vec3 pos = position;
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const smokeFrag = /* glsl */ `
${GLOBAL}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vWorldPos;
varying vec3 vNormal;

uniform sampler2D tWind;
uniform float uAlpha;

void main() {
    vec2 uv = vUv;
    uv.x *= 2.0;

    // wind
    float t = time * 0.15;

    if (vWorldPos.x > 6.0) {
        t += 0.914;
    }
    float wind = texture2D(tWind, uv + vec2(-t, t * 0.4)).r;
    wind *= texture2D(tWind, uv * 1.25 + vec2(-t, 0.75)).r;
    wind *= texture2D(tWind, uv * 0.5 + vec2(-t, -t * 0.35)).r;
    wind *= 8.0;

    vec3 color = vec3(1.0);

    float alpha = wind;
    alpha *= 1.0 - vUv.y;
    alpha *= smoothstep(0.0, 0.1, vUv.y);
    alpha *= smoothstep(0.0, 0.5, vUv.x);
    alpha *= smoothstep(1.0, 0.8, vUv.x);
    alpha *= uAlpha;

    gl_FragColor = vec4(color, alpha);
}
`;

export const baseVert = /* glsl */ `
${GLOBAL}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vWorldPos;
varying vec3 vMouseGlow;

uniform vec3 uMousePos;
uniform float uProgress;
uniform float uProgress2;
uniform sampler2D tNoise;

void main() {
    vUv = uv;
    vPos = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    vec3 pos = position;

    // approximate light glow based on igloo interaction
    vMouseGlow = (1.0 - clamp(distance(uMousePos, vWorldPos.xyz * vec3(1.0, 0.0, 1.0)), 0.0, 5.0) / 5.0) * vec3(0.5, 0.7, 1.0) * smoothstep(-0.5, 2.0, uMousePos.y);
    vMouseGlow *= 1.0 - clamp(length(vWorldPos.xyz), 0.0, 9.0) / 9.0;
    vMouseGlow *= 2.0;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const baseFrag = /* glsl */ `
${GLOBAL}
${falloff}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vWorldPos;
varying vec3 vMouseGlow;
varying vec3 vNormal;

uniform sampler2D tMap;
uniform sampler2D tWind;
uniform sampler2D tGroundGlow;
uniform sampler2D tTriangles;
uniform sampler2D tNoise;

uniform vec3 uMousePos;
uniform float uProgress;
uniform float uProgress2;
uniform float uTriangleAlpha;
uniform float uAlpha;

void main() {
    float alpha = 1.0;

    vec3 terrainColor = texture2D(tMap, vUv).rgb;

    // ground glow based on mouse position
    vec3 glow = texture2D(tGroundGlow, vUv).rgb;
    float glowStrength = (sin(vPos.x - time * 1.0 + 3.2) * 0.5 + 0.5);
    terrainColor += glow * glowStrength * terrainColor.r;
    terrainColor += vMouseGlow * terrainColor.r;

    // wind
    float t = time;
    float radialGrad = 1.0 - smoothstep(1.0, 0.8, length(vPos) * 0.2);
    float verticalGrad = (1.0 - clamp(vPos.y * 0.3 + 1.1, 0.0, 1.0));
    float wind = texture2D(tWind, vWorldPos.xz * 0.15 + vUv * 0.1 + vec2(-t * 0.15, -t * 0.15)).r;
    wind *= texture2D(tWind, vWorldPos.xz * 0.17 + vUv * 0.1 + vec2(-t * 0.15, -t * 0.15)).r;
    wind *= verticalGrad;
    terrainColor = mix(terrainColor, vec3(1.0), wind * 4.0);

    vec3 color = terrainColor;

    // intro animation
    if (uProgress2 < 1.0) {
        // reduce alpha to zero so we can composite layers onto it
        alpha *= 0.0;

        // create input textures and values
        float noise = texture2D(tNoise, vWorldPos.xz * 0.07).r;
        float triangles = texture2D(tTriangles, vWorldPos.xz * 0.25).r;
        vec3 blue = vec3(0.3, 0.45, 1.0);
        float inputGradient = length(vWorldPos.xz);
        inputGradient += noise * 3.5;

        // terrain layer
        vec3 terrainShockwaveColor = vec3(0.0);
        float terrainShockwaveAlpha = 0.0;
        float terrainFalloff = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 8.0, uProgress2);
        float terrainFalloff2 = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 3.0, uProgress2);
        terrainShockwaveColor += terrainFalloff * triangles * blue * 3.0;
        terrainShockwaveColor += terrainFalloff2 * blue;
        terrainShockwaveAlpha += falloff(inputGradient, -0.1, 31.9, 0.1, uProgress2);

        // triangle layer
        vec3 triangleShockwaveColor = vec3(0.0);
        float triangleShockwaveAlpha = 0.0;
        float triangleFalloff = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 10.0, uProgress);
        triangleShockwaveColor += blue;
        triangleShockwaveAlpha += falloff(inputGradient, 1.0, 33.0, 0.1, uProgress);
        triangleShockwaveAlpha *= triangleFalloff;
        triangleShockwaveAlpha *= triangles;

        // composite layers
        color += terrainShockwaveColor;
        alpha += terrainShockwaveAlpha;

        color += triangleShockwaveColor * (1.0 - terrainShockwaveAlpha);
        alpha += triangleShockwaveAlpha * (1.0 - terrainShockwaveAlpha);
    }

    // fade at edges
    alpha *= 1.0 - smoothstep(0.8, 1.0, length(vPos.xz) * 0.1085);

    // color safety
    alpha = clamp(alpha, 0.0, 1.0);
    color = clamp(color, vec3(0.0), vec3(1.0));

    // global fade
    alpha *= uAlpha;

    gl_FragColor = vec4(color, alpha);
}
`;

export const mountainVert = /* glsl */ `
${GLOBAL}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vWorldPos;
varying vec4 vMvPos;

uniform float uProgress;
uniform float uProgress2;

void main() {
    vUv = uv;
    vPos = position;
    vMvPos = modelViewMatrix * vec4(position, 1.0);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    vec3 pos = position;

    // intro displacement
    float maxDist = 32.0;
    float worldLen01 = clamp(length(vWorldPos.xz), 0.0, maxDist) / maxDist;
    float wave2 = smoothstep(0.0 + uProgress, 0.5 + uProgress, worldLen01);
    wave2 = pow(wave2, 20.0);
    // pos.y += wave2;

    gl_Position = projectionMatrix * vMvPos;
}
`;

export const mountainFrag = /* glsl */ `
${GLOBAL}
${falloff}

varying vec2 vUv;
varying vec3 vPos;
varying vec4 vMvPos;
varying vec3 vWorldPos;

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform sampler2D tMap;
uniform sampler2D tTriangles;
uniform sampler2D tNoise;

uniform float uProgress;
uniform float uProgress2;
uniform float uTriangleAlpha;
uniform float uAlpha;

void main() {
    // fog gradient
    vec2 screenUv = gl_FragCoord.xy / resolution;
    float grad = (screenUv.x + screenUv.y) * 0.5;
    grad = pow(grad, 2.0);
    vec3 color1 = uColor1;
    vec3 color2 = uColor2;
    vec3 fogColor = mix(color2, color1, grad);

    vec3 color = texture2D(tMap, vUv).rgb;
    float alpha = 1.0;

    float distanceFog = clamp(-vMvPos.z * 0.005, 0.0, 1.0);
    float fog = clamp(1.0 - vWorldPos.y * 0.05 - 0.5, 0.0, 1.0);
    fog += distanceFog * 0.75;

    // intro animation
    if (uProgress2 < 1.0) {
        vec3 originalColor = color;

        // create input textures and values
        float noise = texture2D(tNoise, vWorldPos.xz * 0.07).r;
        float triangles = texture2D(tTriangles, vWorldPos.xz * 0.25).r;
        vec3 blue = vec3(0.3, 0.45, 1.0);
        float inputGradient = length(vWorldPos.xz);
        inputGradient += noise * 3.5;

        // mask background mountains from effects, so they're always visible
        float backgroundMountainsMask = smoothstep(32.0, 36.0, inputGradient);
        float invBackgroundMountainsMask = 1.0 - backgroundMountainsMask;

        // reduce alpha to zero so we can composite layers onto it
        alpha = backgroundMountainsMask * uAlpha;

        // terrain layer
        vec3 terrainShockwaveColor = vec3(0.0);
        float terrainShockwaveAlpha = 0.0;
        float terrainFalloff = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 8.0, uProgress2);
        float terrainFalloff2 = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 3.0, uProgress2);
        terrainShockwaveColor += terrainFalloff * triangles * blue * 3.0;
        terrainShockwaveColor += terrainFalloff2 * blue;
        terrainShockwaveAlpha += falloff(inputGradient, -0.1, 31.9, 0.1, uProgress2);

        // triangle layer
        vec3 triangleShockwaveColor = vec3(0.0);
        float triangleShockwaveAlpha = 0.0;
        float triangleFalloff = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 10.0, uProgress);
        triangleShockwaveColor += blue;
        triangleShockwaveAlpha += falloff(inputGradient, 1.0, 33.0, 0.1, uProgress);
        triangleShockwaveAlpha *= triangleFalloff;
        triangleShockwaveAlpha *= triangles;

        // composite layers
        color += terrainShockwaveColor * invBackgroundMountainsMask;
        alpha += terrainShockwaveAlpha * invBackgroundMountainsMask;

        color += triangleShockwaveColor * (1.0 - terrainShockwaveAlpha) * invBackgroundMountainsMask;
        alpha += triangleShockwaveAlpha * (1.0 - terrainShockwaveAlpha) * invBackgroundMountainsMask;

        // prevent snapping color at end of animation
        float endmix = smoothstep(0.8, 1.0, uProgress2);
        color = mix(color, originalColor, endmix);
    }

    // fade at edges
    alpha = clamp(alpha, 0.0, 1.0);
    alpha *= 1.0 - smoothstep(0.7, 0.9, length(vPos.xz) * 0.1085);

    color = clamp(color, vec3(0.0), vec3(1.0));

    // fog
    color = mix(color, fogColor * 1.1 + smoothstep(0.5, 1.0, color.r), fog);

    gl_FragColor = vec4(color, alpha);
}
`;

export const terrainVert = /* glsl */ `
${GLOBAL}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vWorldPos;

uniform float uProgress;
uniform float uProgress2;
uniform sampler2D tNoise;

void main() {
    vUv = uv;
    vPos = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    vec3 pos = position;

    // intro displacement
    // float maxDist = 32.0;
    // float noise = texture2D(tNoise, vWorldPos.xz * 0.07).r;
    // float worldLen01 = clamp(length(vWorldPos.xz), 0.0, maxDist) / maxDist;
    // worldLen01 += noise * 0.1;
    // float wave2 = smoothstep(0.0 + uProgress, 0.5 + uProgress, worldLen01);
    // wave2 = pow(wave2, 35.0);
    // pos.y += wave2 * smoothstep(0.1, 0.15, worldLen01) * 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const terrainFrag = /* glsl */ `
${GLOBAL}
${falloff}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vWorldPos;

uniform sampler2D tMap;
uniform sampler2D tWind;
uniform sampler2D tTriangles;
uniform sampler2D tNoise;

uniform float uProgress;
uniform float uProgress2;
uniform float uTriangleAlpha;
uniform float uAlpha;

float hash12(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

void main() {
    vec3 color = texture2D(tMap, vUv).rgb;
    float alpha = 1.0;

    // wind
    float t = time;
    float wind = texture2D(tWind, vWorldPos.xz * 0.1 + vWorldPos.xy * 0.1 + vec2(-t * 0.25, -t * 0.3)).r;
    float verticalGrad = (1.0 - clamp(vPos.y * 0.5 + 0.75, 0.0, 1.0));
    wind *= texture2D(tWind, vWorldPos.xz * 0.15 + vWorldPos.xy * 0.15 + vec2(-t * 0.18, -t * 0.225)).r;
    wind *= verticalGrad;
    wind *= color.r;
    wind *= 2.0;
    color += wind;

    // intro animation
    if (uProgress2 < 1.0) {
        // reduce alpha to zero so we can composite layers onto it
        alpha *= 0.0;

        // create input textures and values
        float noise = texture2D(tNoise, vWorldPos.xz * 0.07).r;
        float triangles = texture2D(tTriangles, vWorldPos.xz * 0.25).r;
        vec3 blue = vec3(0.3, 0.45, 1.0);
        float inputGradient = length(vWorldPos.xz);
        inputGradient += noise * 3.5;

        // terrain layer
        vec3 terrainShockwaveColor = vec3(0.0);
        float terrainShockwaveAlpha = 0.0;
        float terrainFalloff = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 8.0, uProgress2);
        float terrainFalloff2 = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 3.0, uProgress2);
        terrainShockwaveColor += terrainFalloff * triangles * blue * 3.0;
        terrainShockwaveColor += terrainFalloff2 * blue;
        terrainShockwaveAlpha += falloff(inputGradient, -0.1, 31.9, 0.1, uProgress2);

        // triangle layer
        vec3 triangleShockwaveColor = vec3(0.0);
        float triangleShockwaveAlpha = 0.0;
        float triangleFalloff = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 10.0, uProgress);
        triangleShockwaveColor += blue;
        triangleShockwaveAlpha += falloff(inputGradient, 1.0, 33.0, 0.1, uProgress);
        triangleShockwaveAlpha *= triangleFalloff;
        triangleShockwaveAlpha *= triangles;

        // composite layers
        color += terrainShockwaveColor;
        alpha += terrainShockwaveAlpha;

        color += triangleShockwaveColor * (1.0 - terrainShockwaveAlpha);
        alpha += triangleShockwaveAlpha * (1.0 - terrainShockwaveAlpha);
    }

    // fade at edges
    alpha = clamp(alpha, 0.0, 1.0);
    alpha *= 1.0 - smoothstep(0.85, 1.0, length(vPos.xz) * 0.1085);

    alpha *= uAlpha;

    color = clamp(color, vec3(0.0), vec3(1.0));

    gl_FragColor = vec4(color, alpha);
}
`;

export const patchVert = /* glsl */ `
${GLOBAL}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vWorldPos;

uniform float uProgress;
uniform float uProgress2;
uniform sampler2D tNoise;

void main() {
    vUv = uv;
    vPos = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    vec3 pos = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const patchFrag = /* glsl */ `
${GLOBAL}
${falloff}

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vWorldPos;

uniform sampler2D tMap;
uniform sampler2D tWind;
uniform sampler2D tTriangles;
uniform sampler2D tNoise;

uniform float uProgress;
uniform float uProgress2;
uniform float uTriangleAlpha;
uniform float uAlpha;

float hash12(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

void main() {
    vec3 color = texture2D(tMap, vUv).rgb;
    float alpha = 1.0;

    // wind
    float t = time;
    float wind = texture2D(tWind, vWorldPos.xz * 0.1 + vWorldPos.xy * 0.1 + vec2(-t * 0.25, -t * 0.3)).r;
    float verticalGrad = (1.0 - clamp(vPos.y * 0.5 + 0.75, 0.0, 1.0));
    wind *= texture2D(tWind, vWorldPos.xz * 0.15 + vWorldPos.xy * 0.15 + vec2(-t * 0.18, -t * 0.225)).r;
    wind *= verticalGrad;
    wind *= color.r;
    wind *= 2.0;
    color += wind;

    // intro animation
    if (uProgress2 < 1.0) {
        // reduce alpha to zero so we can composite layers onto it
        alpha *= 0.0;

        // create input textures and values
        float noise = texture2D(tNoise, vWorldPos.xz * 0.07).r;
        float triangles = texture2D(tTriangles, vWorldPos.xz * 0.25).r;
        vec3 blue = vec3(0.3, 0.45, 1.0);
        float inputGradient = length(vWorldPos.xz);
        inputGradient += noise * 3.5;

        // terrain layer
        vec3 terrainShockwaveColor = vec3(0.0);
        float terrainShockwaveAlpha = 0.0;
        float terrainFalloff = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 8.0, uProgress2);
        float terrainFalloff2 = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 3.0, uProgress2);
        terrainShockwaveColor += terrainFalloff * triangles * blue * 3.0;
        terrainShockwaveColor += terrainFalloff2 * blue;
        terrainShockwaveAlpha += falloff(inputGradient, -0.1, 31.9, 0.1, uProgress2);

        // triangle layer
        vec3 triangleShockwaveColor = vec3(0.0);
        float triangleShockwaveAlpha = 0.0;
        float triangleFalloff = 1.0 - falloffsmooth(inputGradient, 0.0, 32.0, 10.0, uProgress);
        triangleShockwaveColor += blue;
        triangleShockwaveAlpha += falloff(inputGradient, 1.0, 33.0, 0.1, uProgress);
        triangleShockwaveAlpha *= triangleFalloff;
        triangleShockwaveAlpha *= triangles;

        // composite layers
        color += terrainShockwaveColor;
        alpha += terrainShockwaveAlpha;

        color += triangleShockwaveColor * (1.0 - terrainShockwaveAlpha);
        alpha += triangleShockwaveAlpha * (1.0 - terrainShockwaveAlpha);
    }

    // fade at edges
    alpha = clamp(alpha, 0.0, 1.0);
    alpha *= 1.0 - smoothstep(0.3, 0.48, length(vPos.xz));

    alpha *= uAlpha;

    color = clamp(color, vec3(0.0), vec3(1.0));

    gl_FragColor = vec4(color, alpha);
}
`;

export const introParticlesVert = /* glsl */ `
${GLOBAL}

attribute vec3 color;

varying vec3 vWorldPos;

uniform sampler2D tNoise;

void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = resolution.y / 100.0;

}
`;

export const introParticlesFrag = /* glsl */ `
${GLOBAL}
${falloff}

varying vec3 vWorldPos;

uniform sampler2D tNumbers;

uniform float uProgress;
uniform float uAlpha;

void main() {
    // scale uvs to match a single character of the spritesheet
    vec2 uv = gl_PointCoord.xy;
    uv.y = 1.0 - uv.y;
    uv.y /= 32.0;
    uv.y += 1.0 / 32.0;

    // animate spritesheet character offset
    float offset = length(vWorldPos);
    float progress = uProgress * 4.0;
    progress = floor(progress * 12.0 - offset) / 32.0;
    progress = clamp(progress, 0.0, 1.0);
    uv.y += progress;

    // sample numbers texture with offset uvs
    float numbers = texture2D(tNumbers, uv).r;
    float alpha = 1.0;

    // intro animation
    float gradientInput = length(vWorldPos);
    float shockwave = falloff(gradientInput, 0.0, 20.0, 5.0, uProgress);
    alpha *= shockwave;

    vec3 color = vec3(numbers);
    alpha *= 0.5;

    gl_FragColor = vec4(color, alpha);
}
`;

export const snowVert = /* glsl */ `
${GLOBAL}

uniform float uCount;

attribute vec4 rand;
attribute vec2 texuv;
uniform sampler2D tTexture1;
uniform sampler2D tTexture2;
uniform vec3 uMousePos;

varying vec2 vUv;
varying vec3 vNormal;
varying vec4 vRandom;
varying vec3 vPos;
varying vec4 vMvPos;
varying float vAlpha;
flat varying float vIndex;

mat2 rotateAngle(float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, s, -s, c);
    return m;
}

const float PI = 3.14159;
const float HALF_PI = PI * 0.5;
const float TWO_PI = PI * 2.0;

void main() {
    float index = float(gl_InstanceID);
    vIndex = index;

    vUv = uv;
    vRandom = rand;

    vec3 pos = position;
    pos *= mix(0.85, 1.15, step(rand.x, 0.5));

    // rotation value from fluid sim
    // float interactionRotation = texture2D(tTexture2, texuv).a * 5.0;

    // curl upwards
    // mat2 rot = rotateAngle(0.25 * sin(uv.y * 3.5 + time + rand.z * 12.0 + rand.y + rand.x + interactionRotation * 3.0) + 0.2 * (1.0 - pow(1.0 - position.z, 2.0)));
    // pos.yz = rot * pos.yz;

    // random rotation angle
    mat2 rot0 = rotateAngle(time * mix(0.75, 1.25, rand.z) + rand.z * 3.14 * 2.0);
    mat2 rot1 = rotateAngle((rand.y + rand.z + rand.x) * 3.14 * 2.0);
    mat2 rot2 = rotateAngle(rand.x * 3.14 * 2.0);
    pos.xy = rot0 * pos.xy;
    pos.zx = rot1 * pos.zx;
    pos.yz = rot2 * pos.yz;

    // vec3 norm = normal;
    // norm.xy = rot0 * norm.xy;
    // norm.zx = rot1 * norm.zx;
    // norm.yz = rot2 * norm.yz;
    // vNormal = normalize(normalMatrix * norm);

    vec3 offset = texture2D(tTexture1, texuv).xyz;

    pos += offset;

    vPos = pos;
    vMvPos = modelViewMatrix * vec4(pos, 1.0);

    vAlpha = sin(time + pos.z * 0.25) * 0.5 + 0.5;

    gl_Position = projectionMatrix * vMvPos;
}
`;

export const snowFrag = /* glsl */ `
${GLOBAL}
${aastep}
${normals}
${falloff}

uniform float uAlpha;

varying vec2 vUv;
varying vec3 vPos;
varying vec4 vMvPos;
varying float vAlpha;

void main() {
    float value = 1.0 - min(10.0, length(vPos)) / 10.0;
    vec3 color = vec3(mix(0.75, 1.0, value));
    float alpha = 1.0;

    // fade near bounds
    vec3 bounds = vec3(25.0, 10.0, 25.0);
    alpha *= 1.0 - min(bounds.x, abs(vPos.x)) / bounds.x;
    alpha *= 1.0 - min(bounds.y, abs(vPos.y)) / bounds.y;
    alpha *= 1.0 - min(bounds.z, abs(vPos.z)) / bounds.z;

    // fade near camera
    alpha *= smoothstep(length(vMvPos), 0.5, 1.0);

    // fade near ground
    alpha *= smoothstep(0.0, 2.0, vPos.y);

    // fade near igloo
    alpha *= smoothstep(0.5, 1.0, min(6.0, length(vPos)) / 6.0);

    // shape
    float circularGrad = 1.0 - length(vUv - 0.5) * 2.0;
    alpha *= circularGrad;

    alpha *= uAlpha;
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
}
`;

export const plexusPointsVert = /* glsl */ `
${GLOBAL}
${easings}

attribute float progress;
uniform float uSize;

flat varying float vProgress;

void main() {
    vProgress = progress;
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    float size = uSize * progress;

    gl_Position = projectionMatrix * viewPos;
    gl_PointSize = size / length(viewPos.xyz) * (resolution.y / 1300.0);
}
`;

export const plexusPointsFrag = /* glsl */ `
${GLOBAL}
${aastep}
${rotateUV}

uniform vec3 uColor;

flat varying float vProgress;

void main() {
    if (vProgress < 0.001) discard;
    vec2 uv = rotateUV(gl_PointCoord.xy, mix(1.3, 0.0, vProgress));
    uv = uv * 2.0 - 1.0;

    const float size = 0.125;
    float shape = 1.0 - aastep(size, abs(uv.x)) * aastep(size, abs(uv.y));

    gl_FragColor = vec4(uColor, shape * 0.5);
}
`;

export const plexusNumbersVert = /* glsl */ `
${GLOBAL}
${matrix}
${easings}

attribute float progress;
attribute ivec2 nums;
attribute int side;
flat varying ivec2 vNums;
flat varying float vProgress;
flat varying int vSide;

uniform float uSize;
varying vec2 vUv;

void main() {
    vUv = uv;
    vSide = side;
    vProgress = progress;
    vNums = nums;

    vec3 left = getViewLeft();
    vec3 up = getViewUp();

    float size = uSize;
    vec4 pos = instanceMatrix * billboardModelMatrix() * vec4(position * size * power1In(progress), 1.0);

    // detect side
    vec4 projPos = projectionMatrix * viewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float screenSide = -sign(projPos.x / projPos.w);

    pos.xyz += left * screenSide * uSize * 1.75;
    pos.xyz += up * 1.0 * uSize;

    gl_Position = projectionMatrix * viewMatrix * pos;
}
`;

export const plexusNumbersFrag = /* glsl */ `
${GLOBAL}
${msdf}

flat varying float vProgress;
flat varying int vSide;
flat varying ivec2 vNums;

uniform sampler2D tNums;
uniform vec3 uColor;
varying vec2 vUv;

void main() {

    float numStep = 1.0 / 10.0;
    float num = float(vSide < 0 ? vNums.x : vNums.y);

    vec2 uv = vec2(numStep * vUv.x + num * numStep, vUv.y);
    float a = msdf(tNums, uv);

    gl_FragColor = vec4(uColor, a);
}
`;

export const iglooVert = /* glsl */ `
${GLOBAL}

/* BATCHING */
attribute float batchId;
uniform sampler2D batchingTexture;
mat4 getBatchingMatrix(const in float i) {
    int size = textureSize(batchingTexture, 0).x;
    int j = int(i) * 4;
    int x = j % size;
    int y = j / size;
    vec4 v1 = texelFetch(batchingTexture, ivec2(x, y), 0);
    vec4 v2 = texelFetch(batchingTexture, ivec2(x + 1, y), 0);
    vec4 v3 = texelFetch(batchingTexture, ivec2(x + 2, y), 0);
    vec4 v4 = texelFetch(batchingTexture, ivec2(x + 3, y), 0);
    return mat4(v1, v2, v3, v4);
}

uniform sampler2D tOptions;
vec4 getOptions(const in float i) {
    int size = textureSize(tOptions, 0).x;
    int x = int(i) % size;
    int y = int(i) / size;
    return texelFetch(tOptions, ivec2(x, y), 0);
}

// attribute vec3 rand;
attribute float emission;

varying vec2 vUv;
varying vec3 vPos;
varying float vDisplacement;
varying float vBounce;
varying float vEmission;

vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, s, -s, c);
    return m * v;
}

void main() {
    vUv = uv;
    vEmission = emission;

    mat4 batchingMatrix = getBatchingMatrix(batchId);
    vec3 pos = (getBatchingMatrix(batchId) * vec4(position, 1.0)).xyz;
    vPos = pos;

    vec4 options = getOptions(batchId);
    vDisplacement = options.r;
    vBounce = options.g;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const iglooFrag = /* glsl */ `
${GLOBAL}
${falloff}

varying vec2 vUv;
varying vec3 vPos;
varying float vDisplacement;
varying float vEmission;
varying float vBounce;

uniform sampler2D tMap;
uniform sampler2D tMapExploded;
uniform sampler2D tTriangles;
uniform sampler2D tNoise;

uniform float uProgress;
uniform float uIntroMaterialize;

void main() {
    vec3 color = texture2D(tMap, vUv).rgb;
    vec3 exploded = texture2D(tMapExploded, vUv).rgb + 0.05;
    vec3 blue = vec3(0.5, 0.7, 1.0);

    // fade between 'together' lightmap and 'exploded' lightmap, based on displacement
    float textureMix = clamp(5.0 * vDisplacement, 0.0, 1.0);
    color = mix(color, exploded, textureMix);

    // intro animation
    if (uIntroMaterialize < 1.0) {
        float introEmissive = 1.0 - falloffsmooth(vPos.y, 3.95, -0.4, 1.5, uIntroMaterialize);
        if (introEmissive > 0.9999) discard;

        float triangles = texture2D(tTriangles, vUv * 5.0).r;
        introEmissive += clamp(introEmissive * triangles * 13.0, 0.0, 1.0);

        color += introEmissive * blue;
    }

    // add emission based on displacement
    color += pow(vEmission, 2.0) * clamp(1.0 * vDisplacement, 0.0, 1.0) * blue;

    // add idle emission;
    vec3 powEmission = pow(vEmission, 8.0) * blue * 0.5;
    color += powEmission * (sin(vPos.x - time * 1.0 + 3.2) * 0.5 + 0.5);

    // make inside of igloo glow, on faces furthest from camera
    color += max(0.0, smoothstep(0.0, 2.0, vPos.x * 0.5 - vPos.z * 0.5)) * powEmission;

    // add fake sss from sunlight (just a sideways gradient, but kept dark near the ground)
    color += (vPos.x * 0.1 + 0.4) * 0.3 * min(vPos.y + 0.5, 1.0) * 0.5;

    // color safety
    color = clamp(color, vec3(0.0), vec3(1.0));

    // add ground bounce
    float verticalGrad = (1.0 - smoothstep(-1.5, 1.0, vPos.y));
    color += (1.0 - smoothstep(-1.5, 1.0, vPos.y)) * vBounce * vec3(0.8, 0.9, 1.0) * 0.25;

    gl_FragColor = vec4(color, 1.0);
}
`;

