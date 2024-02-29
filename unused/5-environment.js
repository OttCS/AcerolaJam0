ENGINE.Assets.list = [
    'asset/blank.png',
    'asset/voxel/grass.png',
    'asset/voxel/limestone.png',
    'asset/ui/cursor.png',
    'asset/light-source.png'
];

const Environment = {
    TypeToAssets: {
        0: [0], // Blank
        1: [1], // Grass
        2: [2], // Limestone
    },
    passRender() {
        ENGINE.log('Already rendered, skipping')
    },
    entityRenderer() {
        this.sprite.addChild(new PIXI.Sprite(ENGINE.Assets.get(Entity.Type2Assets[this.type][0])));
        SCENE.world.put(this);
        this.render = Environment.passRender;
        return this;
    },
    voxelRenderer(addToWorld = true) {
        let tex = Environment.TypeToAssets[this.type];
        if (!tex) return this;

        // If no block front-left? Render left face
        if (!ENGINE.FaceCulling || !GAME.env.has({ x: this.x - 1, y: this.y, z: this.z }))
            this.addLeft(ENGINE.Assets.list[tex[0]]);

        // If no block front-right? Render right face
        if (!ENGINE.FaceCulling || !GAME.env.has({ x: this.x, y: this.y - 1, z: this.z }))
            this.addRight(ENGINE.Assets.list[tex[1] || tex[0]]);

        // If no block on top? Render top face
        if (!ENGINE.FaceCulling || !GAME.env.has({ x: this.x, y: this.y, z: this.z + 1 }))
            this.addTop(ENGINE.Assets.list[tex[2] || tex[0]]);

        if (addToWorld) SCENE.world.put(this);
        this.render = Environment.passRender;
        return this;
    },
    create(type = 0, x = 0, y = 0, z = 0) {
        let e;
        if (type <= 63) {
            e = Voxel.new(x, y, z);
            e.collider = true;
            e.render = Environment.voxelRenderer;
            GAME.env.add(e);
        }
        e.type = type;
        return e;
    }
};