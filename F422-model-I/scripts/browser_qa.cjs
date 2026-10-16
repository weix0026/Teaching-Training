const {chromium}=require('../../.venv/Lib/site-packages/playwright/driver/package');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'research/qa');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1050},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'index.html')).href);
 await page.screenshot({path:path.join(out,'desktop-concept.png'),fullPage:true});
 for(const dataset of ['bridge','homework']){
  await page.locator('#dataset').selectOption(dataset);
  for(const route of ['concept','prescriptions','formulation','allocation','practice','materials']){
   await page.locator(`.nav-item[href="#${route}"]`).click();
   assert.equal(await page.locator('h1').count(),1);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),dataset+'/'+route+' desktop overflow');
  }
 }
 await page.locator('.nav-item[href="#prescriptions"]').click();
 await page.locator('#prescription').selectOption('2');
 assert((await page.locator('.coefficient').innerText()).includes('$500'));
 await page.screenshot({path:path.join(out,'desktop-prescription.png'),fullPage:true});
 await page.locator('#unit').selectOption('1');
 await page.locator('[data-toggle="0"]').click();
 assert((await page.locator('[role="status"]').innerText()).includes('Not a feasible'));
 await page.locator('.nav-item[href="#allocation"]').click();
 await page.locator('#solve').click();
 assert((await page.locator('#results').innerText()).includes('Optimal LP solution'));
 assert((await page.locator('#results').innerText()).includes('1,891,448.37'));
 await page.screenshot({path:path.join(out,'desktop-solve.png'),fullPage:true});
 await page.locator('#flow').selectOption('equal');await page.locator('#solve').click();
 assert((await page.locator('#results').innerText()).includes('797,727.27'));
 await page.locator('#useH0').check();await page.locator('#h0').fill('1000000');await page.locator('#h0').press('Tab');await page.locator('#solve').click();
 assert((await page.locator('#results').innerText()).includes('No feasible solution'));
 await page.locator('#useH0').uncheck();await page.locator('#flow').selectOption('nondeclining');await page.locator('#solve').click();
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#downloadPlan').click()]);
 await download.saveAs(path.join(out,'allocation-download.csv'));
 assert(fs.readFileSync(path.join(out,'allocation-download.csv'),'utf8').includes('Optimal'));
 await page.locator('[data-allocation]').first().fill('-1');await page.locator('[data-allocation]').first().press('Tab');
 assert.equal(await page.locator('input:invalid').count(),1);
 await page.locator('[data-allocation]').first().fill('0');await page.locator('[data-allocation]').first().press('Tab');
 await page.locator('.nav-item[href="#practice"]').click();
 await page.locator('[data-question="0"][data-answer="0"]').click();assert((await page.locator('#feedback0').innerText()).startsWith('Try again'));
 await page.locator('[data-question="0"][data-answer="1"]').click();assert((await page.locator('#feedback0').innerText()).startsWith('Correct'));
 await page.locator('#coefficientAnswer').fill('500');await page.locator('#checkCoefficient').click();assert((await page.locator('#coefficientFeedback').innerText()).startsWith('Correct'));
 await page.locator('.nav-item[href="#materials"]').click();
 for(const href of await page.locator('a[download]').evaluateAll(a=>a.map(x=>x.getAttribute('href'))))assert(fs.existsSync(path.join(root,decodeURIComponent(href))));
 await page.setViewportSize({width:390,height:844});
 for(const dataset of ['bridge','homework']){
  await page.locator('#dataset').selectOption(dataset);
  for(const route of ['concept','prescriptions','formulation','allocation','practice','materials']){
   await page.locator(`.nav-item[href="#${route}"]`).click();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),dataset+'/'+route+' mobile overflow');
  }
 }
 await page.locator('.nav-item[href="#allocation"]').click();await page.locator('#solve').click();
 await page.screenshot({path:path.join(out,'mobile-solve.png'),fullPage:true});
 await page.locator('.nav-item[href="#prescriptions"]').click();await page.locator('#prescription').selectOption('2');
 await page.screenshot({path:path.join(out,'mobile-prescription.png'),fullPage:true});
 assert.deepEqual(errors,[]);
 await browser.close();console.log('Browser QA passed: 24 responsive route checks, prescription feasibility, solver, infeasible policy, input validation, downloads, quizzes and local resource links.');
})().catch(e=>{console.error(e);process.exit(1);});
