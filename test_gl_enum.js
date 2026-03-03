const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({
        args: [
            '--use-gl=angle',
            '--use-angle=gl',
            '--ignore-gpu-blocklist',
            '--enable-webgl',
            '--enable-unsafe-webgl'
        ]
    });
    const page = await browser.newPage();
    const val = await page.evaluate(() => {
        const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
        for (let k in gl) {
            if (gl[k] === 37442) return k;
        }
        return "NOT_FOUND";
    });
    console.log("WebGL 2 ENUM FOR 37442: " + val);
    await browser.close();
})();
