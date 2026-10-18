export const clearVert = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main () {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const clearFrag = /* glsl */ `
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uTexture;
uniform float value;

varying highp vec2 vUv;

void main () {
    gl_FragColor.rgb = value * texture2D(uTexture, vUv).rgb;
    gl_FragColor.a = 1.0;
}
`;

export const splatVert = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main () {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const splatFrag = /* glsl */ `
precision highp float;
precision highp sampler2D;



uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform vec2 prevPoint;
uniform float radius;
uniform bool isDye;

varying vec2 vUv;

float line(vec2 uv, vec2 point1, vec2 point2) {
    vec2 pa = uv - point1, ba = point2 - point1;
    pa.x *= aspectRatio;
    ba.x *= aspectRatio;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

float cubicIn(float t) {
    return t * t * t;
}

void main () {
    #ifdef SPLAT_DOT
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / (radius / 50.0)) * color; // vec3 splat = exp(-dot(p, p) / radius) * color;
    #else
        vec3 splat = cubicIn(clamp(1.0 - line(vUv, prevPoint.xy, point.xy) / radius, 0.0, 1.0)) * color;
    #endif

    vec3 base = texture2D(uTarget, vUv).xyz;
    vec3 result = base + splat;
    if (isDye) result = clamp(result, vec3(0.0), vec3(1.0));

    gl_FragColor = vec4(result, 1.0);
}
`;

export const curlVert = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform vec2 texelSize;

varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

void main () {
    vL = uv - vec2(texelSize.x, 0.0);
    vR = uv + vec2(texelSize.x, 0.0);
    vT = uv + vec2(0.0, texelSize.y);
    vB = uv - vec2(0.0, texelSize.y);
    gl_Position = vec4(position, 1.0);
}
`;

export const curlFrag = /* glsl */ `
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uVelocity;

varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;

void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`;

export const vorticityVert = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform vec2 texelSize;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

void main () {
    vUv = uv;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(position, 1.0);
}
`;

export const vorticityFrag = /* glsl */ `
precision highp float;
precision highp sampler2D;

uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
}
`;

export const divergenceVert = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform vec2 texelSize;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

void main () {
    vUv = uv;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(position, 1.0);
}
`;

export const divergenceFrag = /* glsl */ `
precision mediump float;
precision mediump sampler2D;


uniform sampler2D uVelocity;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;

void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;

    #ifdef LIMIT_BORDERS
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
    #endif

    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

export const pressureVert = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform vec2 texelSize;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

void main () {
    vUv = uv;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(position, 1.0);
}
`;

export const pressureFrag = /* glsl */ `
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uPressure;
uniform sampler2D uDivergence;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;

void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float C = texture2D(uPressure, vUv).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

export const gradientSubtractVert = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform vec2 texelSize;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

void main () {
    vUv = uv;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(position, 1.0);
}
`;

export const gradientSubtractFrag = /* glsl */ `
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uPressure;
uniform sampler2D uVelocity;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;

void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

export const advectionVert = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main () {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const advectionFrag = /* glsl */ `
precision highp float;
precision highp sampler2D;


uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform vec2 dyeTexelSize;
uniform float dt;
uniform float dissipation;

varying vec2 vUv;

vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main () {
    vec4 result;

    #ifdef MANUAL_FILTERING
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        result = bilerp(uSource, coord, dyeTexelSize);
    #else
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        result = texture2D(uSource, coord);
    #endif

    gl_FragColor.rgb = result.rgb * dissipation;
    gl_FragColor.a = 1.0;
}
`;

