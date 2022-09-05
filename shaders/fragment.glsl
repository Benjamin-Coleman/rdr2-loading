#ifdef GL_ES
precision mediump float;
#endif

// from js
uniform vec2 uResolution;
uniform float uProgress;
uniform float uTime;
uniform sampler2D uNoiseShader;
uniform float uThreshold;
uniform vec2 uScale;

// from pixi
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//  
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main () {

  vec2 newUV = (vTextureCoord - vec2(0.5)/uScale + vec2(0.5));
  newUV = vTextureCoord;

//   float red = 1.0 - texture2D(uSampler, uv).r;
//   float green = 1.0 - texture2D(uSampler, uv).g;
//   float blue = 1.0- texture2D(uSampler, uv).b;
//   float red = 1.0 - texture2D(uSampler, vTextureCoord).r;
//   float green = 1.0 - texture2D(uSampler, vTextureCoord).g;
//   float blue = 1.0 - texture2D(uSampler, vTextureCoord).b;
  float red = mix(1.0 - texture2D(uSampler, newUV).r, texture2D(uSampler, newUV).r, uProgress);
  float green = mix(1.0 - texture2D(uSampler, newUV).g, texture2D(uSampler, newUV).g, uProgress);
  float blue = mix(1.0 - texture2D(uSampler, newUV).b, texture2D(uSampler, newUV).b, uProgress);

//   float size = mix(uProgress, sqrt(uProgress), 0.5);   
//   size = size * 1.12 + 0.0000001; // just so 0.0 and 1.0 are fully (un)frozen and i'm lazy
//   vec2 lens = vec2(size, pow(size, 4.0) / 2.0);
//   float dist = distance(newUV.xy, vec2(0.5, 0.5)); // the center of the froziness
//   float vignette = pow(1.0-smoothstep(lens.x, lens.y, dist), 2.0);

//  need to create a mask using the noise then that's the 3rd param of the mix
//  figure out the edges later

//   r.x = fbm( vUv + 1.0*q + vec2(1.7,9.2)+ 0.1*uTime );


  // could use a shaping function to ease
    float noise = snoise(vec3(newUV.x * 2., newUV.y * 2., .001 * uTime)) - (uThreshold * .005) + 1.5;
    float clampedNoise = clamp(noise, 0., 1.);
    float blendMask = smoothstep(dot(uProgress,uProgress) * dot(uProgress,uProgress), uProgress, noise);
    float maskEase = smoothstep(1., 0., blendMask);
    // gl_FragColor = vec4(vec3(blendMask), 1.0);


  gl_FragColor = mix(texture2D(uSampler, newUV), 1.0 - texture2D(uSampler, newUV), clampedNoise);


  //  gl_FragColor = vec4(vec3(newUV.x), 1.);

  // gl_FragColor = texture2D(uNoiseShader, newUV);
  // gl_FragColor = vec4(vec3(red, green, blue), 1.0);
// gl_FragColor = vec4(vec3(clampedNoise), 1.);
}