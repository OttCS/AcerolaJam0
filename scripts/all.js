// CONSTANTS
const ISO_STRETCH = 1.7320508075688773;
const SKEW_STRETCH = 1.1547005383792515;
const UNIT = (screen.height / 16.875) ^ 0;

// FUNCTIONS
function xyzToScreen(x, y, z) {
    return [
        (x - y) * UNIT / SKEW_STRETCH,
        -((x + y) / 2 + z) * UNIT
    ];
}

// GLOBALS
const ENGINE = {
    loaded: {
        editing: true,
        scene: false,
        textures: false,
        level: true,
        check() {
            if (ENGINE.loaded.scene && ENGINE.loaded.textures && ENGINE.loaded.level) {
                console.log("Everything is ready!");
                TEST_INITIALIZATION();
            }
        }
    },
    culling: false,
    backCulling: false,
    assets: new Map(),
    preloadTextures: function (urlList) {

        ENGINE.loaded.textures = false;

        // https://pixijs.download/v8.0.0-rc.10/docs/assets.Assets.html#load
        PIXI.Assets.load(urlList).then((multiTex) => {
            for (const url in multiTex) {
                const scaledSprite = new PIXI.Sprite(multiTex[url]); // Make a sprite
                scaledSprite.height = scaledSprite.width = UNIT; // Make it smaller
                ENGINE.assets.set(url, SCENE.renderer.generateTexture(scaledSprite));
                PIXI.Assets.unload(url);
            }

            ENGINE.loaded.textures = true;
            ENGINE.loaded.check();
        });
    },
};

// Preload all of the textures that will be needed
ENGINE.preloadTextures([
    'assets/blank.png',
    'assets/blank_dir.png',
    'assets/ao.png',
]);

const SCENE = new PIXI.Application();
SCENE.world = new PIXI.Collection(); // 3D Environment
SCENE.ui = new PIXI.Collection(); // 2D Overlay


// SCENE INITIALIZATION
(async () => {
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

    SCENE.world.offset.x = SCENE.canvas.width * 0.5;
    SCENE.world.offset.y = SCENE.canvas.height * 0.5;
    SCENE.ui.offset.x = SCENE.canvas.width * 0.5;
    SCENE.ui.offset.y = SCENE.canvas.height * 0.5;

    SCENE.stage.addChild(SCENE.world);
    SCENE.stage.addChild(SCENE.ui);

    SCENE.ticker.add(() => {
        SCENE.world.tick();
        SCENE.ui.tick();
    });

    ENGINE.loaded.scene = true;
    ENGINE.loaded.check();
})();

// const GAME = {};

// Flags

// RenderType
const VOXEL = 0;
const BILLBOARD = 1;

// LevelGroup
const ENVIRONMENT = 0;
const DYNAMIC = 1;

extractFlag = (combined, flag) => (combined % (flag * 2) - flag + 1) > 0;

// ENTITY (and Scene shortcuts for adding them)
class Entity {
    constructor(id, x = 0, y = 0, z = 0) {
        this.sprite = new PIXI.Container();
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static ID = [
        {
            id: 0,
            renderType: VOXEL,
            levelGroup: ENVIRONMENT,
            default: "assets/blank_dir.png"
        },
    ]
}

SCENE.world.Entity = class extends Entity {
    constructor(id, x, y, z) {
        super(id, x, y, z);
        this._z = z;
        SCENE.world.put(this);
        this.updatePosition();
    }
    updatePosition() {
        // If the z position has changed, swap the layer it's on
        if (this.z != this._z) {
            let newZ = this.z;
            this.z = this._z;
            SCENE.world.remove(this)
            this.z = newZ;
            SCENE.world.put(this)
        }
        [this.sprite.x, this.sprite.y] = xyzToScreen(this.x, this.y, this.z);
        SCENE.world.layers[this.z].edit();
        this._z = this.z; // Previous Z
    }
}

SCENE.ui.Entity = class extends Entity {
    constructor(id, x, y, z) {
        super(id, x, y, z);
        SCENE.ui.put(this);
        this.updatePosition();
    }
    updatePosition() {
        // If the z position has changed, swap the layer it's on
        if (this.z != this._z) {
            let newZ = this.z;
            this.z = this._z;
            SCENE.ui.remove(this)
            this.z = newZ;
            SCENE.ui.put(this)
        }
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        SCENE.ui.layers[this.z].edit();
        this._z = this.z; // Previous Z
    }
}

// Produces skewed Sprites to fit an isometric voxel's faces
const FACE = {
    Up: class extends PIXI.Sprite {
        constructor(url) {
            super(ENGINE.assets.get(url));
            this.skew.x = 4 * Math.PI / 3;
            this.skew.y = -Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0x0000ff;
        }
    },
    Left: class extends PIXI.Sprite {
        constructor(url) {
            super(ENGINE.assets.get(url));
            this.skew.y = 7 * Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0xff0000;
        }
    },
    Right: class extends PIXI.Sprite {
        constructor(url) {
            super(ENGINE.assets.get(url));
            this.skew.y = -Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0x00ff00;
        }
    },
    Down: class extends PIXI.Sprite {
        constructor(texture) {
            super(texture);
            this.skew.x = -Math.PI / 3;
            this.skew.y = Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0xffff00;
        }
    },
    BLeft: class extends PIXI.Sprite { // Back Left
        constructor(texture) {
            super(texture);
            this.skew.x = Math.PI;
            this.skew.y = 5 * Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0x00ffff;
        }
    },
    BRight: class extends PIXI.Sprite { // Back Right
        constructor(texture) {
            super(texture);
            this.skew.x = Math.PI;
            this.skew.y = Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0xff00ff;
        }
    },
}

const VXF = [
    { // Version 0
        head: 32, // Bytes
        handle: function () {
            console.log('Handling header for VXF file format version 0');
        }
    },
];

// LEVEL
const LEVEL = {
    environment: new SpatialHash(),
    dynamic: new Set(),
    // getLevelBackendLocation(entity) {
    //     return entity.id < 128 ? this.environment : this.dynamic;
    // },
    create(id, x, y, z, renderImmediate = false) {
        const entity = new SCENE.world.Entity(id, x, y, z);

        // Add it to the proper collection
        (Entity.ID[entity.id].levelGroup == ENVIRONMENT ? this.environment : this.dynamic).add(entity);

        // // If we need it right away, do that
        if (renderImmediate)
            this.renderSingle(entity);

        return entity;
    },
    // Post-culled voxel face list
    // renderFaces: ENGINE.backCulling ? ['Up', 'Left', 'Right'] : ['BLeft', 'BRight', 'Down', 'Up', 'Left', 'Right'],
    renderSingle(entity) {
        let data = Entity.ID[entity.id];
        if (data.renderType == VOXEL) { // Voxel

            let aoIntensity = 0.5;

            entity.Up = new FACE.Up(data.Up || data.default);
            entity.sprite.addChild(entity.Up);

            let top = this.environment.has(entity.x + 1, entity.y + 1, entity.z + 1);
            let left = this.environment.has(entity.x, entity.y + 1, entity.z + 1);
            let lateralLeft = this.environment.has(entity.x - 1, entity.y + 1, entity.z + 1);
            let right = this.environment.has(entity.x + 1, entity.y, entity.z + 1);
            let lateralRight = this.environment.has(entity.x + 1, entity.y - 1, entity.z + 1);
            let botLeft = this.environment.has(entity.x - 1, entity.y, entity.z + 1);
            let botRight = this.environment.has(entity.x, entity.y - 1, entity.z + 1);

            if (left || lateralLeft) {
                const ao = new PIXI.Sprite(ENGINE.assets.get('assets/ao.png'));
                ao.anchor.x = 1;
                ao.anchor.y = 0;
                ao.rotation = -Math.PI / 2;
                ao.alpha = aoIntensity;
                entity.Up.addChild(ao);
            }

            if (right || lateralRight) {
                const ao = new PIXI.Sprite(ENGINE.assets.get('assets/ao.png'));
                ao.anchor.x = 0;
                ao.anchor.y = 1;
                ao.rotation = Math.PI / 2;
                ao.alpha = aoIntensity;
                entity.Up.addChild(ao);
            }

            if (left || right || top) {
                const ao = new PIXI.Sprite(ENGINE.assets.get('assets/ao.png'));
                ao.anchor.x = 1;
                ao.anchor.y = 1;
                ao.rotation = Math.PI;
                ao.alpha = aoIntensity;
                entity.Up.addChild(ao);
            }

            if (botLeft || botRight) {
                const ao = new PIXI.Sprite(ENGINE.assets.get('assets/ao.png'));
                ao.alpha = aoIntensity;
                entity.Up.addChild(ao);
            }


            entity.Left = new FACE.Left(data.Left || data.default);
            entity.sprite.addChild(entity.Left);

            entity.Right = new FACE.Right(data.Right || data.default);
            entity.sprite.addChild(entity.Right);
            // for (const f of this.renderFaces) {

            //     // Eventually add proper "Meshing" to reduce sprite number
            //     entity[f] = new FACE[f](data[f] || data.default);
            //     entity.sprite.addChild(entity[f]);
            // }
        } else { // Billboard

        }
    },
    render() {
        for (let [k, entity] of LEVEL.environment)
            this.renderSingle(entity);
    },

    // renderEntity(entity) {
    //     if (IDTEX[this.id].type == BILLBOARD) { // Billboard Sprite

    //     } else { // Voxel time

    //     }
    //     if (this.environment == this.getLevelBackendLocation(entity)) { // Environment voxel
    //         if (this.environment.get(entity.x, entity.y, entity.z + 1)) {

    //         }
    //     } else {

    //     }

    // },
    import(url) {
        ENGINE.loaded.level = false;

        fetch(url).then(r => r.blob()).then(blob => {
            // Clear for new scene
            // TODO: Actually destroy or free sprites/entities, all that jazz
            LEVEL.environment.clear();
            LEVEL.dynamic.clear();

            const reader = new FileReader();

            reader.onload = function () {
                const BIN = new Uint8Array(reader.result);

                let pointer = 0;

                // Handle header if magic number VXF?
                if ((BIN[0] << 16) | (BIN[1] << 8) | BIN[2] == 0x565846) {
                    VXF[BIN[3]].handle(BIN);
                    pointer = VXF[BIN[3]].head; // Jump past header
                }

                // Crunch raw binary
                while (pointer + 3 < BIN.length) {
                    LEVEL.create(
                        BIN[pointer],
                        BIN[pointer + 1] - 128,
                        BIN[pointer + 2] - 128,
                        BIN[pointer + 3]
                    );
                    pointer += 4;
                }

                ENGINE.loaded.level = true;
                ENGINE.loaded.check();
            };
            reader.readAsArrayBuffer(blob);
        });
    }
}

let a, b;

// TESTING FUNCTION
async function TEST_INITIALIZATION() {

    for (let z = 0; z < 3; z++) {
        LEVEL.create(0, 0, 0, z);
        for (let x = -5; x <= 5; x++) {
            for (let y = -5; y <= 5; y++) {
                if (Math.random() > 0 + 0.3 * z)
                    LEVEL.create(0, x, y, z);
            }
        }
    }
    LEVEL.render();

};