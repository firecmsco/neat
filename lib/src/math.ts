export function makeOrthographic(left: number, right: number, top: number, bottom: number, near: number, far: number) {
    const w = 1.0 / (right - left);
    const h = 1.0 / (top - bottom);
    const p = 1.0 / (far - near);
    const x = (right + left) * w;
    const y = (top + bottom) * h;
    const z = (far + near) * p;
    return new Float32Array([
        2 * w, 0, 0, 0,
        0, 2 * h, 0, 0,
        0, 0, -2 * p, 0,
        -x, -y, -z, 1
    ]);
}

export function makeTranslation(tx: number, ty: number, tz: number) {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        tx, ty, tz, 1
    ]);
}

export function makeRotationX(angleInRadians: number) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    return new Float32Array([
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1
    ]);
}

export function multiplyMatrices(a: Float32Array, b: Float32Array) {
    const out = new Float32Array(16);
    // standard 4x4 multiplication where elements are stored in column-major order
    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 4; row++) {
            out[col * 4 + row] =
                a[0 * 4 + row] * b[col * 4 + 0] +
                a[1 * 4 + row] * b[col * 4 + 1] +
                a[2 * 4 + row] * b[col * 4 + 2] +
                a[3 * 4 + row] * b[col * 4 + 3];
        }
    }
    return out;
}

export class Matrix4 {
    elements: Float32Array;
    constructor() {
        this.elements = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }
    translate(tx: number, ty: number, tz: number) {
        this.elements[12] += this.elements[0] * tx + this.elements[4] * ty + this.elements[8] * tz;
        this.elements[13] += this.elements[1] * tx + this.elements[5] * ty + this.elements[9] * tz;
        this.elements[14] += this.elements[2] * tx + this.elements[6] * ty + this.elements[10] * tz;
        this.elements[15] += this.elements[3] * tx + this.elements[7] * ty + this.elements[11] * tz;
        return this;
    }
    rotateX(angle: number) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const m12 = this.elements[4], m22 = this.elements[5], m32 = this.elements[6], m42 = this.elements[7];
        const m13 = this.elements[8], m23 = this.elements[9], m33 = this.elements[10], m43 = this.elements[11];
        this.elements[4] = c * m12 + s * m13;
        this.elements[5] = c * m22 + s * m23;
        this.elements[6] = c * m32 + s * m33;
        this.elements[7] = c * m42 + s * m43;
        this.elements[8] = c * m13 - s * m12;
        this.elements[9] = c * m23 - s * m22;
        this.elements[10] = c * m33 - s * m32;
        this.elements[11] = c * m43 - s * m42;
        return this;
    }
}

export class OrthographicCamera {
    left: number;
    right: number;
    top: number;
    bottom: number;
    near: number;
    far: number;
    position: [number, number, number];
    projectionMatrix: Matrix4;

    constructor(left: number, right: number, top: number, bottom: number, near: number, far: number) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.near = near;
        this.far = far;
        this.position = [0, 0, 0];
        this.projectionMatrix = new Matrix4();
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        const w = 1.0 / (this.right - this.left);
        const h = 1.0 / (this.top - this.bottom);
        const p = 1.0 / (this.far - this.near);
        const x = (this.right + this.left) * w;
        const y = (this.top + this.bottom) * h;
        const z = (this.far + this.near) * p;
        this.projectionMatrix.elements = new Float32Array([
            2 * w, 0, 0, 0,
            0, 2 * h, 0, 0,
            0, 0, -2 * p, 0,
            -x, -y, -z, 1
        ]);
    }
}

export function updateCamera(camera: OrthographicCamera, width: number, height: number, planeWidth: number = 50, planeHeight: number = 50) {
    const viewPortAreaRatio = 1000000;
    const areaViewPort = width * height;
    const targetPlaneArea = areaViewPort / viewPortAreaRatio * planeWidth * planeHeight / 1.5;

    const ratio = width / height;
    const targetWidth = Math.sqrt(targetPlaneArea * ratio);
    const targetHeight = targetPlaneArea / targetWidth;

    let left = -planeWidth / 2;
    let right = Math.min((left + targetWidth) / 1.5, planeWidth / 2);
    let top = planeHeight / 4;
    let bottom = Math.max((top - targetHeight) / 2, -planeHeight / 4);

    if (ratio < 1) {
        const horizontalScale = ratio;
        left = left * horizontalScale;
        right = right * horizontalScale;
        const mobileZoomFactor = 1.05;
        left = left * mobileZoomFactor;
        right = right * mobileZoomFactor;
        top = top * mobileZoomFactor;
        bottom = bottom * mobileZoomFactor;
    }

    camera.left = left;
    camera.right = right;
    camera.top = top;
    camera.bottom = bottom;
    camera.near = -100;
    camera.far = 1000;
    camera.updateProjectionMatrix();
}

export function generatePlaneGeometry(width: number, height: number, widthSegments: number, heightSegments: number) {
    const width_half = width / 2;
    const height_half = height / 2;
    const gridX = Math.floor(widthSegments);
    const gridY = Math.floor(heightSegments);
    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;
    const segment_width = width / gridX;
    const segment_height = height / gridY;

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    for (let iy = 0; iy < gridY1; iy++) {
        const y = iy * segment_height - height_half;
        for (let ix = 0; ix < gridX1; ix++) {
            const x = ix * segment_width - width_half;
            vertices.push(x, -y, 0);
            normals.push(0, 0, 1);
            uvs.push(ix / gridX);
            uvs.push(1 - (iy / gridY));
        }
    }

    for (let iy = 0; iy < gridY; iy++) {
        for (let ix = 0; ix < gridX; ix++) {
            const a = ix + gridX1 * iy;
            const b = ix + gridX1 * (iy + 1);
            const c = (ix + 1) + gridX1 * (iy + 1);
            const d = (ix + 1) + gridX1 * iy;
            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    const isLarge = vertices.length / 3 > 65535;
    return {
        position: new Float32Array(vertices),
        normal: new Float32Array(normals),
        uv: new Float32Array(uvs),
        index: isLarge ? new Uint32Array(indices) : new Uint16Array(indices)
    };
}
