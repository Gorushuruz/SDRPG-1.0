/* Does good sales behaviour actually produce better outcomes? The brief's central
   requirement: over a large sample, skilled play must beat random play — while a
   great SDR still loses, and a mediocre one still gets lucky. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const sb={console,Math,Date,JSON,Object,Array,String,Number,Boolean,RegExp,Error,isNaN,parseInt,parseFloat};
sb.window=sb;sb.globalThis=sb;
sb.localStorage={m:{},getItem(k){return this.m[k]||null},setItem(k,v){this.m[k]=v},removeItem(k){delete this.m[k]}};
vm.createContext(sb);
['core','data','engine','calls','world'].forEach(f=>vm.runInContext(fs.readFileSync('src/'+f+'.js','utf8'),sb,{filename:f}));
const S=sb.SDRA;

function play(mode, seed, days){
  S.setRngState(seed);
  const g=S.newState({seed});
  for(let i=0;i<8;i++) S.spawnAccount(g,true);
  const o={dials:0,connects:0,convos:0,meetings:0,qm:0,pipeline:0,dq:0,ghost:0,burn:0,opp:0};
  for(let d=0;d<days;d++){
    S.startDay(g);
    for(let k=0;k<14;k++){
      const pool=g.prospects.filter(p=>!p.dead&&p.stage!=='disqualified');
      if(!pool.length){S.spawnAccount(g,true);continue;}
      const p=pool[Math.floor(S.rnd()*pool.length)];
      const c=S.attemptConnect(g,p); o.dials++;
      if(!c.connected) continue; o.connects++;
      const script=S.buildCallScript(g,p);
      const scores=[];
      for(const step of script){
        const m=S.buildMoment(p,{kind:step.kind,pushedOnce:false},step.kind);
        const ctx={kind:step.kind};
        const scored=m.options.map(o2=>S.scoreOption(g,p,m,o2,ctx));
        let pick;
        if(mode==='skilled') pick=scored.reduce((a,b)=>a.score>b.score?a:b);
        else if(mode==='blunder') pick=scored.reduce((a,b)=>a.score<b.score?a:b);
        else pick=scored[Math.floor(S.rnd()*scored.length)];
        S.applyOption(g,p,ctx,m,m.options[pick.moveIdx||0],pick);
        if(step.kind==='objection'){
          const ob=p.hidden.realObjection;
          if(pick.move==='isolate'){ob.isolated=true;ob.handled=true;g.metrics.objectionsIsolated++;}
          else if(pick.move==='concede'&&ob.category==='timing'){ob.handled=true;}
          else if((pick.move==='reframe'||pick.move==='label')&&p.hidden.trust>0.5){ob.handled=true;}
          else ob.handled=false;
        }
        scores.push(pick);
      }
      o.convos++;
      const res=S.resolveOutcome(g,p,scores);
      const k2=res.outcome.k;
      if(k2==='meeting'||k2==='qualified_opp'){o.meetings++;o.pipeline+=p.dealValue||0;}
      if(k2==='qualified_opp'||p.stage==='opp')o.opp++;
      if(k2==='not_fit'||k2==='no_problem')o.dq++;
      if(k2==='ghosted')o.ghost++;
      if(k2==='burned')o.burn++;
      if(res.qualify>0.55)o.qm++;
      S.checkAchievements(g);
    }
    S.endDay(g);
  }
  return o;
}
const days=90;
for(const mode of ['skilled','random','blunder']){
  let agg={dials:0,connects:0,convos:0,meetings:0,qm:0,pipeline:0,dq:0,ghost:0,burn:0,opp:0};
  const seeds=[11,22,33,44,55,66];
  for(const s of seeds){const r=play(mode,s,days);for(const k in agg)agg[k]+=r[k];}
  const pct=(a,b)=>b?(a/b*100).toFixed(1)+'%':'0%';
  console.log(mode.padEnd(8),
    'dials',String(agg.dials).padStart(4),
    'conn',pct(agg.connects,agg.dials).padStart(6),
    'convo',pct(agg.convos,agg.connects).padStart(6),
    'MEET',String(agg.meetings).padStart(4),
    '('+pct(agg.meetings,agg.connects).padStart(6)+' of connects)',
    'qualOpps',String(agg.opp).padStart(4),
    'pipeline',(agg.pipeline/1000).toFixed(0)+'k',
    'DQ',String(agg.dq).padStart(3),
    'ghost',String(agg.ghost).padStart(3));
}
