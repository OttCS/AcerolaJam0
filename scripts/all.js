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
        status() {
            return ENGINE.loaded.scene && ENGINE.loaded.textures && ENGINE.loaded.level;
        },
        check() {
            if (ENGINE.loaded.status()) {
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
    'assets/ao.png',
    'assets/grass.png',
    'assets/brush.png'
]);

const SCENE = new PIXI.Application();
SCENE.world = new PIXI.Collection(); // 3D Environment
SCENE.ui = new PIXI.Collection(); // 2D Overlay

// SCENE INITIALIZATION
SCENE.setup = async function () {
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
        if (ENGINE.loaded.status()) { // Engine isn't actively loading something
            if (LEVEL.player.tick) LEVEL.player.tick();
        }
    });

    ENGINE.loaded.scene = true;
    ENGINE.loaded.check();
};

// RenderType
const VOXEL = 0;
const BILLBOARD = 1;

// ENTITY (and Scene shortcuts for adding them)
class Entity {
    constructor(id, x = 0, y = 0, z = 0) {
        this.sprite = new PIXI.Container();
        this.data = Entity.ID[id];
        this.x = x;
        this.y = y;
        this.z = z;
        this._z = z; // Previous Z

        if (Entity.ID[id].setup) Entity.ID[id].setup(this); // Specific initialization
    }
    static ID = [
        { // Player
            id: 0,
            renderType: VOXEL,
            dynamic: true,
            default: "assets/blank.png",
            setup(entity) {
                entity.tick = function () {
                    // console.log("I'm active!")
                }
            },
        },
        { // Grass
            id: 1,
            renderType: VOXEL,
            default: "assets/grass.png"
        },
        { // Concrete
            id: 2,
            renderType: VOXEL,
            default: "assets/brush.png"
        },
    ]
}

SCENE.world.updatePosition = function () {
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
SCENE.world.add = function (entity) {
    SCENE.world.put(entity);
    entity.updatePosition = SCENE.world.updatePosition;
    return entity;
}

// SCENE.world.Entity = class extends Entity {
//     constructor(id, x, y, z) {
//         super(id, x, y, z);
//         this._z = z;
//         SCENE.world.put(this);
//         this.updatePosition();
//     }
//     updatePosition() {
//         // If the z position has changed, swap the layer it's on
//         if (this.z != this._z) {
//             let newZ = this.z;
//             this.z = this._z;
//             SCENE.world.remove(this)
//             this.z = newZ;
//             SCENE.world.put(this)
//         }
//         [this.sprite.x, this.sprite.y] = xyzToScreen(this.x, this.y, this.z);
//         SCENE.world.layers[this.z].edit();
//         this._z = this.z; // Previous Z
//     }
// }


SCENE.ui.updatePosition = function () {
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
SCENE.ui.add = function (entity) {
    SCENE.ui.put(entity);
    entity.updatePosition = SCENE.ui.updatePosition;
    return entity;
}

// SCENE.ui.Entity = class extends Entity {
//     constructor(id, x, y, z) {
//         super(id, x, y, z);
//         SCENE.ui.put(this);
//         this.updatePosition();
//     }
//     updatePosition() {
//         // If the z position has changed, swap the layer it's on
//         if (this.z != this._z) {
//             let newZ = this.z;
//             this.z = this._z;
//             SCENE.ui.remove(this)
//             this.z = newZ;
//             SCENE.ui.put(this)
//         }
//         this.sprite.x = this.x;
//         this.sprite.y = this.y;
//         SCENE.ui.layers[this.z].edit();
//         this._z = this.z; // Previous Z
//     }
// }

// Produces skewed Sprites to fit an isometric voxel's faces
const FACE = {
    Up: class extends PIXI.Sprite {
        constructor(url) {
            super(ENGINE.assets.get(url));
            this.skew.x = 4 * Math.PI / 3;
            this.skew.y = -Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0xffffff;
        }
    },
    Left: class extends PIXI.Sprite {
        constructor(url) {
            super(ENGINE.assets.get(url));
            this.skew.y = 7 * Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0xbfdfff;
        }
    },
    Right: class extends PIXI.Sprite {
        constructor(url) {
            super(ENGINE.assets.get(url));
            this.skew.y = -Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0xdfefff;
        }
    },
    Down: class extends PIXI.Sprite {
        constructor(texture) {
            super(texture);
            this.skew.x = -Math.PI / 3;
            this.skew.y = Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0xffffff;
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
    name: 'level',
    player: { x: 5, y: 5, z: 0 },
    // getLevelBackendLocation(entity) {
    //     return entity.id < 128 ? this.environment : this.dynamic;
    // },
    create(id, x, y, z, renderImmediate = false) {
        const entity = SCENE.world.add(new Entity(id, x, y, z));

        // Add it to the proper collection
        (entity.data.dynamic ? this.dynamic : this.environment).add(entity);

        // // If we need it right away, do that
        if (renderImmediate)
            this.renderSingle(entity);

        return entity;
    },
    // Post-culled voxel face list
    // renderFaces: ENGINE.backCulling ? ['Up', 'Left', 'Right'] : ['BLeft', 'BRight', 'Down', 'Up', 'Left', 'Right'],
    renderSingle(entity, log) {
        if (entity.data.renderType == VOXEL) { // Voxel

            entity.Up = new FACE.Up(entity.data.Up || entity.data.default);
            entity.sprite.addChild(entity.Up);

            entity.Left = new FACE.Left(entity.data.Left || entity.data.default);
            entity.sprite.addChild(entity.Left);

            entity.Right = new FACE.Right(entity.data.Right || entity.data.default);
            entity.sprite.addChild(entity.Right);

            // Eventually add proper "Meshing" to reduce sprite number

        } else { // Billboard

        }
        if (log) console.log(entity);
    },
    render() {
        this.renderSingle(LEVEL.player, true);
        for (let [k, entity] of LEVEL.environment)
            this.renderSingle(entity);
        for (let [k, entity] of LEVEL.dynamic)
            this.renderSingle(entity);
    },
    import(url) {
        ENGINE.loaded.level = false;

        let temPlayer = SCENE.world.add(new Entity(0, LEVEL.player.x, LEVEL.player.y, LEVEL.player.z));

        fetch(url).then(r => r.blob()).then(blob => {
            // Clear for new scene
            // TODO: Actually destroy or free sprites/entities, all that jazz

            LEVEL.name = url.replace(/^.*[\\\/]/, '').replace(/\.[^/.]+$/, ""); // Grab file name from url
            LEVEL.dynamic.clear();
            LEVEL.environment.forEach(e => {
                SCENE.world.removeChild(e.sprite);
                e.sprite.destroy({ children: true });
                SCENE.world.remove(e);
            });
            LEVEL.environment.clear();

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
                    ).updatePosition();
                    pointer += 4;
                }

                LEVEL.player = temPlayer;
                SCENE.world.target = temPlayer.sprite;
                temPlayer.updatePosition();
                SCENE.world.add(temPlayer);

                ENGINE.loaded.level = true;
                LEVEL.render();
                ENGINE.loaded.check();
            };
            reader.readAsArrayBuffer(blob);
        });
    },
    export() {
        const VXF_VERSION = VXF.length - 1;
        const HEADER_SIZE = VXF[VXF_VERSION].head;
        const BIN = new Uint8ClampedArray(new ArrayBuffer(HEADER_SIZE + 4 * (LEVEL.environment.size + LEVEL.dynamic.size)));
        let i = 0;
        BIN[i++] = 0x56;
        BIN[i++] = 0x58;
        BIN[i++] = 0x46;
        BIN[i++] = VXF_VERSION;
        i = HEADER_SIZE;
        LEVEL.environment.forEach(v => {
            BIN[i++] = v.id;
            BIN[i++] = v.x + 128;
            BIN[i++] = v.y + 128;
            BIN[i++] = v.z;
        });
        LEVEL.dynamic.forEach(v => {
            BIN[i++] = v.id;
            BIN[i++] = v.x + 128;
            BIN[i++] = v.y + 128;
            BIN[i++] = v.z;
        });
        console.log(BIN);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([BIN], { type: 'application/octet-stream' }));
        link.download = `${LEVEL.name}.vxf`; // Specify the file name
        link.click();
    }
}

let loadLevel = true;

// TESTING FUNCTION
async function TEST_INITIALIZATION() {

    if (loadLevel) {
        loadLevel = false;
        LEVEL.import('level/demoBox.vxf');
    }

    // let z = 0;
    // // for (let z = 0; z < 3; z++) {
    // //     LEVEL.create(0, 0, 0, z);
    // let ring = 6;
    // for (let x = -ring; x <= ring; x++) {
    //     for (let y = -ring; y <= ring; y++) {
    //         LEVEL.create(1, x, y, z);
    //         if (x == -ring || x == ring || y == -ring || y == ring)
    //             LEVEL.create(2, x, y, z + 1);

    //         if (Math.random() * 4 > Math.hypot(x, y))
    //             LEVEL.create(2, x, y, z + 1);
    //     }
    // }
    // // }
    // LEVEL.render();
};

SCENE.setup();