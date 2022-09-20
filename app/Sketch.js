// Library imports
import * as PIXI from "pixi.js";
import GUI from "lil-gui";
import fit from "math-fit";
import GSAP from "gsap";

// Texture imports
import t1 from "../assets/1.jpg";
import t2 from "../assets/2.jpg";
import t3 from "../assets/3.jpg";
import t4 from "../assets/4.jpg";
import t5 from "../assets/5.jpg";
import t6 from "../assets/6.jpg";
import t7 from "../assets/7.jpg";
import t8 from "../assets/8.jpg";
import t9 from "../assets/9.jpg";

// Shader imports
import fragmentShader from "../shaders/fragment.glsl";

const IMAGE_ASPECT = 1.7777;
const TEXTURE_DIMENSIONS = {
    w: 2133,
    h: 1200,
};

export default class Sketch {
    constructor(opts) {
        this.pixi = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            // backgroundColor: 0x1099bb,
            view: document.querySelector("#scene"),
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            // resizeTo: window,
        });
        this.debug = opts.debug;
        this.time = 0;
        this.uniforms = {
            uResolution: new PIXI.Point(
                window.innerWidth * window.devicePixelRatio,
                window.innerHeight * window.devicePixelRatio
            ),
            uTime: this.time,
            uThreshold: 0.0,
        };
        this.textureImages = [t1, t2, t3, t4, t5, t6, t7, t8, t9];
        this.textures = [];
        this.sprite = null;
        this.ticker = this.pixi.ticker;
        this.duration = opts.duration || 5;
        this.currImageIndex = 0;
        this.paused = false;

        this.init(() => {
            this.attachResize();
            this.settings();
            this.resize();
            this.start();
            this.pixi.start();
        });
    }

    init(cb) {
        // do we need this?
        let that = this;
        const loader = PIXI.Loader.shared;
        this.textureImages.forEach((url, i) => {
            loader.add(url);
        });

        loader.onLoad.add((loader, resource) => {
            this.textures.push(resource.texture);
        });

        loader.onComplete.add(() => {
            if (!that.sprite) {
                this.addObjects();
            }
            cb();
        });

        loader.load();
    }

    addObjects() {
        this.sprite = new PIXI.Sprite(this.textures[this.currImageIndex]);
        const invertFilter = new PIXI.Filter(
            undefined,
            fragmentShader,
            this.uniforms
        );
        // new PIXI.filters.BlurFilter();
        this.sprite.filters = [invertFilter];
        this.sprite.anchor.set(0.5);
        this.sprite.x = window.innerWidth / 2;
        this.sprite.y = window.innerHeight / 2;
        this.sprite.width = window.innerWidth;
        this.sprite.height = window.innerHeight;

        this.pixi.stage.addChild(this.sprite);
        this.pixi.render(this.sprite);
    }

    attachResize() {
        window.addEventListener("resize", this.resize.bind(this));
    }

    resize() {
        console.log(
            this.pixi.renderer,
            window.innerHeight,
            window.innerWidth,
            window.devicePixelRatio
        );
        let scale = 1;

        const viewportDimensions = {
            w: window.innerWidth,
            h: window.innerHeight,
        };

        this.pixi.renderer.resize(window.innerWidth, window.innerHeight);
        const viewportAspect = window.innerWidth / window.innerHeight;
        if (IMAGE_ASPECT > viewportAspect) {
            // uniforms.uScale.set(IMAGE_ASPECT / viewportAspect, 1);
            scale = window.innerHeight / this.sprite.texture.height;
        } else {
            // uniforms.uScale.set(1, viewportAspect / IMAGE_ASPECT);
            scale = window.innerWidth / this.sprite.texture.width;
        }

        const cover = fit(TEXTURE_DIMENSIONS, viewportDimensions);
        this.sprite.position.set(
            cover.left + viewportDimensions.w / 2,
            cover.top + viewportDimensions.h / 2
        );
        this.sprite.scale.set(cover.scale, cover.scale);
    }

    settings() {
        if (this.debug) {
            this.gui = new GUI();
            this.gui.add(this, "duration", 0, 10, 1).onChange((val) => {
                this.duration = val;
            });
            this.gui.add(this, "paused").onChange((val) => {
                this.paused = val;
            });
        }
    }

    start() {
        // Maybe make this a timeline?
        GSAP.set(this.incrementSlide.bind(this), {
            onRepeat: this.incrementSlide.bind(this),
            repeat: this.paused ? 0 : -1,
            repeatDelay: this.duration,
        });
        this.ticker.add((delta) => {
            this.time += this.ticker.elapsedMS;
            this.uniforms.uTime += delta;
            this.uniforms.uThreshold =
                (this.time % (this.duration * 1000)) / (this.duration * 1000);
        });
    }

    incrementSlide() {
        this.currImageIndex++;
        this.uniforms.uThreshold = 0;
        this.sprite.texture =
            this.textures[(this.currImageIndex + 1) % this.textures.length];
        this.resize();
    }
}
