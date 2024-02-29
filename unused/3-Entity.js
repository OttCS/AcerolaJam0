class Entity {
    constructor(x, y, z) {
        this.sprite = new PIXI.Container();
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

SCENE.world.Entity = class extends Entity {
    constructor(o = {}) {
        super(o.x, o.y, o.z);
        SCENE.world.put(this);
    }
    updatePosition() {
        [this.sprite.x, this.sprite.y] = xyzToScreen(this.x, this.y, this.z);
    }
}

SCENE.ui.Entity = class extends Entity {
    constructor(o = {}) {
        super(o.x, o.y, o.z);
        SCENE.ui.put(this);
    }
    updatePosition() {
        this.sprite.x = this.x;
        this.sprite.y = this.y;
    }
}
