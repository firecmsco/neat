const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({
        args: [
            '--use-gl=angle',
            '--use-angle=gl'
        ]
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

    const htmlContent = fs.readFileSync('minimal_gl.html', 'utf8');

    await page.setContent(htmlContent);

    await page.waitForTimeout(2000);
    await browser.close();
})();
