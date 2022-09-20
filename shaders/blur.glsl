#pragma glslify: blur = require('glsl-fast-gaussian-blur);

#ifdef GL_ES
precision mediump float;
#endif

// from js
uniform vec2 uResolution;

// from pixi
varying vec2 vTextureCoord;

void main () {
    gl_FragColor = vec4(vec3(vTextureCoord.xyz), 1.);
}