/* SDR Academy — core namespace, RNG, state, save/load. Classic script so file:// works. */
(function () {
  var root = (typeof window !== 'undefined') ? window : globalThis;
  var S = root.SDRA = root.SDRA || {};

  /* ---------- RNG (seeded, persisted) ---------- */
  S.mulberry = function (a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  var rngState = 12345;
  S.rng = S.mulberry(rngState);
  S.rngStateOf = function () { return rngState; };
  S.setRngState = function (s) { rngState = s | 0; S.rng = S.mulberry(rngState); };
  S.rnd = function () { return S.rng(); };
  S.rint = function (min, max) { return min + Math.floor(S.rng() * (max - min + 1)); };
  S.pick = function (arr) { return arr[Math.floor(S.rng() * arr.length)]; };
  S.pickN = function (arr, n) {
    var c = arr.slice(), o = [];
    n = Math.min(n, c.length);
    for (var i = 0; i < n; i++) o.push(c.splice(Math.floor(S.rng() * c.length), 1)[0]);
    return o;
  };
  S.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(S.rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  S.chance = function (base, mods) {
    var p = base;
    if (mods) for (var i = 0; i < mods.length; i++) p += mods[i];
    p = Math.max(0.02, Math.min(0.97, p));
    return S.rng() < p;
  };
  S.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  S.now = function () { return new Date().toISOString(); };

  /* ---------- Skills ---------- */
  S.SKILLS = ['prospecting','research','businessAcumen','communication','confidence','empathy',
    'curiosity','discovery','qualification','objectionHandling','callControl','valueArticulation',
    'productKnowledge','technicalFluency','writing','followUp','resilience','strategicThinking',
    'listening','professionalism','ethicalJudgment'];
  S.SKILL_LABEL = { prospecting:'Prospecting', research:'Research', businessAcumen:'Business Acumen',
    communication:'Communication', confidence:'Confidence', empathy:'Empathy', curiosity:'Curiosity',
    discovery:'Discovery', qualification:'Qualification', objectionHandling:'Objection Handling',
    callControl:'Call Control', valueArticulation:'Value Articulation', productKnowledge:'Product Knowledge',
    technicalFluency:'Technical Fluency', writing:'Writing', followUp:'Follow-Up', resilience:'Resilience',
    strategicThinking:'Strategic Thinking', listening:'Listening', professionalism:'Professionalism',
    ethicalJudgment:'Ethical Judgment' };

  S.TITLES = [ {xp:0,title:'SDR Trainee'},{xp:120,title:'SDR Apprentice'},{xp:320,title:'Junior SDR'},
    {xp:700,title:'SDR'},{xp:1300,title:'High-Performing SDR'},{xp:2200,title:'Senior SDR'},
    {xp:3600,title:'Strategic SDR'},{xp:5600,title:'Enterprise SDR'} ];
  S.titleFor = function (xp) {
    var t = S.TITLES[0].title;
    for (var i=0;i<S.TITLES.length;i++) if (xp >= S.TITLES[i].xp) t = S.TITLES[i].title;
    return t;
  };
  S.weeklyTarget = function (level) { return Math.round(28 + level * 5.5); };

  /* ---------- New career ---------- */
  S.newState = function (opts) {
    opts = opts || {};
    var seed = (opts.seed || (Date.now() & 0x7fffffff)) | 0;
    var skills = {};
    S.SKILLS.forEach(function (k) { skills[k] = 1; });
    skills.listening = 2; skills.empathy = 2; skills.curiosity = 2;
    return {
      version: 3, seed: seed, rngState: seed, createdAt: S.now(),
      name: 'Trainee', xp: 0, level: 1, title: 'SDR Trainee',
      quotaMet: 0, quotaMissed: 0, streak: 0,
      day: 1, week: 1, chapter: 1,
      energy: 100, energyMax: 100, focus: 100, focusMax: 100, morale: 60, moraleMax: 100,
      skills: skills,
      habits: { rushToPitch:0, asksQuestions:0, pitchesEarly:0, interrupts:0, talksTooMuch:0,
        pushesObjections:0, probesObjections:0, asksForMeeting:0, asksBadTime:0, respectsTime:0,
        scripts:0, personalizes:0, handlesRejection:0, qualifiesEarly:0, missesCues:0, overexplains:0 },
      accounts: [], prospects: [], pipeline: [], tasks: [],
      journal: [], lessonsUnlocked: [], trainingDone: {},
      achievements: [], certs: [],
      metrics: { dials:0, connects:0, convos:0, posConvos:0, emails:0, replies:0, posReplies:0,
        meetingsBooked:0, meetingsHeld:0, qm:0, disqualified:0, pipelineCreated:0, followUpsDone:0,
        tasksDone:0, daysWon:0, daysLost:0, honestDQ:0, multiAccounts:0, champions:0, execConvos:0,
        objectionsIsolated:0, reengaged:0 },
      weekHistory: [], today: null, inbox: [],
      flags: { careerModeUnlocked:false, academy:true, expert:false, hints:true },
      todayStats: null, lastScorecard: null, seenRecurring: {}
    };
  };

  /* ---------- Save / load ---------- */
  var KEY = 'sdra.save.v3';
  S.save = function (st) {
    st.rngState = S.rngStateOf();
    var json = JSON.stringify(st), ok = false;
    try { localStorage.setItem(KEY, json); ok = true; } catch (e) { ok = false; }
    if (!ok && root.indexedDB) {
      try {
        var rq = indexedDB.open('sdra', 1);
        rq.onupgradeneeded = function (e) { e.target.result.createObjectStore('kv'); };
        rq.onsuccess = function (e) {
          var db = e.target.result;
          db.transaction('kv','readwrite').objectStore('kv').put(json, KEY);
        };
      } catch (e2) {}
    }
    return ok;
  };
  S.load = function () {
    var json = null;
    try { json = localStorage.getItem(KEY); } catch (e) {}
    if (!json) return null;
    try { return JSON.parse(json); } catch (e) { return null; }
  };
  S.exportSave = function (st) { return JSON.stringify(st); };
  S.importSave = function (txt) {
    var o = JSON.parse(txt);
    if (!o || typeof o.xp !== 'number' || !o.skills) throw new Error('Not a valid SDR Academy save');
    return o;
  };
  S.clearSave = function () { try { localStorage.removeItem(KEY); } catch (e) {} };

  /* ---------- XP ---------- */
  S.levelFor = function (xp) {
    var lv = 1, need = 100, acc = 0;
    while (xp >= acc + need && lv < 60) { acc += need; lv++; need = Math.round(need*1.14); }
    return lv;
  };
  S.addJournal = function (st, text, kind, tags) {
    st.journal.unshift({ day: st.day, week: st.week, text: text, kind: kind||'note', tags: tags||[], at: S.now() });
    if (st.journal.length > 400) st.journal.length = 400;
  };
  S.awardXp = function (st, amount) {
    var before = S.levelFor(st.xp);
    st.xp += amount;
    st.level = S.levelFor(st.xp);
    var t = S.titleFor(st.xp), promoted = false;
    if (t !== st.title) { st.title = t; promoted = true; }
    if (amount > 0) S.addJournal(st, '+' + amount + ' XP.', 'xp');
    return { leveled: st.level > before, promoted: promoted, title: st.title, level: st.level };
  };
  S.bump = function (skill, amt) {
    var lv = S.clamp(skill + amt, 1, 20);
    return { skill: skill, delta: lv - skill, now: lv };
  };

  /* ---------- Achievements ---------- */
  S.ACHIEVEMENTS = [
    { id:'first_call', name:'First Dial', desc:'Make your first call attempt.', test:function(s){return s.metrics.dials>=1;} },
    { id:'first_rejection', name:'First "No"', desc:'Take a few hits before your first yes.', test:function(s){return s.metrics.connects>=3 && (s.metrics.connects-s.metrics.posConvos)>=3;} },
    { id:'first_meeting', name:'On The Calendar', desc:'Book your first meeting.', test:function(s){return s.metrics.meetingsBooked>=1;} },
    { id:'first_qm', name:'Actually Qualified', desc:'Book a meeting that passes qualification.', test:function(s){return s.metrics.qm>=1;} },
    { id:'first_dq', name:'Good Disqualifier', desc:'Correctly qualify an account OUT of your funnel.', test:function(s){return s.metrics.honestDQ>=1;} },
    { id:'multi', name:'Multithreaded', desc:'Get a second contact at one account engaged.', test:function(s){return s.metrics.multiAccounts>=1;} },
    { id:'champion', name:'Champion', desc:'Take a contact from ENGAGED to CHAMPION.', test:function(s){return s.metrics.champions>=1;} },
    { id:'exec', name:'Executive Voice', desc:'Hold a real conversation with a C-level.', test:function(s){return s.metrics.execConvos>=1;} },
    { id:'hundred', name:'One Hundred', desc:'100 total dials.', test:function(s){return s.metrics.dials>=100;} },
    { id:'perfect_week', name:'Perfect Week', desc:'Hit quota four weeks in a row.', test:function(s){return s.streak>=4;} },
    { id:'objection_pro', name:'Objection Surgeon', desc:'Isolate the real objection 10 times.', test:function(s){return s.metrics.objectionsIsolated>=10;} },
    { id:'followup_king', name:'The Follow-Up', desc:'Re-engage a contact who had gone cold.', test:function(s){return s.metrics.reengaged>=1;} },
    { id:'builder', name:'Pipeline Builder', desc:'Create $150k of qualified pipeline.', test:function(s){return s.metrics.pipelineCreated>=150000;} }
  ];
  S.checkAchievements = function (st) {
    var got = [];
    S.ACHIEVEMENTS.forEach(function (a) {
      if (st.achievements.indexOf(a.id) >= 0) return;
      var ok = false; try { ok = a.test(st); } catch (e) {}
      if (ok) { st.achievements.push(a.id); got.push(a); }
    });
    return got;
  };
})();