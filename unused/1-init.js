// CONSTANTS
const ISO_STRETCH = 1.7320508075688773;
const SKEW_STRETCH = 1.1547005383792515;
const UNIT = (screen.height / 16.875) ^ 0;

// GLOBALS
const ENGINE = {};
const SCENE = new PIXI.Application();
const GAME = {};

(ENGINE.setup = () => {
    ENGINE.log = out => console.log(`%c[ZEPHYR ENGINE]`, "color:#ef6f6c;font-weight:600", out);
    ENGINE.FaceCulling = true;
    ENGINE.Assets = new Map();
    ENGINE.Assets.fastCache = function (urlList) {
        return new Promise((resolve) => {
            PIXI.Assets.load(urlList).then(() => {
                const tex = new PIXI.Container();
                let hres;
                urlList.forEach(url => {
                    hres = PIXI.Sprite.from(url);
                    tex.addChild(hres);
                    hres.height = hres.width = UNIT;
                    ENGINE.Assets.set(url, SCENE.renderer.generateTexture(tex));

                    // Cleanup
                    hres.destroy({ children: true, texture: true, baseTexture: true })
                    PIXI.Assets.unload(url);
                });
                resolve('urlList textures loaded and precomputed')
            });
        });
    };
    ENGINE.VXF = {
        version: [
            {
                head: 32, // Bytes
                handle: function (BIN) {
                    ENGINE.log('Handling header for VXF file format version 0');
                }
            }
        ],
        handle: function (BIN) {
            let i = 0;

            // Handle header if magic number VXF?
            if ((BIN[0] << 16) | (BIN[1] << 8) | BIN[2] == 0x565846) {
                ENGINE.VXF.version[BIN[3]].handle(BIN);
                i = ENGINE.VXF.version[BIN[3]].head; // Jump to end of header
            }

            // Crunch raw binary
            while (i + 3 < BIN.length) {
                Environment.create(
                    BIN[i],
                    BIN[i + 1] - 128,
                    BIN[i + 2] - 128,
                    BIN[i + 3]
                );
                i += 4;
            }
        }
    };
    ENGINE.importLevel = function (level) {
        return new Promise((resolve, reject) => {
            if (!level) return reject('NULL is not a level');
            fetch('level/' + level + '.vxf').then(r => r.blob()).then(blob => {
                const reader = new FileReader();

                reader.onload = function () {
                    const BIN = new Uint8Array(reader.result);
                    GAME.env.forEach(block => block.free());
                    GAME.env.clear();
                    ENGINE.VXF.handle(BIN);
                    ENGINE.renderLevel();
                    resolve('GAME.env has been populated and rendered');
                    GAME.level = level;
                };
                reader.readAsArrayBuffer(blob);
            });
        });
    }
    ENGINE.renderLevel = function () {
        GAME.env.forEach(block => {
            block.render()
        });
    }
})();

(SCENE.setup = async () => {
    await SCENE.init({
        width: screen.width,
        height: screen.height,
        backgroundColor: 0x0,
        antialias: true,
        premultipliedAlpha: true,
        powerPreference: 'high-performance',
    });
    document.body.appendChild(SCENE.canvas);
    ZEPHYR.Mouse.setContainer(SCENE.canvas);
    SCENE.stage.interactiveChildren = false;

    SCENE.world = new PIXI.Collection(SCENE.canvas); // 3D Environment
    SCENE.ui = new PIXI.Collection(SCENE.canvas); // 2D Overlay

    SCENE.stage.addChild(SCENE.world);
    SCENE.stage.addChild(SCENE.ui);

    SCENE.ticker.add(() => {
        SCENE.world.tick();
        SCENE.ui.tick();
    });
})();
