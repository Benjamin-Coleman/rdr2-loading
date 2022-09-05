import * as PIXI from "pixi.js";
import fragmentShader from "./shaders/fragment.glsl";
import noiseShader from "./shaders/noise.glsl";
import textureImage from "./assets/2.jpg";
import fit from "math-fit";

const IMAGE_ASPECT = 1.7777;

const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    // backgroundColor: 0x1099bb,
    view: document.querySelector("#scene"),
    resolution: window.devicePixelRatio || 1,
    resizeTo: window,
});
// Resizes renderer view in CSS pixels to allow for resolutions other than 1
// app.renderer.autoDensity = true;
// Resize the view to match viewport dimensions
// app.renderer.resize(window.innerWidth, window.innerHeight);
app.uTime = 0;

const resources = PIXI.Loader.shared.resources;

// Load resources, then init the app
PIXI.Loader.shared.add(["../shaders/invert.fs"]);

const texture = PIXI.Texture.from(textureImage);

const base = new PIXI.Sprite(texture);

app.render(base, texture);

// const invertShader = resources["../shaders/invert.fs"].data;
// Create a new Filter using the fragment shader
// We don't need a custom vertex shader, so we set it as `undefined`
const uniforms = {
    uResolution: new PIXI.Point(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio
    ),
    uProgress: 0.0,
    uTime: app.uTime,
    uThreshold: 0.0,
    uScale: new PIXI.Point(1, 1),
};
console.log(uniforms.uResolution);

// const noiseFilter = new PIXI.Filter(undefined, noiseShader, uniforms);
// base.filters = [noiseFilter];

// const noiseTexture = PIXI.RenderTexture.create({ width: 800, height: 800 });
// const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
// const noiseFilter = new PIXI.Filter(undefined, noiseShader, uniforms);
// sprite.filters = [noiseFilter];

// need to update this later to match base
// sprite.width = window.innerWidth;
// sprite.height = window.innerHeight;
// sprite.anchor.set(0.5);

// let renderer = PIXI.autoDetectRenderer();
// console.log(renderer);
// renderer.render(sprite, { noiseTexture });
// app.stage.addChild(sprite);

// uniforms.uNoiseShader = noiseFilter;

const invertFilter = new PIXI.Filter(undefined, fragmentShader, uniforms);

// // Assign the filter to the background Sprite
base.filters = [invertFilter];

// app.stage.x = window.innerWidth * 0.5;
// app.stage.y = window.innerHeight * 0.5;
base.anchor.set(0.5);
// base.position.set(base.texture.orig.width / 2, base.texture.orig.height / 2);
base.x = window.innerWidth / 2;
base.y = window.innerHeight / 2;
base.width = window.innerWidth;
base.height = window.innerHeight;

app.stage.addChild(base);

app.ticker.add((delta) => {
    app.uTime += delta;
    uniforms.uTime = app.uTime;
    uniforms.uThreshold += delta;
});

const textureDimensions = {
    w: 2133,
    h: 1200,
};

const resize = () => {
    let scale = 1;
    app.renderer.resize(window.innerWidth, window.innerHeight);
    viewportAspect = window.innerWidth / window.innerHeight;
    // base.width = window.innerWidth;
    // base.height = window.innerHeight;
    if (IMAGE_ASPECT > viewportAspect) {
        uniforms.uScale.set(IMAGE_ASPECT / viewportAspect, 1);
        scale = window.innerHeight / base.texture.height;
    } else {
        uniforms.uScale.set(1, viewportAspect / IMAGE_ASPECT);
        scale = window.innerWidth / base.texture.width;
    }
    // base.scale.set(scale, scale);
    // console.log(base, scale);

    const viewportDimensions = {
        w: window.innerWidth,
        h: window.innerHeight,
    };

    const cover = fit(textureDimensions, viewportDimensions);
    base.position.set(
        cover.left + viewportDimensions.w / 2,
        cover.top + viewportDimensions.h / 2
    );
    base.scale.set(cover.scale, cover.scale);
    console.log(cover, textureDimensions, viewportDimensions, base);
};

window.addEventListener("resize", resize);

app.start();
