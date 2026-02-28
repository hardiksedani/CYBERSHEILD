const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('PAGE ERROR LOG:', msg.text());
            }
        });
        page.on('pageerror', error => console.log('PAGE FATAL UNCAUGHT ERROR:', error.message));

        console.log('Navigating to localhost:5173...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });

        // Wait a brief moment to catch any async render errors
        await new Promise(r => setTimeout(r, 1000));

        await browser.close();
        console.log('Done scanning for errors.');
        process.exit(0);
    } catch (err) {
        console.error('Puppeteer script error:', err);
        process.exit(1);
    }
})();
