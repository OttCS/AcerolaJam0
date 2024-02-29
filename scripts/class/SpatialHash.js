class SpatialHash extends Map {
    static hash (x = 0, y = 0, z = 0) {   
        return ((x + 127) << 16) | ((y + 127) << 8) | z;
    }
    constructor(i) {
        super(i);
    }
    get(p, y, z) {
        return super.get(SpatialHash.hash(p.x || p, y || p.y, z || p.z));
    }
    has(p, y, z) {
        return super.has(SpatialHash.hash(p.x || p, y || p.y, z || p.z));
    }
    add(o) {
        return super.set(SpatialHash.hash(o.x, o.y, o.z), o);
    }
    delete(p, y, z) {
        return super.delete(SpatialHash.hash(p.x || p, y || p.y, z || p.z));
    }
}