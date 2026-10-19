const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:5173/registry');
  
  // Wait for the delete button
  try {
    await page.waitForSelector('button.bg-red-50.text-red-600', {timeout: 5000});
    await page.click('button.bg-red-50.text-red-600');
    // Wait a bit to let the dialog render
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
    console.log('Error clicking button:', e);
  }
  
  await browser.close();
})();
