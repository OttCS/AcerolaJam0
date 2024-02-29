const ActiveEntity = { // exends Entity
    new(x = 0, y = 0, z = 0, obj = {}) {
        let a = Voxel.new(x, y, z);

        a.vector = obj.vector || {
            x: 0,
            y: 0
        }
        a.speed = obj.speed || .04;
        a.maxSpeed = obj.maxSpeed || .08;
        a.friction = obj.friction || 0.16;

        // Game Logic Stuff
        a.health = obj.health || 1;

        a.triggers = {
            stored: new Map(),
            add: (e) => {
                this.triggers.stored.set(e.x + ',' + e.y, {
                    active: true,
                    data: e
                });
            },
            play: () => {
                this.triggers.stored.forEach(v => {
                    if (v.active) {
                        v.data.trigger(this);
                        v.active = false;
                    } else {
                        v.data.off(this);
                        this.triggers.stored.delete(v.data.x + ',' + v.data.y);
                    }
                });
            }
        }

        a.tick = function (delta) {
            this.x += this.vector.x;
            this.y += this.vector.y;

            this.vector.x *= 1 - this.friction * delta;
            this.vector.y *= 1 - this.friction * delta;

            for (let x = Math.floor(this.x); x < Math.ceil(this.x + this.size.x); x++) {
                for (let y = Math.floor(this.y); y < Math.ceil(this.y + this.size.y); y++) {
                    let e = GAME.env.get({ x: x, y: y, z: this.z });
                    if (e) {
                        let wx = Math.withinRange(this.x, e.x - this.size.x, x + e.size.x);
                        let wy = Math.withinRange(this.y, e.y - this.size.y, y + e.size.y);
                        if (wx <= 0 && wy <= 0) { // AABB Collision, just implemented manually
                            if (e.collider) {
                                if (wx <= wy) {
                                    this.y += this.y < y ? wy : -wy;
                                    dy = 0;
                                } else {
                                    this.x += this.x < x ? wx : -wx;
                                    dx = 0;
                                }
                            }
                            if (e.trigger) this.triggers.add(e);
                        }
                    }
                }
            }

            // this.triggers.play();

            [this.sprite.x, this.sprite.y] = xyzToScreen(this.x, this.y, this.z);
            this.sprite.parent.edit();
            if (this.health <= 0) this.death();
        }
        a.death = function () { }
        return a;
    }
}

const Player = { // extends ActiveEntity
    KRADIAN: [ // Stored radian directions to auto-compute the motion angle for the player
        0.25 * Math.PI, // Up
        1.25 * Math.PI, // Down
        .75 * Math.PI, // Left
        .5 * Math.PI, // Left Up
        1 * Math.PI, // Left Down
        1.75 * Math.PI, // Right
        0 * Math.PI, // Right Up
        1.5 * Math.PI // Right Down
    ],
    controller(delta) {
        let r = (
            6 * ZEPHYR.Keys.down(KEY.RIGHT) + 3 * ZEPHYR.Keys.down(KEY.LEFT) +
            (2 * ZEPHYR.Keys.down(KEY.DOWN) + ZEPHYR.Keys.down(KEY.UP)) % 3
        ) % 9;
        if (r > 0) {
            this.vector.x += Math.cos(Player.KRADIAN[r - 1]) * this.speed * delta;
            this.vector.y += Math.sin(Player.KRADIAN[r - 1]) * this.speed * delta;
        }
        clampVecXY(this.vector, this.maxSpeed * delta);
        this.tick(delta);
    },
    new(x = 0, y = 0, z = 0, data = {}) {
        let p = ActiveEntity.new(x, y, z, data);
        if (data != null) ZEPHYR.utils.merge(p, data);
        p.addLeft('asset/blank.png');
        p.addTop('asset/blank.png');
        p.addRight('asset/blank.png');
        p.controller = Player.controller;
        p.warpLinkID = null;
        return p;
    },
}