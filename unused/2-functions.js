function xyzToScreen(x, y, z) {
    return [
        (x - y) * UNIT / SKEW_STRETCH,
        -((x + y) / 2 + z) * UNIT
    ];
}

function screenToXYZ(screenX, screenY, z) {
    // Scale things properly
    screenX /= UNIT;
    screenX *= SKEW_STRETCH;
    screenY /= UNIT;

    return [-screenY + screenX * 0.5 - z, -screenY - screenX * 0.5 - z, z];

    // let cx = 0;
    // cx -= screenY;
    // cx += screenX * 0.5;
    // cx -= z;

    // let cy = 0;
    // cy -= screenY;
    // cy -= screenX * 0.5;
    // cy -= z;
}

function vectorBetween(a, b) {
    return [Math.atan2(b.y - a.y, b.x - a.x), Math.hypot(b.x - a.x, b.y - a.y)];
}

function clampVecXY(v, m) {
    let r;
    if ((r = Math.hypot(v.x, v.y)) <= m) return;
    v.x *= m / r;
    v.y *= m / r;
}

function multiplyHex(color1, color2) {
    // Extract individual RGB components
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;

    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;

    // Perform component-wise multiplication
    const r = Math.floor((r1 * r2) / 255);
    const g = Math.floor((g1 * g2) / 255);
    const b = Math.floor((b1 * b2) / 255);

    // Combine RGB components into a single hex value
    const result = (r << 16) | (g << 8) | b;

    return result;
}

function mixHex(color1, color2, ratio = 0.5) {
    // Extract individual RGB components
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;

    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;

    // Calculate mixed RGB components
    const r = Math.floor((1 - ratio) * r1 + ratio * r2);
    const g = Math.floor((1 - ratio) * g1 + ratio * g2);
    const b = Math.floor((1 - ratio) * b1 + ratio * b2);

    // Combine RGB components into a single hex value
    const result = (r << 16) | (g << 8) | b;

    return result;
}