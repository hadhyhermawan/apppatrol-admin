const { chromium } = require('playwright');
(async () => {
    let consoleLogs = [];
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    page.on('pageerror', error => {
        consoleLogs.push(`[PAGEERROR] ${error.message} - ${error.stack}`);
    });
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleLogs.push(`[CONSOLE ERROR] ${msg.text()}`);
        }
    });

    try {
        console.log("Going to safety...");
        await page.goto('http://127.0.0.1:3010/security/safety');
        await page.waitForTimeout(4000);
        
        const bodyText = await page.innerText('body');
        if (bodyText.includes('Application error')) {
            console.log("Found Application error in body!");
        } else {
            console.log("No application error found in body.");
        }
        
        console.log("----- CONSOLE LOGS -----");
        consoleLogs.forEach(l => console.log(l));
        
    } catch(e) {
        console.error("Test failed: ", e);
    }
    await browser.close();
})();
