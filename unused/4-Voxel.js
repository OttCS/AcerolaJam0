const VOXEL = {
    Up: class extends PIXI.Sprite {
        constructor(texture) {
            super(texture);
            this.skew.x = 4 * Math.PI / 3;
            this.skew.y = -Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0x0000ff;
        }
    },
    Left: class extends PIXI.Sprite {
        constructor(texture) {
            super(texture);
            this.skew.y = 7 * Math.PI / 6;
            this.height = this.width = UNIT;
            this.tint = 0xff0000;
        }
    },
    Right: class extends PIXI.Sprite {
        constructor(texture) {
            super(texture);
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

// async function test () {
//     const texture = await PIXI.Assets.load('asset/coconut.jpg');
//     const thing = new SCENE.world.Entity();
//     thing.anchor = {x: 0.5, y: 0.5};
//     SCENE.world.target = thing.sprite;

//     thing.x = SCENE.renderer.width / 2;
//     thing.y = SCENE.renderer.height / 2;

//     const bg = new PIXI.Sprite(texture);
//     bg.width = bg.height = UNIT;
//     thing.sprite.addChild(bg);
//     thing.sprite.addChild(new VOXEL.Up(texture));
//     thing.sprite.addChild(new VOXEL.Right(texture));
//     thing.sprite.addChild(new VOXEL.Left(texture));
// };
// test();