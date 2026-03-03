const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--use-gl=angle',
            '--use-angle=gl',
            '--ignore-gpu-blocklist',
            '--enable-webgl',
            '--enable-unsafe-webgl',
            '--disable-gpu-watchdog',
            '--disable-gpu-sandbox'
        ]
    });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('error') || text.includes('Error') || text.includes('ERROR:')) {
            console.log(`BROWSER ERROR: ${text}`);
        } else {
             console.log(`BROWSER LOG: ${text}`);
        }
    });

    try {
        await page.goto('http://localhost:5182/');
        await page.waitForTimeout(2000); 
    } catch (e) {
        console.error("Script navigation error:", e);
    } finally {
        await browser.close();
    }
})();
