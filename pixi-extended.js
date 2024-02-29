PIXI.Layer = class extends PIXI.Container {
    constructor(zIndex) {
        super();
        this.zIndex = zIndex;
        this.requestSort = true;
    }
    edit() {
        this.requestSort = true;
    }
    sort() {
        this.requestSort = false;
        this.children.sort((a, b) => a.y - b.y);
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
            layer = new PIXI.Layer();
            this.layers[entity.z] = this.addChild(layer);
            this.children.sort((a, b) => a.zIndex - b.zIndex);
        }

        layer.addChild(entity.sprite);
        layer.edit();
    }
    remove(entity) {
        let layer = this.layers[entity.z];
        if (!layer) return;
        layer.edit();
        return layer.removeChild(entity.sprite);
    }
    tick() {
        // Center target xy in middle of the canvas
        this.x = this.offset.x - this.target.x;
        this.y = this.offset.y - this.target.y;

        // Sort _layers if needed
        this.layers.forEach(layer => {
            if (layer.requestSort)
                layer.sort();
        })
    }
}