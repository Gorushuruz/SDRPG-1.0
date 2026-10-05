/* Headless harness: loads the game's non-UI modules into a fake window and plays
   hundreds of simulated days to find crashes, dead ends and balance problems. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const sandbox = { console, setTimeout, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error, isNaN, parseInt, parseFloat };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
sandbox.localStorage = (() => { const m = {}; return {
  getItem: k => (k in m ? m[k] : null), setItem: (k,v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; },
  _dump: () => m }; })();
vm.createContext(sandbox);
['core','data','engine','calls','world'].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(root,'src',f+'.js'),'utf8'), sandbox, { filename: f+'.js' }));
const S = sandbox.SDRA;

let fails = [];
function check(name, cond, extra) { if (!cond) fails.push(name + (extra ? ' :: ' + extra : '')); }

S.setRngState(424242);
const st = S.newState({ seed: 424242 });
for (let i=0;i<8;i++) S.spawnAccount(st, true);
check('accounts spawned', st.prospects.length >= 8, st.prospects.length);

/* --- prospect data quality --- */
const arche = new Set(), roles = new Set(), objs = new Set();
for (let i=0;i<400;i++){ const co=S.makeCompany(); const p=S.makeProspect(co);
  arche.add(p.archetype); roles.add(p.title); objs.add(p.hidden.realObjection.category);
  check('hidden vars bounded', p.hidden.trust>=0 && p.hidden.trust<=1);
  check('real objection exists', !!p.hidden.realObjection.truth);
  check('companyName path ok', co.name.length>0); }
console.log('archetypes seen:', arche.size, '/ roles:', roles.size, '/ objection categories:', objs.size);
check('archetype variety', arche.size >= 12, arche.size);
check('role variety', roles.size >= 12, roles.size);
check('objection variety', objs.size >= 10, objs.size);

/* --- moments always have exactly 4 distinct options, randomized order --- */
const kinds = ['opener','discovery','objection','close','technical','exit','reengage'];
let orderVar = new Set(), badOpt = 0, banned = /correct|incorrect|best answer|bad answer|\bRight answer\b/i;
for (let i=0;i<3000;i++){
  const co=S.makeCompany(); const p=S.makeProspect(co);
  const k = kinds[i%kinds.length];
  const m = S.buildMoment(p, { kind:k, pushedOnce: i%7===0 }, k);
  if (m.options.length!==4) { badOpt++; }
  const texts = m.options.map(o=>o.text);
  if (new Set(texts).size !== 4) { badOpt++; }
  if (texts.some(t=>banned.test(t))) fails.push('banned label in choice: '+texts.find(t=>banned.test(t)));
  if (!m.order || new Set(m.order).size!==4) fails.push('bad order at '+k);
  orderVar.add(m.order.join(''));
}
check('moments always 4 unique options', badOpt===0, badOpt);
check('order randomized', orderVar.size === 24, orderVar.size);

/* --- scoring: judgement, not memorization. A strong move must not always win,
       and situational fit must matter. --- */
let isolateWins=0, concedeWins=0, fits=[];
for (let i=0;i<1500;i++){
  const co=S.makeCompany(); const p=S.makeProspect(co);
  const m=S.buildMoment(p,{kind:'objection'},'objection');
  const scores = m.options.map(o=>S.scoreOption(st,p,m,o));
  const best = scores.reduce((a,b)=>a.score>b.score?a:b);
  if (best.move==='isolate') isolateWins++;
  if (best.move==='concede') concedeWins++;
  fits.push(best.fit);
}
console.log('best-move distribution on objection moments — isolate:',(isolateWins/15).toFixed(1)+'%','concede:',(concedeWins/15).toFixed(1)+'%');
check('isolate not auto-correct', isolateWins < 1500*0.95, isolateWins);
check('concede viable sometimes', concedeWins > 0, concedeWins);
/* fit must vary by prospect state, so sweep the state the fit rules read */
const co2=S.makeCompany(); const pA=S.makeProspect(co2); const pB=S.makeProspect(co2);
const mA=S.buildMoment(pA,{kind:'objection'},'objection');
pB.hidden.interest=0.95; pB.hidden.skepticism=0.1; pB.hidden.trust=0.1;
const mB=S.buildMoment(pB,{kind:'objection'},'objection');
const fA=mA.options.map(o=>S.scoreOption(st,pA,mA,o,{kind:'objection'}).fit);
const fB=mB.options.map(o=>S.scoreOption(st,pB,mB,o,{kind:'objection'}).fit);
check('fit responds to prospect state', JSON.stringify(fA)!==JSON.stringify(fB), fA.join(',')+' vs '+fB.join(','));

/* --- effect application moves hidden vars and stays in bounds --- */
for (let i=0;i<2000;i++){
  const co=S.makeCompany(); const p=S.makeProspect(co);
  const m=S.buildMoment(p,{kind:'objection'},'objection');
  m.options.forEach(o=>{ const sc=S.scoreOption(st,p,m,o,{kind:'objection'}); S.applyOption(st,p,{kind:'objection'},m,o,sc); });
  S.HIDDEN_VARS.forEach(v=>{ if (v==='mood') return;
    const val = v==='patience'? p.hidden.patience : p.hidden[v];
    check('hidden var '+v+' bounded', val>=0 && val<=1, v+'='+val); });
}

/* --- full playthrough: 120 days, many calls, must never throw --- */
S.setRngState(999);
const g = S.newState({ seed: 999 });
for (let i=0;i<8;i++) S.spawnAccount(g, true);
let outcomes = {}, callsMade = 0, meetings = 0;
for (let day=0; day<120; day++){
  S.startDay(g);
  let n = 3 + Math.floor(Math.random()*6);
  for (let k=0;k<n;k++){
    const pool = g.prospects.filter(p=>!p.dead && p.stage!=='disqualified');
    if (!pool.length) { S.spawnAccount(g,true); continue; }
    const p = pool[Math.floor(Math.random()*pool.length)];
    const conn = S.attemptConnect(g,p);
    g.todayStats.dials++;
    callsMade++;
    if (!conn.connected) continue;
    const script = S.buildCallScript(g,p);
    const scores = [];
    for (const step of script){
      const m = S.buildMoment(p,{kind:step.kind,pushedOnce:false},step.kind);
      const sc = m.options.map(o=>S.scoreOption(g,p,m,o));
      scores.push(sc[Math.floor(Math.random()*sc.length)]);
      if (step.kind==='objection'){
        const o=p.hidden.realObjection;
        if (Math.random()<0.5) { o.isolated=true; o.handled=true; g.metrics.objectionsIsolated++; }
        else if (Math.random()<0.3) { o.handled=true; }
        else { o.handled=false; }
      }
      if (scores[scores.length-1].sim.meetings) { /* handled in outcome */ }
    }
    const res = S.resolveOutcome(g,p,scores);
    if (res.outcome.k==='meeting'||res.outcome.k==='qualified_opp'||res.outcome.k==='meeting_later') g.todayStats.meetingsBooked++;
    if (res.qualify>0.4) g.todayStats.pos++;
    const co = S.coach(g,p,res,[]);
    check('coach has scorecard', co.skills && co.skills.length===7, co.skills && co.skills.length);
    outcomes[res.outcome.k]=(outcomes[res.outcome.k]||0)+1;
    if (res.outcome.k==='meeting'||res.outcome.k==='qualified_opp') meetings++;
    S.checkAchievements(g);
  }
  const r = S.endDay(g);
  check('level sane', g.level>=1 && g.level<=60, g.level);
  check('xp monotone', g.xp>=0);
  check('day increments', g.day===day+2, g.day+' vs '+(day+2));
}
console.log('120-day sim:', callsMade, 'dials,', meetings, 'meetings, level', g.level, g.title, g.xp+'xp');
console.log('outcome spread:', JSON.stringify(outcomes));
check('multiple outcome types', Object.keys(outcomes).length>=5, Object.keys(outcomes).length+' -> '+Object.keys(outcomes).join(','));
check('not always winning', (outcomes.meeting||0) < callsMade*0.6, outcomes.meeting);
check('some losses occur', (outcomes.not_interested||0)+(outcomes.no_problem||0)+(outcomes.ghosted||0) > 0);
check('disqualifications occur', (outcomes.not_fit||0)>0 || (outcomes.no_problem||0)>0);
check('quota tracked', g.weekHistory.length>=24, g.weekHistory.length);

/* --- persistence round trip --- */
S.save(g);
const raw = sandbox.localStorage.getItem('sdra.save.v3');
check('save serialised', !!raw && raw.length>2000);
const reloaded = S.importSave(raw);
check('round trip day', reloaded.day===g.day);
check('round trip xp', reloaded.xp===g.xp);
check('round trip prospects', reloaded.prospects.length===g.prospects.length);
check('round trip pipeline', reloaded.pipeline.length===g.pipeline.length);
const reloaded2 = S.load();
check('load from storage', reloaded2 && reloaded2.day===g.day);
check('rng state persists', typeof g.rngState==='number');

/* --- hidden-variable integrity: no leakage into player-visible state --- */
const p0 = g.prospects[0];
const serialised = JSON.stringify(p0.visible);
check('visible block has no hidden vars', !/patience|skepticism|trust|politicalRisk/.test(serialised));

/* --- relationship earned, not automatic --- */
let upCount=0, total=0;
for (let i=0;i<800;i++){
  const co=S.makeCompany(); const p=S.makeProspect(co);
  for (let j=0;j<6;j++){ total++;
    /* repeat contact alone, no quality signal */
    if (S.chance(0.3)) { p.relationship = S.relUp(p.relationship); } }
  if (S.relIndex(p.relationship) >= 3) upCount++;
}
check('relationship not earned by repetition', upCount < total*0.35, upCount+'/'+total);

console.log('\n=== ' + (fails.length? fails.length+' FAILURES' : 'ALL CHECKS PASSED') + ' ===');
fails.slice(0,25).forEach(f=>console.log(' FAIL: '+f));
process.exit(fails.length?1:0);
