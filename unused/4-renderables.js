const Entity = { // Factory and Object Pooling
    POOL: new Array(0),
    free() {
        if (this.sprite.parent) this.sprite.parent.removeChild(this.sprite);
        this.sprite.removeChildren().forEach(sprite => {
            sprite.destroy({ children: true })
        });
        GAME.env.delete(this);
        Entity.POOL.push(this);
        return this;
    },
    new(x = 0, y = 0, z = 0) {
        let e;
        if (Entity.POOL.length == 0) {
            // New entity!
            e = {
                sprite: new PIXI.Container(),
                free: Entity.free,
                size: {
                    x: 0,
                    y: 0,
                    z: 0
                }
            }
            e.sprite.cullable = true;
        } else {
            // Reuse freed entity in pool
            e = Entity.POOL.pop();
        }
        [e.x, e.y, e.z] = [x, y, z];
        e.render = Entity.renderer;
        e.sprite.anchor = { x: 0.5, y: 0.5 }
        e.size.x = e.size.y = e.size.z = 1;
        e.sprite.tint = 0xffffff;
        [e.sprite.x, e.sprite.y] = xyzToScreen(e.x = x, e.y = y, e.z = z);
        return e;
    },
}

const Voxel = { // extends Entity
    addLeft(url) {
        let s = new PIXI.Sprite(ENGINE.Assets.get(url));
        s.anchor.x = 1;
        s.skew.y = Math.PI / 6;
        s.tint = 0xe7eff7;
        s.height = s.width = UNIT;
        this.sprite.addChild(s);
        this.size.y = 1;
        this.size.z = 1;
    },
    addRight(url) {
        let s = new PIXI.Sprite(ENGINE.Assets.get(url));
        s.skew.y = -Math.PI / 6;
        s.tint = 0xf7f7f7;
        s.height = s.width = UNIT;
        this.sprite.addChild(s);
        this.size.x = 1;
        this.size.z = 1;
    },
    addTop(url) {
        let s = new PIXI.Sprite(ENGINE.Assets.get(url));
        s.anchor.x = 1;
        s.anchor.y = 1;
        s.skew.y = -Math.PI / 6;
        s.rotation = Math.PI / 3;
        s.tint = 0xfffff7;
        s.height = s.width = UNIT;
        this.sprite.addChild(s);
        this.size.x = 1;
        this.size.y = 1;
        this.size.z = 1;
    },
    addFloor(url) {
        let s = new PIXI.Sprite(ENGINE.Assets.get(url));
        s.anchor.x = 0;
        s.anchor.y = 0;
        s.skew.y = -Math.PI / 6;
        s.rotation = Math.PI / 3;
        s.tint = 0xfffff7;
        s.height = s.width = UNIT;
        this.sprite.addChild(s);
        this.size.x = 1;
        this.size.y = 1;
    },
    new(x = 0, y = 0, z = 0) {
        let v = Entity.new(x, y, z);
        v.addLeft = Voxel.addLeft;
        v.addRight = Voxel.addRight;
        v.addFloor = Voxel.addFloor;
        v.addTop = Voxel.addTop;
        return v;
    },
}