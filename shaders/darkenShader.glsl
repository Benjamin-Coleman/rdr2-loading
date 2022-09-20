#ifdef GL_ES
precision mediump float;
#endif

// from js
uniform vec2 uResolution;
uniform float uThreshold;

// from pixi
varying vec2 vTextureCoord;

void main () {

    float alpha = smoothstep(.75, 1., uThreshold);
    alpha += smoothstep(.25, 0., uThreshold);

    gl_FragColor = vec4(0., 0., 0., alpha);
}