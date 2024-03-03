PIXI.Layer = class extends PIXI.Container {
    constructor(zIndex) {
        super();
        this.zIndex = zIndex;
        this.requestSort = true;
    }
    sort() {
        console.warn("Sort() is being deprecated");
    }
}

PIXI.Collection = class extends PIXI.Container {
    constructor() {
        super(); // Setup PIXI Container
        this.layers = new Array(0);
        this.target = { x: 0, y: 0 };
        this.offset = { x: 0, y: 0 };
    }
    put(entity) {
        let layer = this.layers[entity.z];

        if (!layer) { // If layer doesn't exist, make it
            layer = new PIXI.Layer(entity.z);
            this.layers[entity.z] = this.addChild(layer);
        }

        layer.addChild(entity.sprite);
    }
    remove(entity) {
        let layer = this.layers[entity.z];
        if (!layer) return;
        return layer.removeChild(entity.sprite);
    }
    tick() {
        // Center target xy in middle of the canvas
        this.x = this.offset.x - this.target.x;
        this.y = this.offset.y - this.target.y;
    }
}