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
import darkenShader from "../shaders/darkenShader.glsl";

// Utils imports
import { BlurFilterPass } from "../utils/BlurFilterPass";

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
            view: document.querySelector("#scene"),
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
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
            blur: 0,
        };
        this.textureImages = [t1, t2, t3, t4, t5, t6, t7, t8, t9];
        this.textures = [];
        this.sprite = null;
        this.blackSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.darkenUniforms = {
            uThreshold: 0.0,
        };
        this.blurUniforms = {
            direction: [5, 5],
            flip: this.currImageIndex % 2 !== 0,
            uThreshold: this.darkenUniforms.uThreshold,
        };
        this.ticker = this.pixi.ticker;
        this.duration = opts.duration || 5;
        this.currImageIndex = 0;
        this.paused = false;
        this.audio = new Audio(
            new URL("/assets/rdr2-loading.m4a", import.meta.url)
        );
        this.audioPlaying = false;

        this.init(() => {
            this.attachResize();
            this.settings();
            this.startAudio();
            this.resize();
            this.start();
            this.pixi.start();
        });
    }

    init(cb) {
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

    startAudio() {
        window.addEventListener("click", () => {
            if (this.audioPlaying) {
                this.audioPlaying = false;
                this.audio.pause();
            } else {
                this.audioPlaying = true;
                this.audio.play();
            }
        });
        this.audio.volume = 0.8;
        this.audio.loop = true;
        this.audio.controls = false;
        this.audio.crossOrigin = "anonymous";
    }

    addObjects() {
        this.sprite = new PIXI.Sprite(this.textures[this.currImageIndex]);
        const invertFilter = new PIXI.Filter(
            undefined,
            fragmentShader,
            this.uniforms
        );
        this.sprite.filters = [invertFilter];
        this.sprite.anchor.set(0.5);
        this.sprite.x = window.innerWidth / 2;
        this.sprite.y = window.innerHeight / 2;
        this.sprite.width = window.innerWidth;
        this.sprite.height = window.innerHeight;

        // One horizontal pass, one vertical
        const blurFilter = new BlurFilterPass(true, 8, 8, 1, 5, this.uniforms);
        const blurFilter2 = new BlurFilterPass(
            false,
            8,
            8,
            1,
            5,
            this.uniforms
        );

        this.sprite.filters.push(blurFilter, blurFilter2);

        // Black sprite to fade to black
        const darkenFilter = new PIXI.Filter(
            undefined,
            darkenShader,
            this.darkenUniforms
        );
        this.blackSprite.filters = [darkenFilter];
        this.blackSprite.anchor.set(0.5);
        this.blackSprite.width = window.innerWidth;
        this.blackSprite.height = window.innerHeight;

        this.pixi.stage.addChild(this.sprite);
        this.pixi.stage.addChild(this.blackSprite);
        this.pixi.render(this.blackSprite);
        this.pixi.render(this.sprite);
    }

    attachResize() {
        window.addEventListener("resize", this.resize.bind(this));
    }

    resize() {
        let scale = null;

        const viewportDimensions = {
            w: window.innerWidth,
            h: window.innerHeight,
        };

        this.pixi.renderer.resize(window.innerWidth, window.innerHeight);
        const viewportAspect = window.innerWidth / window.innerHeight;
        if (IMAGE_ASPECT > viewportAspect) {
            scale = window.innerHeight / this.sprite.texture.height;
        } else {
            scale = window.innerWidth / this.sprite.texture.width;
        }

        const cover = fit(TEXTURE_DIMENSIONS, viewportDimensions);
        this.sprite.position.set(
            cover.left + viewportDimensions.w / 2,
            cover.top + viewportDimensions.h / 2
        );
        this.sprite.scale.set(cover.scale, cover.scale);
        this.blackSprite.scale.set(window.innerWidth, window.innerHeight);
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
            this.gui.add(this.uniforms, "blur", 0, 20, 0.1).onChange((val) => {
                this.uniforms.blur = val;
            });
        }
    }

    start() {
        // Maybe make this a timeline?
        // we need to clear and reset on duration GUI change
        GSAP.set(this.incrementSlide.bind(this), {
            onRepeat: this.incrementSlide.bind(this),
            repeat: this.paused ? 0 : -1,
            repeatDelay: this.duration,
        });
        let normalizedProgress = 0;
        this.ticker.add((delta) => {
            normalizedProgress =
                (this.time % (this.duration * 1000)) / (this.duration * 1000);
            this.time += this.ticker.elapsedMS;
            this.uniforms.uTime += delta;
            this.uniforms.uThreshold = normalizedProgress;
            this.darkenUniforms.uThreshold = normalizedProgress;
            if (normalizedProgress > 0.8) {
                this.uniforms.blur = (normalizedProgress - 0.8) * 100;
            }
            if (normalizedProgress < 0.2 && this.uniforms.blur > 0) {
                this.uniforms.blur = (0.2 - normalizedProgress) * 100;
            }
        });
    }

    incrementSlide() {
        this.currImageIndex++;
        this.uniforms.uThreshold = 0;
        this.darkenUniforms.uThreshold = 0;
        this.sprite.texture =
            this.textures[(this.currImageIndex + 1) % this.textures.length];
        this.resize();
    }
}
