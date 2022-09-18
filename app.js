import * as PIXI from "pixi.js";
import fragmentShader from "./shaders/fragment.glsl";
import noiseShader from "./shaders/noise.glsl";
import t1 from "./assets/1.jpg";
import t2 from "./assets/2.jpg";
import t3 from "./assets/3.jpg";
import t4 from "./assets/4.jpg";
import t5 from "./assets/5.jpg";
import t6 from "./assets/6.jpg";
import t7 from "./assets/7.jpg";
import t8 from "./assets/8.jpg";
import t9 from "./assets/9.jpg";
import fit from "math-fit";
import GUI from "lil-gui";
import GSAP from "gsap";

const gui = new GUI();

const IMAGE_ASPECT = 1.7777;

let currImageIndex = 0;
// this is trash and should be in a class
let base = null;

const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    // backgroundColor: 0x1099bb,
    view: document.querySelector("#scene"),
    resolution: window.devicePixelRatio || 1,
    resizeTo: window,
});

const uniforms = {
    uResolution: new PIXI.Point(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio
    ),
    uTime: app.uTime,
    uThreshold: 0.0,
    // Delete this
    uScale: new PIXI.Point(1, 1),
};

gui.add(uniforms, "uThreshold", 0, 1, 0.01);

// Resizes renderer view in CSS pixels to allow for resolutions other than 1
// app.renderer.autoDensity = true;
// Resize the view to match viewport dimensions
// app.renderer.resize(window.innerWidth, window.innerHeight);
app.uTime = 0;

const resources = PIXI.Loader.shared.resources;
const imagePaths = [t1, t2, t3, t4, t5, t6, t7, t8, t9];
let loadedImages = [];
const loadingTextures = [];

const loadImages = (paths, whenLoaded) => {
    var imgs = [];
    paths.forEach(function (path) {
        var img = new Image();
        img.onload = function () {
            imgs.push(img);
            if (imgs.length == paths.length) whenLoaded(imgs);
        };
        img.src = path;
    });
};

loadImages(imagePaths, (images) => {
    loadedImages = images;
    loadedImages.forEach((img) => {
        let texture = PIXI.Texture.from(img);
        loadingTextures.push(texture);
    });
    base = new PIXI.Sprite(loadingTextures[currImageIndex]);
    base.filters = [invertFilter];

    base.anchor.set(0.5);
    // base.position.set(base.texture.orig.width / 2, base.texture.orig.height / 2);
    base.x = window.innerWidth / 2;
    base.y = window.innerHeight / 2;
    base.width = window.innerWidth;
    base.height = window.innerHeight;

    app.stage.addChild(base);
    app.render(base, texture);
});

// Load resources, then init the app
PIXI.Loader.shared.add(["../shaders/invert.fs"]);

const texture = PIXI.Texture.from(t1);

// const invertShader = resources["../shaders/invert.fs"].data;
// Create a new Filter using the fragment shader
// We don't need a custom vertex shader, so we set it as `undefined`

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

// app.stage.x = window.innerWidth * 0.5;
// app.stage.y = window.innerHeight * 0.5;

app.ticker.add((delta) => {
    app.uTime += delta;
    uniforms.uTime = app.uTime;
    // this will have to reset after each "slide"

    // should be duration in seconds / seconds passed
    uniforms.uThreshold += delta;
    // console.log("uThreshold: ", uniforms.uThreshold);
});

const incrementSlide = () => {
    console.log("incrementing slide, ", currImageIndex);
    // const loadingTextures = [];
    currImageIndex++;
    uniforms.uThreshold = 0;
    base.texture =
        loadingTextures[(currImageIndex + 1) % loadingTextures.length];
    // if (incrementSlide >= loadedImages.length - 1) {
    //     currImageIndex = 0;
    // } else {
    //     currImageIndex++;
    // }

    // base.texture.set(loadedImages[currImageIndex]);
};

GSAP.set(incrementSlide, {
    delay: 7,
    onRepeat: incrementSlide,
    repeat: -1,
    repeatDelay: 7,
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
};

window.addEventListener("resize", resize);

app.start();
