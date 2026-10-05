/* Simulates a competent player over a full career using the same scoring the UI uses,
   and verifies the outcome curve the brief demands: skilled play wins more, but loses too. */
const fs=require('fs'),vm=require('vm');
const sb={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Error,isNaN,parseInt,parseFloat};
sb.window=sb;sb.globalThis=sb;
sb.localStorage={m:{},getItem(k){return this.m[k]||null},setItem(k,v){this.m[k]=v},removeItem(k){delete this.m[k]}};
vm.createContext(sb);
['core','data','engine','calls','world'].forEach(f=>vm.runInContext(fs.readFileSync('src/'+f+'.js','utf8'),sb,{filename:f}));
const S=sb.SDRA;
S.setRngState(31337);
const g=S.newState({seed:31337});
for(let i=0;i<8;i++)S.spawnAccount(g,true);
let dials=0,meets=0,qm=0,burn=0,dq=0,opp=0,bestCounts={},turns=0;
const WEEKS=30;
for(let day=0;day<WEEKS*5;day++){
  S.startDay(g);
  const budget = 12 + Math.min(16, g.level);
  for(let k=0;k<budget;k++){
    const pool=g.prospects.filter(p=>!p.dead&&p.stage!=='disqualified');
    if(!pool.length){S.spawnAccount(g,true);continue;}
    // prioritise like the UI does
    pool.sort((a,b)=>(a.stage==='touched'?0:1)-(b.stage==='touched'?0:1));
    const p=pool[Math.floor(S.rnd()*pool.length)];
    // research before important outreach
    if(S.rnd()<0.35 && !p.researched){p.researched=true;S.applyOption(g,p,{kind:'opener'},{},{},S.scoreOption(g,p,{},{move:'permission',eff:{}}));}
    const c=S.attemptConnect(g,p); g.todayStats.dials++; dials++;
    if(!c.connected)continue;
    const script=S.buildCallScript(g,p);
    const scores=[]; turns+=script.length;
    for(const step of script){
      const ctx={kind:step.kind};
      const m=S.buildMoment(p,ctx,step.kind);
      const scored=m.options.map(o=>S.scoreOption(g,p,m,o,ctx));
      // a good player picks well but not perfectly: 85% best, 15% second-best
      const sorted=scored.slice().sort((a,b)=>b.score-a.score);
      const pick = S.chance(0.85)?sorted[0]:sorted[1];
      bestCounts[pick.move]=(bestCounts[pick.move]||0)+1;
      S.applyOption(g,p,ctx,m,m.options[0],pick);
      if(step.kind==='objection'){const ob=p.hidden.realObjection;
        if(pick.move==='isolate'){ob.isolated=true;ob.handled=true;g.metrics.objectionsIsolated++;}
        else if(pick.move==='concede'&&ob.category==='timing'){ob.handled=true;}
        else if((pick.move==='reframe'||pick.move==='label')&&p.hidden.trust>0.55){ob.handled=true;}
        else ob.handled=false;}
      scores.push(pick);
    }
    const res=S.resolveOutcome(g,p,scores);
    if(res.qualify>0.4)g.todayStats.pos++;
    if(['meeting','qualified_opp','meeting_later'].includes(res.outcome.k)){g.todayStats.meetingsBooked++;meets++;}
    if(res.qualify>0.55)qm++;
    if(['burned','ghosted'].includes(res.outcome.k))burn++;
    if(['not_fit','no_problem'].includes(res.outcome.k))dq++;
    if(p.stage==='opp')opp++;
    S.checkAchievements(g);
  }
  const r=S.endDay(g);
}
const pct=(a,b)=>b?(a/b*100).toFixed(1)+'%':'-';
console.log('--- 30-week skilled career ---');
console.log('final: L'+g.level, g.title, g.xp+'xp', 'day '+g.day, 'week '+g.week);
console.log('dials', dials, '| connect', pct(g.metrics.connects,dials), '| meetings', meets, '('+pct(meets,dials)+' of dials)');
console.log('qualified', qm, '| opps', opp, '| pipeline $'+(g.metrics.pipelineCreated/1000).toFixed(0)+'k');
console.log('honest DQs', g.metrics.honestDQ, '| burned/ghosted', burn);
console.log('avg conversation turns', (turns/dials).toFixed(2));
console.log('quotas hit', g.quotaMet, '/ missed', g.quotaMissed, '| streak', g.streak);
console.log('achievements', g.achievements.length+'/'+S.ACHIEVEMENTS.length);
console.log('lessons unlocked', g.lessonsUnlocked.length+'/'+S.LESSONS.length);
console.log('\nchoice mix:');
Object.entries(bestCounts).sort((a,b)=>b[1]-a[1]).forEach(([m,c])=>
  console.log('  '+m.padEnd(18), (c/turns*100).toFixed(1)+'%'));
