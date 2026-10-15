const assert = require('node:assert/strict');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async () => {
 for (const [name, engine] of [['chromium',chromium], ['webkit',webkit]]) {
  const browser = await engine.launch(name === 'chromium' ? {channel:'chrome'} : {});
  try {
   const page = await browser.newPage({viewport:{width:1440,height:1100},hasTouch:true});
   await page.goto((process.env.OCR_BASE_URL || 'http://127.0.0.1:8765')+'/games/neural-ocr.html');
   const neuron = page.getByRole('button',{name:'Prozkoumat neuron 18',exact:true});
   assert.equal(await neuron.count(),1,'neurons must support direct selection');
   await neuron.click();
   assert.match(await page.locator('#map-selection').textContent(),/18$/);
   assert.equal(await neuron.getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:'Prozkoumat neuron 4',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Prozkoumat neuron 4',exact:true}).getAttribute('aria-pressed'),'true');
   await neuron.focus(); await page.keyboard.press('Enter');
   assert.match(await page.locator('#map-selection').textContent(),/18$/);
   await page.locator('#train').click(); await page.waitForTimeout(150);
   await neuron.click();
   assert.match(await page.locator('#map-selection').textContent(),/18$/);
   await page.locator('#train').click();
   await page.screenshot({path:`/tmp/neural-iso-${name}.png`,fullPage:true});
   await page.setViewportSize({width:390,height:844});
   await page.getByRole('button',{name:'Prozkoumat neuron 24',exact:true}).tap();
   assert.match(await page.locator('#map-selection').textContent(),/24$/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:`/tmp/neural-iso-mobile-${name}.png`,fullPage:true});
   console.log(name+': neuron selection, keyboard, live training, and mobile passed');
  } finally {await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
