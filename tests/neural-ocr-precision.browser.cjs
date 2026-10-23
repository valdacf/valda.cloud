const assert = require('node:assert/strict');
const {chromium,webkit} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async () => {
 for (const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
  const browser = await engine.launch(name === 'chromium' ? {channel:'chrome'} : {});
  try {
   const page = await browser.newPage({viewport:{width:1440,height:1100},hasTouch:true});
   const errors=[]; page.on('pageerror',e=>errors.push(e.message));
   await page.goto((process.env.OCR_BASE_URL || 'http://127.0.0.1:8765')+'/games/neural-ocr.html');
   assert.equal(await page.locator('#precision').count(),1,'precision selector must exist');
   assert.equal(await page.locator('.inspector').count(),0,'duplicate inspector must be removed');
   const original=await page.locator('#scores').innerText();
   const image=()=>page.locator('#weight-map-input').evaluate(c=>c.toDataURL());
   const originalMap=await image();
   const maps=()=>page.locator('.map-block canvas').evaluateAll(cs=>cs.map(c=>c.toDataURL()));
   const originalMaps=await maps();
   const assertSelection=async neuron=>{
    for(const [id,count] of [['weight-column',24],['weight-bias-selection',34]]) {
     const marker=page.locator('#'+id);
     assert.equal(await marker.count(),1,`${id} must mark the selected neuron`);
     const box=await marker.boundingBox();
     const parent=await marker.locator('..').boundingBox();
     assert.ok(Math.abs(box.x-parent.x-parent.width*neuron/count)<1,`${id} must follow neuron ${neuron+1}`);
     assert.ok(box.width>0 && box.height>0,`${id} must be visible`);
    }
   };
   await assertSelection(0);
   await page.locator('#precision').selectOption('fp8');
   assert.match(await page.locator('#precision-note').textContent(),/FP8/);
   assert.notEqual(await image(),originalMap);
   const initialFP8=await image();
   assert.ok(Number((await page.locator('#precision-difference').textContent()).match(/: ([0-9.]+)/)[1])>0);
   assert.equal(await page.locator('#steps').textContent(),'0');
   await page.locator('#precision').selectOption('fp64');
   assert.equal(await image(),originalMap);
   assert.equal(await page.locator('#scores').innerText(),original);
   const map=page.locator('#weight-map-input');
   await map.scrollIntoViewIfNeeded(); const box=await map.boundingBox();
   await page.mouse.click(box.x+box.width*.4,box.y+box.height*(17.5/24));
   assert.equal(await page.getByRole('button',{name:'Prozkoumat neuron 18',exact:true}).getAttribute('aria-pressed'),'true');
   assert.match(await page.locator('#parameter-detail').textContent(),/Neuron 18/);
   await assertSelection(17);
   await map.focus(); await page.keyboard.press('ArrowDown');
   assert.equal(await page.getByRole('button',{name:'Prozkoumat neuron 19',exact:true}).getAttribute('aria-pressed'),'true');
   await assertSelection(18);
   await page.locator('#precision').selectOption('fp8');
   const beforeTrain=await image();
   await page.locator('#step').click();
   assert.notEqual(await image(),beforeTrain);
   (await maps()).forEach((value,i)=>assert.notEqual(value,originalMaps[i],`map ${i} must redraw after training`));
   await page.locator('#train').click(); await page.waitForTimeout(200);
   await page.locator('#precision').selectOption('fp64');
   assert.equal(await page.locator('#train').textContent(),'Pozastavit');
   await page.locator('#train').click();
   await page.locator('#precision').selectOption('fp8');
   await page.screenshot({path:`/tmp/neural-fp8-${name}.png`,fullPage:true});
   await page.setViewportSize({width:390,height:844});
   await map.scrollIntoViewIfNeeded(); const mobile=await map.boundingBox();
   await page.touchscreen.tap(mobile.x+mobile.width*.7,mobile.y+mobile.height*.3);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:`/tmp/neural-fp8-mobile-${name}.png`,fullPage:true});
   await page.locator('#reset').click();
   assert.equal(await page.locator('#precision').inputValue(),'fp8');
   assert.equal(await image(),initialFP8,'reset must invalidate the quantized snapshot');
   assert.deepEqual(errors,[]);
   console.log(name+': precision round-trip, maps, selection, live training and mobile passed');
  } finally {await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
