// CONSTANTS
const KEY = {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    ACTION1: 'KeyZ',
    ACTION2: 'KeyX'
}
const ISO_STRETCH = 1.7320508075688773;
const SKEW_STRETCH = 1.1547005383792515;

// PIXI.settings.ROUND_PIXELS = true;

// SETUP
const SCENE = new PIXI.Application({
    width: screen.width,
    height: screen.height,
    backgroundColor: 0x0,
    antialias: true,
    premultipliedAlpha: true,
    powerPreference: 'high-performance',
});
document.body.append(SCENE.view);
ZEPHYR.Mouse.setContainer(SCENE.view);
SCENE.stage.interactiveChildren = false;
SCENE.ticker.add((delta)=>{SCENE.world.tick(delta)});

const UNIT = (SCENE.view.height / 16.875) ^ 0;
// const UNIT = 100;

const ENGINE = {};
(function EngineSetup(e) {
    // Assets
    e.log = out => console.log(`%c[ZEPHYR ENGINE]`, "color:#ef6f6c;font-weight:600", out);
    e.FaceCulling = true;
    e.Assets = new Map();
    e.Assets.fastCache = function (urlList) {
        return new Promise((resolve, reject) => {
            PIXI.Assets.load(urlList).then(() => {
                const tex = new PIXI.Container();
                let hres;
                urlList.forEach(url => {
                    hres = PIXI.Sprite.from(url);
                    tex.addChild(hres);
                    hres.height = hres.width = UNIT;
                    e.Assets.set(url, SCENE.renderer.generateTexture(tex));

                    // Cleanup
                    hres.destroy({ children: true, texture: true, baseTexture: true })
                    PIXI.Assets.unload(url);
                });
                resolve('urlList textures loaded and precomputed')
            });
        });
    };
    e.VXF = {
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
    }
    e.importLevel = function (level) {
        return new Promise((resolve, reject) => {
            if (!level) return reject('NULL is not a level');
            fetch('level/' + level + '.vxf').then(r => r.blob()).then(blob => {
                const reader = new FileReader();

                reader.onload = function () {
                    const BIN = new Uint8Array(reader.result);
                    GAME.env.forEach(block => block.free());
                    GAME.env.clear();
                    e.VXF.handle(BIN);
                    e.renderLevel();
                    resolve('GAME.env has been populated and rendered');
                    GAME.level = level;
                };
                reader.readAsArrayBuffer(blob);
            });
        });
    }
    e.renderLevel = function () {
        GAME.env.forEach(block => {
            block.render()
        });
    }
})(ENGINE);

const GAME = {};
(function GameSetup(g) {
    g.player = { x: 0, y: 0 };
    g.level = "none";
    g.env = new SpatialHash();
})(GAME);

(function SceneWorldSetup(w) {
    w._layers = new Map();
    w._layerFunctions = {
        edit: function () {
            this.requestSort = true;
        },
        sort: function () {
            this.requestSort = false;
            this.children.sort((a, b) => {
                return (a.y) - (b.y);
            });
        }
    }

    w.target = GAME.player;

    w.put = function (entity) {
        let l = w._layers.get(entity.z);
        if (!l) {
            // Create new layer
            l = new PIXI.Container();
            // l.filters = [
            //     new PIXI.filters.OutlineFilter({
            //         thickness: 2,
            //         alpha: 0
            //     })
            // ];
            l.zIndex = entity.z;

            // Add useful functions
            l.edit = w._layerFunctions.edit;
            l.sort = w._layerFunctions.sort;

            // Add it to scene and _layers
            w._layers.set(entity.z, w.addChild(l));

            // Sort layers into proper order for zIndex
            w.children.sort((a, b) => a.zIndex - b.zIndex);
        }
        l.edit();
        [entity.sprite.x, entity.sprite.y] = xyzToScreen(entity.x, entity.y, entity.z);
        l.addChild(entity.sprite);
    }

    w.remove = function (entity) {
        let l = w._layers.get(entity.z);
        if (!l) return;
        l.edit();
        l.removeChild(entity.sprite);
    }

    w.tick = function (delta) {
        // Center target xy in middle of SCENE.view
        w.x = SCENE.view.width * 0.5 - w.target.x;
        w.y = SCENE.view.height * 0.5 - w.target.y;

        // Sort _layers if needed
        w._layers.forEach(l => {
            if (l.requestSort) {
                l.sort();
            }
        })
    }
})(SCENE.stage.addChild(SCENE.world = new PIXI.Container()));

(function SceneUISetup(ui) {

})(SCENE.stage.addChild(SCENE.ui = new PIXI.Container()));