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
    identity() {
        const e = this.elements;
        e[0] = 1; e[1] = 0; e[2] = 0; e[3] = 0;
        e[4] = 0; e[5] = 1; e[6] = 0; e[7] = 0;
        e[8] = 0; e[9] = 0; e[10] = 1; e[11] = 0;
        e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
        return this;
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
    rotateY(angle: number) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const m11 = this.elements[0], m21 = this.elements[1], m31 = this.elements[2], m41 = this.elements[3];
        const m13 = this.elements[8], m23 = this.elements[9], m33 = this.elements[10], m43 = this.elements[11];
        this.elements[0] = c * m11 - s * m13;
        this.elements[1] = c * m21 - s * m23;
        this.elements[2] = c * m31 - s * m33;
        this.elements[3] = c * m41 - s * m43;
        this.elements[8] = s * m11 + c * m13;
        this.elements[9] = s * m21 + c * m23;
        this.elements[10] = s * m31 + c * m33;
        this.elements[11] = s * m41 + c * m43;
        return this;
    }
    rotateZ(angle: number) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const m11 = this.elements[0], m21 = this.elements[1], m31 = this.elements[2], m41 = this.elements[3];
        const m12 = this.elements[4], m22 = this.elements[5], m32 = this.elements[6], m42 = this.elements[7];
        this.elements[0] = c * m11 + s * m12;
        this.elements[1] = c * m21 + s * m22;
        this.elements[2] = c * m31 + s * m32;
        this.elements[3] = c * m41 + s * m42;
        this.elements[4] = -s * m11 + c * m12;
        this.elements[5] = -s * m21 + c * m22;
        this.elements[6] = -s * m31 + c * m32;
        this.elements[7] = -s * m41 + c * m42;
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
    zoom: number;

    constructor(left: number, right: number, top: number, bottom: number, near: number, far: number) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.near = near;
        this.far = far;
        this.position = [0, 0, 0];
        this.zoom = 1.0;
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

export function updateCamera(camera: OrthographicCamera, width: number, height: number, planeWidth: number = 50, planeHeight: number = 50, shapeType: string = "plane", zoom: number = 1.0) {
    camera.zoom = zoom;
    const ratio = width / height;

    if (shapeType === "plane") {
        const viewPortAreaRatio = 1000000;
        const areaViewPort = width * height;
        const targetPlaneArea = areaViewPort / viewPortAreaRatio * planeWidth * planeHeight / 1.5;

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
    } else {
        // Localized 3D shapes: Sphere, Torus, Cylinder, Ribbon.
        // Use a symmetrical, non-stretching camera frustum.
        let halfSize = 25.0; // Default for Ribbon / others
        if (shapeType === "sphere") {
            halfSize = 30.0;
        } else if (shapeType === "torus") {
            halfSize = 35.0;
        } else if (shapeType === "cylinder") {
            halfSize = 30.0;
        }

        if (ratio >= 1.0) {
            camera.left = -halfSize * ratio;
            camera.right = halfSize * ratio;
            camera.top = halfSize;
            camera.bottom = -halfSize;
        } else {
            camera.left = -halfSize;
            camera.right = halfSize;
            camera.top = halfSize / ratio;
            camera.bottom = -halfSize / ratio;

            // Zoom out slightly on mobile (1.05 = 5% zoom out)
            const mobileZoomFactor = 1.05;
            camera.left *= mobileZoomFactor;
            camera.right *= mobileZoomFactor;
            camera.top *= mobileZoomFactor;
            camera.bottom *= mobileZoomFactor;
        }
    }

    // Apply camera zoom to the boundary coordinates
    camera.left /= zoom;
    camera.right /= zoom;
    camera.top /= zoom;
    camera.bottom /= zoom;

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

    // Generate wireframe indices: for each triangle (a,b,c), emit lines a→b, b→c, c→a
    const wireframeIndices = [];
    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];
        wireframeIndices.push(a, b, b, c, c, a);
    }

    return {
        position: new Float32Array(vertices),
        normal: new Float32Array(normals),
        uv: new Float32Array(uvs),
        index: isLarge ? new Uint32Array(indices) : new Uint16Array(indices),
        wireframeIndex: isLarge ? new Uint32Array(wireframeIndices) : new Uint16Array(wireframeIndices)
    };
}

export function generateSphereGeometry(radius: number, widthSegments: number, heightSegments: number) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const widthSegmentsFloor = Math.floor(widthSegments);
    const heightSegmentsFloor = Math.floor(heightSegments);

    for (let iy = 0; iy <= heightSegmentsFloor; iy++) {
        const v = iy / heightSegmentsFloor;
        const theta = v * Math.PI;

        for (let ix = 0; ix <= widthSegmentsFloor; ix++) {
            const u = ix / widthSegmentsFloor;
            const phi = u * Math.PI * 2;

            const x = -radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.cos(theta);
            const z = radius * Math.sin(theta) * Math.sin(phi);

            vertices.push(x, y, z);
            
            const len = Math.sqrt(x*x + y*y + z*z);
            normals.push(x/len, y/len, z/len);
            
            uvs.push(u, 1 - v);
        }
    }

    for (let iy = 0; iy < heightSegmentsFloor; iy++) {
        for (let ix = 0; ix < widthSegmentsFloor; ix++) {
            const a = ix + (widthSegmentsFloor + 1) * iy;
            const b = ix + (widthSegmentsFloor + 1) * (iy + 1);
            const c = (ix + 1) + (widthSegmentsFloor + 1) * (iy + 1);
            const d = (ix + 1) + (widthSegmentsFloor + 1) * iy;

            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    const isLarge = vertices.length / 3 > 65535;
    const wireframeIndices = [];
    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];
        wireframeIndices.push(a, b, b, c, c, a);
    }

    return {
        position: new Float32Array(vertices),
        normal: new Float32Array(normals),
        uv: new Float32Array(uvs),
        index: isLarge ? new Uint32Array(indices) : new Uint16Array(indices),
        wireframeIndex: isLarge ? new Uint32Array(wireframeIndices) : new Uint16Array(wireframeIndices)
    };
}

export function generateTorusGeometry(radius: number, tube: number, radialSegments: number, tubularSegments: number) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const radialSegmentsFloor = Math.floor(radialSegments);
    const tubularSegmentsFloor = Math.floor(tubularSegments);

    for (let j = 0; j <= radialSegmentsFloor; j++) {
        const v = j / radialSegmentsFloor * Math.PI * 2;

        for (let i = 0; i <= tubularSegmentsFloor; i++) {
            const u = i / tubularSegmentsFloor * Math.PI * 2;

            const x = (radius + tube * Math.cos(v)) * Math.cos(u);
            const y = (radius + tube * Math.cos(v)) * Math.sin(u);
            const z = tube * Math.sin(v);

            vertices.push(x, y, z);

            const cx = radius * Math.cos(u);
            const cy = radius * Math.sin(u);
            const nx = x - cx;
            const ny = y - cy;
            const nz = z;
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            normals.push(nx / len, ny / len, nz / len);

            uvs.push(i / tubularSegmentsFloor, j / radialSegmentsFloor);
        }
    }

    for (let j = 1; j <= radialSegmentsFloor; j++) {
        for (let i = 1; i <= tubularSegmentsFloor; i++) {
            const a = (tubularSegmentsFloor + 1) * j + i - 1;
            const b = (tubularSegmentsFloor + 1) * (j - 1) + i - 1;
            const c = (tubularSegmentsFloor + 1) * (j - 1) + i;
            const d = (tubularSegmentsFloor + 1) * j + i;

            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    const isLarge = vertices.length / 3 > 65535;
    const wireframeIndices = [];
    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];
        wireframeIndices.push(a, b, b, c, c, a);
    }

    return {
        position: new Float32Array(vertices),
        normal: new Float32Array(normals),
        uv: new Float32Array(uvs),
        index: isLarge ? new Uint32Array(indices) : new Uint16Array(indices),
        wireframeIndex: isLarge ? new Uint32Array(wireframeIndices) : new Uint16Array(wireframeIndices)
    };
}

export function generateCylinderGeometry(radiusTop: number, radiusBottom: number, height: number, radialSegments: number, heightSegments: number) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const radialSegmentsFloor = Math.floor(radialSegments);
    const heightSegmentsFloor = Math.floor(heightSegments);

    const halfHeight = height / 2;

    for (let y = 0; y <= heightSegmentsFloor; y++) {
        const v = y / heightSegmentsFloor;
        const h = v * height - halfHeight;
        const radius = v * (radiusBottom - radiusTop) + radiusTop;

        for (let x = 0; x <= radialSegmentsFloor; x++) {
            const u = x / radialSegmentsFloor;
            const theta = u * Math.PI * 2;

            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            vertices.push(radius * sinTheta, -h, radius * cosTheta);
            normals.push(sinTheta, 0, cosTheta);
            uvs.push(u, 1 - v);
        }
    }

    for (let y = 0; y < heightSegmentsFloor; y++) {
        for (let x = 0; x < radialSegmentsFloor; x++) {
            const a = x + (radialSegmentsFloor + 1) * y;
            const b = x + (radialSegmentsFloor + 1) * (y + 1);
            const c = (x + 1) + (radialSegmentsFloor + 1) * (y + 1);
            const d = (x + 1) + (radialSegmentsFloor + 1) * y;

            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    const isLarge = vertices.length / 3 > 65535;
    const wireframeIndices = [];
    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];
        wireframeIndices.push(a, b, b, c, c, a);
    }

    return {
        position: new Float32Array(vertices),
        normal: new Float32Array(normals),
        uv: new Float32Array(uvs),
        index: isLarge ? new Uint32Array(indices) : new Uint16Array(indices),
        wireframeIndex: isLarge ? new Uint32Array(wireframeIndices) : new Uint16Array(wireframeIndices)
    };
}

export function generateRibbonGeometry(width: number, height: number, widthSegments: number, heightSegments: number, bend: number, twist: number) {
    const width_half = width / 2;
    const height_half = height / 2;
    const gridX = Math.floor(widthSegments);
    const gridY = Math.floor(heightSegments);
    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;
    const segment_width = width / gridX;
    const segment_height = height / gridY;

    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let iy = 0; iy < gridY1; iy++) {
        const y = iy * segment_height - height_half;
        for (let ix = 0; ix < gridX1; ix++) {
            const x = ix * segment_width - width_half;

            let xp = x;
            let yp = y;
            let zp = 0;

            let nx = 0;
            let ny = 0;
            let nz = 1;

            if (Math.abs(bend) > 0.001) {
                const r = width / bend;
                const angle = x / r;
                xp = r * Math.sin(angle);
                zp = r * (1 - Math.cos(angle));

                nx = Math.sin(angle);
                nz = Math.cos(angle);
            }

            if (Math.abs(twist) > 0.001) {
                const angle = (y / height) * twist;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                
                const rx = xp * cosA - zp * sinA;
                const rz = xp * sinA + zp * cosA;
                xp = rx;
                zp = rz;

                const rnx = nx * cosA - nz * sinA;
                const rnz = nx * sinA + nz * cosA;
                nx = rnx;
                nz = rnz;
            }

            vertices.push(xp, -yp, zp);
            normals.push(nx, ny, nz);
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
    const wireframeIndices = [];
    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];
        wireframeIndices.push(a, b, b, c, c, a);
    }

    return {
        position: new Float32Array(vertices),
        normal: new Float32Array(normals),
        uv: new Float32Array(uvs),
        index: isLarge ? new Uint32Array(indices) : new Uint16Array(indices),
        wireframeIndex: isLarge ? new Uint32Array(wireframeIndices) : new Uint16Array(wireframeIndices)
    };
}
