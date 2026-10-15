const assert = require('node:assert/strict');
const playwright = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const baseURL = process.env.OCR_BASE_URL || 'http://127.0.0.1:8765';

(async () => {
  for (const engine of ['chromium', 'webkit']) {
    const browser = await playwright[engine].launch(engine === 'chromium' ? {channel: 'chrome'} : {});
    try {
      const page = await browser.newPage({hasTouch: true});
      await page.goto(`${baseURL}/games/neural-ocr.html`);
      const button = page.locator('#train');
      async function checkPaused() {
        assert.equal(await button.textContent(), 'Nauč se', `${engine}: pause must stop training`);
        const count = await page.locator('#steps').textContent();
        await page.waitForTimeout(250);
        assert.equal(await page.locator('#steps').textContent(), count, `${engine}: paused counter must stay fixed`);
      }
      await button.click();
      await page.waitForFunction(() => Number(document.querySelector('#steps').textContent) >= 20);
      const box = await button.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(200);
      await page.mouse.up();
      await checkPaused();
      await button.click();
      await button.focus();
      await page.keyboard.down('Space');
      await page.waitForTimeout(200);
      await page.keyboard.up('Space');
      await checkPaused();
      await button.tap();
      await page.waitForTimeout(100);
      await button.tap();
      await checkPaused();
      console.log(`${engine}: pause and resume passed for mouse, keyboard, and touch`);
    } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
