export function isDarkColor(color: string) {
    const c = color.substring(1);      // strip #
    const rgb = parseInt(c, 16);   // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >> 8) & 0xff;  // extract green
    const b = (rgb >> 0) & 0xff;  // extract blue

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    return luma < 128;
}

export function getComplementaryColor(color: string) {
    const c = color.substring(1); // strip #
    const rgb = parseInt(c, 16); // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff; // extract red
    const g = (rgb >> 8) & 0xff;  // extract green
    const b = (rgb >> 0) & 0xff;  // extract blue

    // Calculate the complementary color
    const compR = 255 - r;
    const compG = 255 - g;
    const compB = 255 - b;

    // Convert back to hex and return
    const compColor = ((1 << 24) + (compR << 16) + (compG << 8) + compB).toString(16).slice(1);
    return `#${compColor}`;
}

export function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function extractColorsFromImage(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }
                // Downsample image to speed up calculation
                const SIZE = 50;
                canvas.width = SIZE;
                canvas.height = SIZE;
                ctx.drawImage(img, 0, 0, SIZE, SIZE);
                const imgData = ctx.getImageData(0, 0, SIZE, SIZE).data;

                // Gather all pixel colors
                const pixels: [number, number, number][] = [];
                for (let i = 0; i < imgData.length; i += 4) {
                    const r = imgData[i];
                    const g = imgData[i + 1];
                    const b = imgData[i + 2];
                    const a = imgData[i + 3];
                    // Skip transparent pixels
                    if (a > 128) {
                        pixels.push([r, g, b]);
                    }
                }

                if (pixels.length === 0) {
                    reject(new Error("No opaque pixels found in image"));
                    return;
                }

                // Run K-means clustering to find 5 dominant colors
                const K = 5;
                const centroids: [number, number, number][] = [];
                
                // Initialize centroids using K-means++ style for better spread
                centroids.push([...pixels[Math.floor(Math.random() * pixels.length)]]);
                
                for (let k = 1; k < K; k++) {
                    let maxDist = -1;
                    let nextCentroidIdx = 0;
                    for (let i = 0; i < pixels.length; i++) {
                        let minDist = Infinity;
                        for (const centroid of centroids) {
                            const dist = Math.pow(pixels[i][0] - centroid[0], 2) +
                                         Math.pow(pixels[i][1] - centroid[1], 2) +
                                         Math.pow(pixels[i][2] - centroid[2], 2);
                            if (dist < minDist) {
                                minDist = dist;
                            }
                        }
                        if (minDist > maxDist) {
                            maxDist = minDist;
                            nextCentroidIdx = i;
                        }
                    }
                    centroids.push([...pixels[nextCentroidIdx]]);
                }

                const MAX_ITERATIONS = 10;
                for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
                    const clusters: [number, number, number][][] = Array.from({ length: K }, () => []);
                    for (const pixel of pixels) {
                        let minDist = Infinity;
                        let clusterIdx = 0;
                        for (let c = 0; c < K; c++) {
                            const centroid = centroids[c];
                            const dist = Math.pow(pixel[0] - centroid[0], 2) +
                                         Math.pow(pixel[1] - centroid[1], 2) +
                                         Math.pow(pixel[2] - centroid[2], 2);
                            if (dist < minDist) {
                                minDist = dist;
                                clusterIdx = c;
                            }
                        }
                        clusters[clusterIdx].push(pixel);
                    }

                    // Re-calculate centroids
                    for (let c = 0; c < K; c++) {
                        const cluster = clusters[c];
                        if (cluster.length > 0) {
                            let sumR = 0, sumG = 0, sumB = 0;
                            for (const p of cluster) {
                                sumR += p[0];
                                sumG += p[1];
                                sumB += p[2];
                            }
                            centroids[c] = [
                                Math.round(sumR / cluster.length),
                                Math.round(sumG / cluster.length),
                                Math.round(sumB / cluster.length)
                            ];
                        } else {
                            // If cluster is empty, re-initialize with a random pixel
                            const idx = Math.floor(Math.random() * pixels.length);
                            centroids[c] = [...pixels[idx]];
                        }
                    }
                }

                // Convert centroids to hex
                const rgbToHex = (r: number, g: number, b: number) => {
                    const toHex = (c: number) => {
                        const hex = c.toString(16);
                        return hex.length === 1 ? "0" + hex : hex;
                    };
                    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
                };

                const hexColors = centroids.map(([r, g, b]) => rgbToHex(r, g, b));
                resolve(hexColors);
            };
            img.onerror = () => reject(new Error("Failed to load image element"));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
    });
}
