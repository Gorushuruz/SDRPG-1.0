/* Drives the real app in headless Chrome: navigation, the 2x2 choice layout,
   a full call, coaching, and — critically — persistence across a page refresh. */
const puppeteer = require('puppeteer');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript' };
const server = http.createServer((req,res)=>{
  let p = req.url.split('?')[0]; if (p==='/') p='/index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, {'Content-Type': MIME[path.extname(f)]||'application/octet-stream'});
  res.end(fs.readFileSync(f));
});
const PORT = 8792;
let fails = [];
const check = (n,c,x)=>{ console.log((c?'  ok   ':'  FAIL ')+n+(x!==undefined?'  ('+x+')':'')); if(!c) fails.push(n); };

(async () => {
  await new Promise(r=>server.listen(PORT,r));
  const browser = await puppeteer.launch({args:['--no-sandbox']});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: '+e.message));
  page.on('console', m => { if (m.type()==='error' && !/404/.test(m.text())) errors.push('console: '+m.text()); });

  // iPhone-ish viewport: this must be a mobile-first app
  await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
  await page.goto('http://127.0.0.1:'+PORT+'/', {waitUntil:'networkidle0'});

  check('app boots without JS errors', errors.length===0, errors.join(' | '));
  check('boot screen renders', await page.$('.boot-card') !== null);
  await page.screenshot({path:'/tmp/shot-01-boot.png'});

  // Start a new career
  await page.evaluate(()=>{ [...document.querySelectorAll('button')].find(b=>/New career/i.test(b.textContent)).click(); });
  await new Promise(r=>setTimeout(r,300));
  check('day 1 briefing shown', await page.$('.brief') !== null);
  const brief = await page.$eval('.brief', n=>n.innerText);
  check('brief references the manager question', /tell me who we are actually trying to reach/i.test(brief));
  await page.screenshot({path:'/tmp/shot-02-day1.png'});

  // Start the day
  await page.evaluate(()=>{ [...document.querySelectorAll('button')].find(b=>/Start the day/i.test(b.textContent)).click(); });
  await new Promise(r=>setTimeout(r,300));
  const prowCount = await page.$$eval('.prow', n=>n.length);
  check('prospect list populated', prowCount>0, prowCount+' prospects');
  await page.screenshot({path:'/tmp/shot-03-list.png'});

  // Open a contact
  await page.evaluate(()=>document.querySelector('.prow').click());
  await new Promise(r=>setTimeout(r,250));
  check('contact view opens', await page.$('.relrow') !== null);
  await page.screenshot({path:'/tmp/shot-04-contact.png'});
  // research then call
  const hasResearch = await page.evaluate(()=>!![...document.querySelectorAll('button')].find(b=>/Research/i.test(b.textContent)));
  if (hasResearch) { await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>/Research/i.test(b.textContent)).click()); await new Promise(r=>setTimeout(r,250)); }
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>/^Call /.test(b.textContent)).click());
  await new Promise(r=>setTimeout(r,400));

  // The call view: is the choice grid really 2x2 with large targets?
  const hasCall = await page.$('.call') !== null;
  check('call view renders', hasCall);
  if (hasCall) {
    let guard=0;
    while (guard++ < 20) {
      if (await page.$('.outcome')) break;
      if (await page.$('[data-act="vmreason"]')) { await page.evaluate(()=>document.querySelector('[data-act="vmreason"]').click()); await new Promise(r=>setTimeout(r,300)); continue; }
      if (await page.$('[data-act="advance"]')) { await page.evaluate(()=>document.querySelector('[data-act="advance"]').click()); await new Promise(r=>setTimeout(r,300)); continue; }
      if (!(await page.$('.choices'))) break;
      const box = await page.evaluate(()=>{
        const cs=[...document.querySelectorAll('.choice')];
        if(!cs.length) return null;
        const r=cs.map(c=>{const b=c.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}});
        return {n:cs.length, rects:r, labels:cs.map(c=>c.textContent.slice(0,40)),
                banned:cs.some(c=>/correct|incorrect|best|worst|wrong answer/i.test(c.textContent))};
      });
      if (box) {
        if (guard===1) {
          check('exactly 4 choices', box.n===4, box.n);
          const top=box.rects.filter(r=>r.y<300), bot=box.rects.filter(r=>r.y>=300);
          const uniqueY=[...new Set(box.rects.map(r=>r.y))].sort((a,b)=>a-b);
          check('two rows (2x2 grid)', uniqueY.length===2, 'rows at y='+uniqueY.join(','));
          check('2 on top, 2 on bottom', uniqueY.map(y=>box.rects.filter(r=>r.y===y).length).join('+')==='2+2');
          check('top-left and top-right differ in x', new Set(box.rects.filter(r=>r.y===uniqueY[0]).map(r=>r.x)).size===2);
          check('tap targets >= 44px tall', box.rects.every(r=>r.h>=44), 'min h='+Math.min(...box.rects.map(r=>r.h)));
          check('tap targets >= 140px wide', box.rects.every(r=>r.w>=140), 'min w='+Math.min(...box.rects.map(r=>r.w)));
          check('no option labelled correct/incorrect/best/worst', !box.banned);
          check('all 4 options distinct', new Set(box.labels).size===4);
          check('no horizontal overflow', await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
          await page.screenshot({path:'/tmp/shot-05-choices.png'});
        }
      }
      await page.evaluate(()=>document.querySelector('.choice').click());
      await new Promise(r=>setTimeout(r,300));
    }
    // reach the debrief
    let g2=0;
    while (await page.$('[data-act="advance"]') && g2++ < 6) {
      await page.evaluate(()=>{const b=document.querySelector('[data-act="advance"]'); if(b) b.click();});
      await new Promise(r=>setTimeout(r,350));
    }
  }

  check('coaching debrief shown', await page.$('.outcome') !== null);
  if (await page.$('.outcome')) {
    check('scorecard has 7 categories', await page.$$eval('.srow', n=>n.length)===7, await page.$$eval('.srow',n=>n.length));
    const o = await page.$eval('.outcome', n=>n.innerText);
    check('outcome stated plainly', o.length>3, o.split('\n')[0]);
    check('key lesson present', await page.$('.lessonbox') !== null);
    await page.screenshot({path:'/tmp/shot-06-coach.png', fullPage:true});
  }

  // --- persistence across refresh ---
  const before = await page.evaluate(()=>{ const s=SDRA.UI.st(); return {day:s.day, xp:s.xp, dials:s.metrics.dials, prospects:s.prospects.length}; });
  await new Promise(r=>setTimeout(r,400));
  await page.reload({waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,400));
  check('continue offered after refresh', await page.evaluate(()=>!![...document.querySelectorAll('button')].find(b=>/Continue career/i.test(b.textContent))));
  await page.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>/Continue career/i.test(b.textContent)).click();});
  await new Promise(r=>setTimeout(r,400));
  const after = await page.evaluate(()=>{ const s=SDRA.UI.st(); return {day:s.day, xp:s.xp, dials:s.metrics.dials, prospects:s.prospects.length}; });
  check('day survived refresh', before.day===after.day, before.day+' -> '+after.day);
  check('XP survived refresh', before.xp===after.xp, before.xp+' -> '+after.xp);
  check('dials survived refresh', before.dials===after.dials, before.dials+' -> '+after.dials);
  check('prospects survived refresh', before.prospects===after.prospects);
  check('no errors after full play + refresh', errors.length===0, errors.join(' | '));

  // navigation across every tab
  for (const tab of ['Accounts','Academy','You','Stats']) {
    await page.evaluate((t)=>{[...document.querySelectorAll('.tab')].find(b=>b.textContent.trim()===t).click();}, tab);
    await new Promise(r=>setTimeout(r,250));
    const ok = await page.evaluate(()=>document.querySelector('#main').innerHTML.length>200);
    check('tab renders: '+tab, ok);
  }
  await page.screenshot({path:'/tmp/shot-07-stats.png', fullPage:true});

  // Academy lessons unlock and are readable
  await page.evaluate(()=>{[...document.querySelectorAll('.tab')].find(b=>b.textContent.trim()==='Academy').click();});
  await new Promise(r=>setTimeout(r,250));
  const lessonCount = await page.$$eval('.lesson', n=>n.length);
  check('curriculum lessons listed', lessonCount>=20, lessonCount+' (20 + 1 knowledge-database link)');
  const locked = await page.$$eval('.lesson.locked', n=>n.length);
  check('later lessons locked at start', locked>0, locked+' locked');
  await page.evaluate(()=>document.querySelector('.lesson:not(.locked)').click());
  await new Promise(r=>setTimeout(r,250));
  check('lesson body renders', (await page.$eval('.prose', n=>n.innerText)).length>200);
  await page.screenshot({path:'/tmp/shot-08-academy.png', fullPage:true});

  // Reset must require confirmation
  // reset safety: it must refuse to wipe a career without confirmation
  await page.evaluate(()=>SDRA.UI.setView('settings'));
  await new Promise(r=>setTimeout(r,250));
  const savedDay = await page.evaluate(()=>SDRA.UI.st().day);
  const savedXp = await page.evaluate(()=>SDRA.UI.st().xp);
  let dialogs = 0;
  page.on('dialog', async d => { dialogs++; await d.dismiss(); });
  await page.evaluate(()=>{ [...document.querySelectorAll('button')].find(b=>/Reset career/i.test(b.textContent))?.click(); });
  await new Promise(r=>setTimeout(r,600));
  check('reset asks for confirmation', dialogs>=1, dialogs+' dialog(s) seen');
  check('declining reset preserved the career',
    await page.evaluate(()=>SDRA.UI.st().day)===savedDay && await page.evaluate(()=>SDRA.UI.st().xp)===savedXp);
  check('no JS errors at end', errors.length===0, errors.slice(0,3).join(' | '));

  await browser.close(); server.close();
  console.log('\n'+(fails.length? fails.length+' UI FAILURES: '+fails.join(', ') : 'ALL UI CHECKS PASSED'));
  process.exit(fails.length?1:0);
})();
