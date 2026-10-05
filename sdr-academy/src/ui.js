/* SDR Academy — UI. Mobile-first. Dark professional theme. */
(function () {
  var S = window.SDRA;
  var el = function (id) { return document.getElementById(id); };
  var S_ = S;
  var st = null;          /* game state */
  var call = null;        /* active call runtime */
  var view = 'boot';
  var screen = null;

  /* ---------------- helpers ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }
  function $(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function on(node, sel, fn) { node.addEventListener('click', function (e) {
    var t = e.target.closest(sel); if (t) fn(t, e); }); }

  var UI = S.UI = {};
  UI.st = function () { return st; };
  UI.setState = function (s) { st = s; };
  UI.render = function () { render(); };
  UI.view = function () { return view; };
  UI.setView = function (v) { view = v; render(); };
  UI.goCall = function (c) { call = c; view = 'call'; render(); };
  UI.endCall = function () { call = null; view = 'day'; render(); };
  UI.getCall = function () { return call; };

  /* ---------------- shell ---------------- */
  function shell(inner) {
    var d = document.createElement('div');
    d.className = 'shell';
    d.innerHTML =
      '<header class="topbar">' +
        '<div class="tb-left"><span class="lvl">Lv ' + st.level + '</span>' +
        '<span class="role">' + esc(st.title) + '</span></div>' +
        '<div class="tb-mid"><span class="daylbl">Day ' + st.day + ' · Week ' + st.week + '</span></div>' +
        '<div class="tb-right"><span class="bar" title="Energy"><i style="width:' +
          Math.round(st.energy / st.energyMax * 100) + '%"></i></span>' +
          '<span class="bar m" title="Morale"><i style="width:' +
          Math.round(st.morale / st.moraleMax * 100) + '%"></i></span></div>' +
      '</header>' +
      '<main id="main" class="main">' + inner + '</main>' +
      '<nav class="tabbar">' +
        ['day','accounts','academy','me','stats'].map(function (v) {
          var lbl = { day:'Day', accounts:'Accounts', academy:'Academy', me:'You', stats:'Stats' }[v];
          return '<button class="tab' + (view === v || (view==='call'&&v==='day') ? ' on' : '') +
            '" data-nav="' + v + '">' + lbl + '</button>';
        }).join('') +
      '</nav>';
    return d;
  }
  UI.shell = shell;

  function render() {
    var root = el('app');
    root.innerHTML = '';
    var d = shell('');
    root.appendChild(d);
    var main = d.querySelector('#main');
    var body;
    switch (view) {
      case 'boot': body = bootView(); break;
      case 'day': body = dayView(); break;
      case 'call': body = callView(); break;
      case 'coach': body = coachView(); break;
      case 'accounts': body = accountsView(); break;
      case 'contact': body = contactView(); break;
      case 'academy': body = academyView(); break;
      case 'lesson': body = lessonView(); break;
      case 'me': body = meView(); break;
      case 'stats': body = statsView(); break;
      case 'settings': body = settingsView(); break;
      default: body = dayView();
    }
    main.appendChild(body);
    wire(d);
    S.save(st);
  }

  function wire(root) {
    on(root, '[data-nav]', function (t) { UI.setView(t.getAttribute('data-nav')); });
    on(root, '[data-act]', function (t) { act(t.getAttribute('data-act'), t); });
    on(root, '[data-contact]', function (t) { UI.contact(t.getAttribute('data-contact')); });
    on(root, '[data-lesson]', function (t) { UI.lesson(+t.getAttribute('data-lesson')); });
  }

  /* ---------------- actions ---------------- */
  function act(name, node) {
    var arg = node.getAttribute('data-arg');
    switch (name) {
      case 'newGame': newGame(); break;
      case 'continue': S.setRngState(st.rngState || st.seed); view = st.day === 1 ? 'day' : 'day'; startDayIfNeeded(); break;
      case 'startDay': doStartDay(); break;
      case 'endDay': doEndDay(); break;
      case 'call': UI.startCall(node.getAttribute('data-pid')); break;
      case 'choose': choose(+node.getAttribute('data-i')); break;
      case 'advance': advance(); break;
      case 'back': UI.setView('day'); break;
      case 'coachBack': UI.setView('day'); break;
      case 'export': doExport(); break;
      case 'import': doImport(); break;
      case 'reset': doReset(); break;
      case 'noop2': break; case 'toggleExpert': st.flags.expert = !st.flags.expert; render(); break;
      case 'dial': UI.startCall(arg); break;
      case 'research': doResearch(arg); break;
      case 'vmreason':
        if (call) { call.voicemailReason = true; }
        advance(); break;
    }
  }

  UI.contact = function (id) {
    var p = st.prospects.filter(function (x) { return x.id === id; })[0];
    if (!p) { view = 'day'; render(); return; }
    S.UI.contactData = p;
    view = 'contact';
    render();
  };
  function doResearch(pid) {
    var p = st.prospects.filter(function (x) { return x.id === pid; })[0];
    if (!p) return;
    st.focus = S.clamp(st.focus - 22, 0, st.focusMax);
    st.skills.research = S.clamp(st.skills.research + 0.25, 1, 20);
    if (!p.researched) {
      p.researched = true;
      p.hidden.curiosity = S.clamp(p.hidden.curiosity + 0.05, 0, 1);
      p.notes.push('Researched on day ' + st.day + '.');
      S.addJournal(st, 'Researched ' + p.companyName + ' before calling ' + p.name + '.', 'note');
    }
    S.save(st);
    render();
  }
  UI.lesson = function (id) { S.UI.lessonId = id; view = 'lesson'; render(); };

  function startDayIfNeeded() { if (!st.today) doStartDay(); }

  function newGame() {
    st = S.newState({ seed: (Date.now() & 0x7fffffff) });
    for (var i = 0; i < 6; i++) S.spawnAccount(st, true);
    S.setRngState(st.seed);
    S.unlockLessons(st);
    S.save(st);
    view = 'day';
    render();
  }

  function doStartDay() {
    var r = S.startDay(st);
    if (r.newly.length) S.UI.pendingUnlocks = r.newly;
    render();
  }

  function doEndDay() {
    var r = S.endDay(st);
    st.today = null;
    st.lastRecap = r;
    view = 'recap';
    render();
  }

  function doExport() {
    var txt = S.exportSave(st);
    try {
      var b = new Blob([txt], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'sdr-academy-save.json'; a.click();
    } catch (e) { alert('Export failed: ' + e.message); }
  }
  function doImport() {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try { st = S.importSave(r.result); S.setRngState(st.rngState || st.seed); S.save(st); view = 'day'; render(); }
        catch (e) { alert('Import failed: ' + e.message); }
      };
      r.readAsText(f);
    };
    inp.click();
  }
  function doReset() {
    if (!confirm('This erases your entire career — level, accounts, pipeline, everything. There is no undo. Continue?')) return;
    if (!confirm('Really? Type is not possible, so confirm once more to be sure.')) return;
    S.clearSave(); st = S.newState({ seed: (Date.now() & 0x7fffffff) });
    S.setRngState(st.seed); for (var i = 0; i < 6; i++) S.spawnAccount(st, true);
    S.save(st); view = 'day'; render();
  }

  /* ---------------- boot ---------------- */
  function bootView() {
    var has = S.load();
    var d = document.createElement('div');
    d.className = 'view boot';
    d.innerHTML =
      '<div class="boot-card">' +
        '<div class="brandmark">SDR ACADEMY</div>' +
        '<h1>A career in eleven minutes at a time.</h1>' +
        '<p class="lede">You are an SDR trainee selling enterprise AI software to companies that mostly do not want to hear from you. Some of them have a real problem. Some of them do not. Telling those two apart is the whole job — and this game will not tell you which is which.</p>' +
        '<div class="boot-btns">' +
          (has ? '<button class="btn primary" data-act="continue">Continue career — Day ' + has.day + ', ' + esc(has.title) + '</button>' : '') +
          '<button class="btn' + (has ? '' : ' primary') + '" data-act="newGame">New career</button>' +
          (has ? '<button class="btn danger" data-act="reset">Reset career</button>' : '') +
        '</div>' +
        (has ? '<button class="linkbtn" data-nav="settings">Import / export save</button>' : '') +
        '<div class="hint">Progress saves automatically to this browser. Closing the tab does not end your career.</div>' +
      '</div>';
    return d;
  }

  /* ---------------- day view ---------------- */
  function dayView() {
    var d = document.createElement('div');
    d.className = 'view day';
    var callList = st.prospects.filter(function (p) { return !p.dead && p.stage !== 'disqualified'; });
    callList.sort(function (a, b) { return priority(a) - priority(b); });

    var h = '';
    h += '<div class="scenekicker">';
    if (st.day === 1) h += '09:03 · Your first day';
    else h += clock() + ' · ' + dayName();
    h += '</div>';

    if (!st.today) {
      h += '<div class="panel brief">' + S.managerBrief(st).map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>';
      h += '<button class="btn primary big" data-act="startDay">Start the day</button>';
    } else {
      var ts = st.todayStats;
      h += '<div class="panel statrow">' +
        stat('Dials', ts.dials) + stat('Connects', ts.connects) + stat('Positive', ts.pos) +
        stat('Meetings', ts.meetingsBooked) + '</div>';
      h += '<div class="listhead">Your list <span class="dim">' + callList.length + ' contacts</span></div>';
      h += callList.slice(0, 14).map(prospectRow).join('');
      h += '<button class="btn primary big" data-act="endDay">End the day</button>';
    }
    d.innerHTML = h;
    return d;
  }

  function priority(p) {
    var sc = 0;
    if (p.stage === 'engaged' || p.stage === 'meeting' || p.stage === 'opp') sc -= 40;
    if (p.stage === 'touched') sc -= 20;
    if (p.memory.calls === 0 && p.hidden.painReady !== false) sc -= 5;
    sc -= p.hidden.urgency * 10;
    sc -= p.hidden.authority * 8;
    sc -= (p.hidden.problemAwareness || 0) * 6;
    sc += p.memory.ghosted * 8;
    return sc;
  }

  function clock() {
    var h = 9, m = 5;
    var used = st.todayStats.dials * 11 + st.todayStats.emails * 6;
    h += Math.floor(used / 60) + Math.floor(st.todayStats.meetingsBooked * 0.6);
    m += used % 60;
    while (m >= 60) { m -= 60; h++; }
    while (h > 18) h = 18;
    var ampm = h >= 12 ? 'PM' : 'AM';
    var hh = h % 12; if (hh === 0) hh = 12;
    return hh + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
  }
  function dayName() {
    var names = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    return names[(st.day - 1) % 5] + (st.week > 1 ? ' · Week ' + st.week : '');
  }
  function stat(l, v) { return '<div class="stat"><b>' + v + '</b><span>' + l + '</span></div>'; }

  function prospectRow(p) {
    var rel = '<span class="rel r' + S.relIndex(p.relationship) + '">' + p.relationship + '</span>';
    var badge = p.stage === 'opp' ? '<span class="tag opp">OPPORTUNITY</span>'
      : p.stage === 'meeting' ? '<span class="tag meet">MEETING</span>'
      : p.stage === 'touched' ? '<span class="tag touched">IN PLAY</span>' : '';
    return '<button class="prow" data-contact="' + p.id + '">' +
      '<div class="pmain"><div class="pname">' + esc(p.name) + ' ' + badge + '</div>' +
      '<div class="psub">' + esc(p.title) + ' · ' + esc(p.companyName) + '</div></div>' +
      '<div class="pmeta">' + rel + '</div></button>';
  }

  /* ---------------- contact view ---------------- */
  function contactView() {
    var p = S.UI.contactData;
    if (!p) { view = 'day'; return dayView(); }
    var co = st.accounts.filter(function (a) { return a.id === p.companyId; })[0];
    var v = p.visible, h = p.hidden;
    var researched = S.relIndex(p.relationship) >= 1 || p.researched;
    var d = document.createElement('div');
    d.className = 'view contact';
    var o = h.realObjection;
    var objLine = '';
    if (p.memory.calls > 0 && o.surfacedObjection)
      objLine = '<div class="panel"><div class="lbl">What they actually said</div><p class="quote">' + esc(o.surfaceText) + '</p></div>';

    d.innerHTML =
      '<button class="linkbtn" data-nav="day">‹ Back to the day</button>' +
      '<h2>' + esc(p.name) + '</h2>' +
      '<div class="sub">' + esc(p.title) + ' · ' + esc(p.companyName) + ' · ' + esc(p.department) + '</div>' +
      '<div class="panel">' +
        '<div class="lbl">Relationship</div>' +
        '<div class="relrow">' + S.REL_LEVELS.map(function (r) {
          return '<span class="relpill' + (r === p.relationship ? ' on' : '') +
            (S.relIndex(r) < S.relIndex(p.relationship) ? ' past' : '') + '">' + r + '</span>'; }).join('') + '</div>' +
      '</div>' +
      objLine +
      (researched ? '<div class="panel"><div class="lbl">Research</div>' +
        '<ul class="facts">' +
        '<li><b>Company</b> ' + esc(co ? co.employees + ' employees, ' + co.businessModel : '?') + '</li>' +
        '<li><b>Trigger</b> ' + esc(v.recentNews) + '</li>' +
        '<li><b>Change</b> ' + esc(v.fundingOrChange) + '</li>' +
        '<li><b>Stack signal</b> ' + esc(v.techSignal) + '</li>' +
        (v.aiSignal ? '<li><b>AI maturity</b> ' + esc(v.aiSignal) + '</li>' : '') +
        '</ul></div>' : '<button class="btn" data-act="research" data-arg="' + p.id + '">Research this account (takes ~20 min)</button>') +
      (co ? '<div class="panel"><div class="lbl">Account intel</div><ul class="facts">' +
        '<li><b>Priority</b> ' + co.priorities.map(esc).join(' · ') + '</li>' +
        '<li><b>Known pain</b> ' + co.pains.map(esc).join(' · ') + '</li>' +
        '<li><b>Budget</b> ' + esc(co.budgetEnv) + '</li>' +
        '<li><b>Security</b> ' + esc(co.securityEnv) + '</li>' +
        '<li><b>Decision</b> ' + esc(h.decisionProcess) + '</li>' +
        '<li><b>Timeline</b> ' + esc(h.timeline) + '</li>' +
        '</ul></div>' : '') +
      (p.notes.length ? '<div class="panel"><div class="lbl">Notes</div><ul class="facts">' +
        p.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>' : '') +
      '<button class="btn primary big" data-act="dial" data-arg="' + p.id + '">Call ' + esc(p.name.split(' ')[0]) + '</button>';
    return d;
  }

  /* ---------------- call view ---------------- */
  UI.startCall = function (pid) {
    var p = st.prospects.filter(function (x) { return x.id === pid; })[0];
    if (!p) return;
    if (st.energy < 6) { st.energy = 6; }
    st.focus = S.clamp(st.focus - 5, 0, st.focusMax);
    var conn = S.attemptConnect(st, p);
    call = { p: p, conn: conn, idx: 0, script: [], turns: [], scores: [], result: null,
      transcript: [], done: false };
    if (conn.connected) {
      call.script = S.buildCallScript(st, p);
      call.transcript.push({ who: 'sys', text: connText(p) });
    } else {
      call.script = [{ kind: 'voicemail' }];
    }
    view = 'call';
    render();
  };

  function connText(p) {
    var open = p.archetype === 'gatekeeper' ? 'gatekeeper' : p.archetype === 'overloaded' ? 'overloaded'
      : p.archetype === 'busy_exec' ? 'busy_exec' : p.archetype === 'polite_dismiss' ? 'curator' : 'default';
    return S.pick([
      '"' + S.pick(S.CALL_LINES.gatekeep) + '"',
      '"...hello?"',
      '"Ah — hi."'
    ]) + ' <span class="dim">(' + p.archetypeLabel + ')</span>';
  }

  function callView() {
    if (!call) { view = 'day'; return dayView(); }
    var d = document.createElement('div');
    d.className = 'view call';
    var step = call.script[call.idx];
    var h = '';

    h += '<div class="callhead"><div><b>' + esc(call.p.name) + '</b><span class="dim"> · ' + esc(call.p.title) + '</span></div>' +
      '<div class="dim">' + esc(call.p.companyName) + '</div></div>';
    h += '<div class="transcript">' + call.transcript.map(function (t) {
      return '<div class="tline ' + t.who + '"><span class="who">' +
        (t.who === 'sys' ? '' : t.who === 'you' ? 'You' : esc(call.p.name.split(' ')[0])) +
        '</span><span class="txt">' + t.text + '</span></div>'; }).join('') + '</div>';

    if (step && step.kind === 'voicemail') {
      h += '<div class="panel"><p>' + esc(S.pick(S.CALL_LINES.no_answer)) + '</p>' +
        '<p class="dim">Voicemail. Most SDRs leave a name and a number. A few leave something worth hearing.</p>' +
        '<button class="btn" data-act="advance">Leave it short</button>' +
        '<button class="btn" data-act="vmreason">Leave a reason tied to what you researched</button>' +
        '<button class="btn" data-act="advance">Hang up — no voicemail</button></div>';
      d.innerHTML = h; return d;
    }

    if (call.done) { h += '<button class="btn primary big" data-act="advance">See how it went</button>'; d.innerHTML = h; return d; }

    var moment = call.moment;
    if (!moment) {
      /* build the next moment */
      if (!step) { finishCall(); return callView(); }
      var ctx = buildCtx(step);
      call.ctx = ctx;              /* choose() runs outside this scope */
      moment = S.buildMoment(call.p, ctx, step.kind);
      call.moment = moment;
      var first = moment.line;
      h = h.replace('</div></div>', '</div></div>'); /* keep transcript */
    }
    h += '<div class="moment"><div class="speech">' + moment.line + '</div>';
    if (moment.cues && moment.cues.length && (st.flags.hints || !st.flags.expert))
      h += '<div class="cues">' + moment.cues.map(function (c) { return '<div class="cue">· ' + esc(c) + '</div>'; }).join('') + '</div>';
    h += '<div class="choices">';
    moment.order.forEach(function (oi, i) {
      var opt = moment.options[oi];
      h += '<button class="choice c' + i + '" data-act="choose" data-i="' + i + '">' + esc(opt.text) + '</button>';
    });
    h += '</div></div>';
    d.innerHTML = h;
    return d;
  }

  function buildCtx(step) {
    var p = call.p;
    return {
      line: step.line, topic: step.topic, q: step.q, pushedOnce: call.pushedOnce,
      openHint: p.archetype === 'gatekeeper' ? 'gatekeeper' : p.archetype === 'overloaded' ? 'overloaded'
        : p.archetype === 'busy_exec' ? 'busy_exec' : p.archetype === 'polite_dismiss' ? 'curator' : 'default',
      kind: step.kind,
      playerTech: st.skills.productKnowledge,
      skillFocus: skillFocusFor(step.kind)
    };
  }
  function skillFocusFor(kind) {
    return { opener:['research','professionalism'], discovery:['discovery','listening'],
      objection:['qualification','objectionHandling'], close:['callControl','qualification'],
      technical:['productKnowledge','technicalFluency'], exit:['qualification','ethicalJudgment'],
      reengage:['followUp','listening'] }[kind] || ['communication'];
  }

  function choose(i) {
    if (!call || !call.moment || call.done) return;
    var opt = call.moment.options[call.moment.order[i]];
    if (!opt) return;
    var p = call.p;
    var ctx = call.ctx || { kind: call.moment.kind };
    var scored = S.scoreOption(st, p, call.moment, opt, ctx);
    S.applyOption(st, p, ctx, call.moment, opt, scored);
    call.scores.push(scored);
    call.turns.push({ text: opt.text, move: opt.move, why: opt.why, score: scored.score });

    /* objection bookkeeping */
    if (call.moment.kind === 'objection') {
      var o = p.hidden.realObjection;
      if (opt.move === 'isolate') { o.isolated = true; o.handled = true; }
      else if (opt.move === 'concede' && o.category === 'timing') { o.handled = true; }
      else if (opt.move === 'reframe' && p.hidden.trust > 0.5) { o.handled = true; }
      else if (opt.move === 'push') { call.pushedOnce = true; o.handled = false; }
      else if (opt.move === 'label' && p.hidden.trust > 0.45) { o.handled = true; }
      /* technical questions from real objections */
      if (call.moment.kind === 'technical') {
        if (opt.move === 'honest_limit') { p.hidden.trust += 0.1; p.notes.push('You were honest about your limits.'); }
        if (opt.move === 'overreach') { p.notes.push('You guessed on a technical question.'); p.memory.soundedScripted += 1; }
      }
    }

    /* Remember what they actually told us. The "reference it last time" move must be
       backed by a real memory, not just an assumption that one exists. */
    if (call.moment.kind === 'discovery' && opt.move !== 'pitch') {
      var learned = call.ctx && call.ctx.topic;
      if (learned && p.memory.statedPriorities.indexOf(learned) < 0) {
        p.memory.statedPriorities.push(learned);
        S.addJournal(st, p.name + ' told you: ' + learned + '.', 'note');
      }
    }
    call.transcript.push({ who: 'you', text: esc(opt.text) });
    call.transcript.push({ who: 'them', text: reactionLine(p, opt, call.moment) });
    call.moment = null;
    call.idx++;
    if (call.idx >= call.script.length) { call.done = true; }
    render();
  }

  function reactionLine(p, opt, moment) {
    var d = p.hidden;
    var deltas = { trust: 0, curiosity: 0, interest: 0, patience: 0 };
    Object.keys(opt.eff).forEach(function (k) {
      if (deltas[k] !== undefined) deltas[k] += opt.eff[k];
    });
    var pos = (deltas.trust + deltas.curiosity + deltas.interest) > 0.12;
    var neg = (deltas.trust + deltas.curiosity + deltas.interest) < -0.08 || deltas.patience < -0.12;
    var pool;
    if (neg) pool = ['"Okay." <span class="dim">(that landed badly)</span>',
      '"Right." <span class="dim">(flat)</span>',
      '"Sure." <span class="dim">(they check something on their desk)</span>',
      '*pause* "That\'s — okay."'];
    else if (pos) pool = ['"Huh." <span class="dim">(that was unexpected)</span>',
      '"Wait, say that again."', '"Mm. Go on."', '"Hmm, that\'s interesting."'];
    else pool = ['"Okay."', '"Right."', '"Sure."', '"Mm."', '*they keep talking*'];
    if (opt.move === 'isolate') pool = ['"Alright — ' + esc(p.hidden.realObjection.truth) + '." <span class="dim">(they told you the real thing)</span>',
      '"Honestly? ' + esc(p.hidden.realObjection.truth) + '."'];
    if (opt.move === 'concede') pool = ['"Fair enough. Thanks anyway."', '"That\'s all right. Appreciate you not pushing."'];
    if (opt.move === 'overreach') pool = ['"That\'s not quite how it works." <span class="dim">(you just lost ground)</span>',
      '"Hm. That doesn\'t match what I\'ve heard."'];
    if (opt.move === 'honest_limit') pool = ['"That\'s actually refreshing."', '"Good. A vendor who said "I don\'t know" is a novelty."'];
    if (opt.move === 'assumptive_close') pool = ['"Whoa — hold on."', '"Let\'s not get ahead of ourselves."'];
    return S.pick(pool);
  }

  function advance() {
    if (!call) return;
    if (!call.result) {
      /* An unanswered call is still a dial, and the day still has to move on. */
      if (call.conn && !call.conn.connected) finishVoicemail();
      else if (call.done) finishCall();
      else return;
      render();
      return;
    }
    UI.endCall();
  }

  function finishVoicemail() {
    st.todayStats.dials++;
    st.focus = S.clamp(st.focus - 4, 0, st.focusMax);
    var p = call.p;
    if (call.voicemailReason) {
      p.memory.calls++;
      st.habits.personalizes++;
      p.hidden.trust = S.clamp(p.hidden.trust + 0.03, 0, 1);
    }
    call.done = true;
    call.result = {
      outcome: { k: 'no_answer', label: call.voicemailReason
        ? 'Left a voicemail tied to your research — they have to call you back'
        : 'Left a voicemail. No reason, just your name.' },
      qualify: 0.05, fit: {}, avg: 0,
      obj: { category: 'no_answer', truth: '', handled: false, isolated: false },
      best: null, worst: null
    };
    call.coach = {
      what: ['You left a voicemail with ' + p.name + '.'],
      why: [call.voicemailReason
        ? 'You gave a reason that referenced something real about them. Voicemail works as a second channel, not a first — but a specific reason gets returned far more often than a name and a number.'
        : 'Name and number is the standard, and it is close to worthless. A voicemail that says why you called gives them something to hand to a colleague, or something to be curious about.'],
      well: call.voicemailReason ? ['You treated voicemail as an outreach channel, not an obligation.'] : [],
      missed: call.voicemailReason ? [] : ['You could have earned the callback here with five more seconds of specificity.'],
      signals: [],
      expert: ['Track reply rate on voicemails separately from calls. A 3% callback rate on a specific reason is a channel; a 0% on a name-and-number is a habit.'],
      lesson: 'Activity is not effectiveness. A dial you cannot make a call from is only worth making if you give it a reason.',
      better: 'Say what you noticed about them, ask one small question, and leave it short.',
      skills: [
        { k:'Conversation Quality', v: call.voicemailReason?58:34 }, { k:'Discovery', v:5 },
        { k:'Objection Handling', v:5 }, { k:'Business Acumen', v: call.voicemailReason?60:32 },
        { k:'Call Control', v: call.voicemailReason?70:50 }, { k:'Professionalism', v: call.voicemailReason?78:62 },
        { k:'Next-Step Discipline', v: call.voicemailReason?50:25 } ]
    };
    st.lastScorecard = call.coach;
    S.save(st);
    view = 'coach';
  }

  function finishCall() {
    var p = call.p;
    var res = S.resolveOutcome(st, p, call.scores.length ? call.scores : [{ score: 0 }]);
    var co = S.coach(st, p, res, call.turns);
    st.todayStats.dials++;
    st.todayStats.connects++;
    if (res.outcome.k === 'meeting' || res.outcome.k === 'qualified_opp' || res.outcome.k === 'meeting_later')
      st.todayStats.meetingsBooked++;
    if (res.qualify > 0.4) st.todayStats.pos++;
    if (res.outcome.k === 'not_fit') st.todayStats.disqual++;
    call.result = res;
    call.coach = co;
    st.lastScorecard = co;
    S.save(st);
    view = 'coach';
    render();
  }

  /* ---------------- coach view ---------------- */
  function coachView() {
    var res = call.result, co = call.coach, p = call.p;
    var d = document.createElement('div');
    d.className = 'view coach';
    var outcome = res.outcome;
    var tone = ['meeting','qualified_opp','referred','requested_info','meeting_later'].indexOf(outcome.k) >= 0 ? 'good'
      : ['not_fit','no_problem','burned','ghosted','incumbent','blocked'].indexOf(outcome.k) >= 0 ? 'flat' : 'mid';
    var h = '<div class="scenekicker">After the call</div>';
    h += '<div class="outcome ' + tone + '"><b>' + esc(outcome.label) + '</b>' +
      '<span class="dim"> · qualification ' + Math.round(res.qualify * 100) + '/100</span></div>';
    h += '<div class="qualbar"><i style="width:' + Math.round(res.qualify * 100) + '%"></i></div>';

    h += '<div class="panel"><div class="lbl">Scorecard</div><div class="scores">' +
      co.skills.map(function (s) {
        var g = S.grade(s.v);
        return '<div class="srow"><span class="sk">' + esc(s.k) + '</span>' +
          '<span class="grade g' + g.g + '">' + g.g + '</span>' +
          '<span class="bar"><i style="width:' + s.v + '%"></i></span></div>'; }).join('') + '</div></div>';

    function list(label, arr) {
      if (!arr || !arr.length) return '';
      return '<div class="panel"><div class="lbl">' + label + '</div>' +
        arr.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>';
    }
    h += list('What happened', co.what);
    h += list('Why it happened', co.why);
    h += list('What you did well', co.well);
    h += list('What you missed', co.missed);
    h += list('What they were signalling', co.signals);
    h += list('What an experienced SDR notices', co.expert);
    h += '<div class="panel lessonbox"><div class="lbl">Key lesson</div><p>' + esc(co.lesson) + '</p>' +
      '<p class="better"><b>Better approach:</b> ' + esc(co.better) + '</p></div>';
    if (p && p.stage === 'opp')
      h += '<div class="panel warn"><p>You booked this — but qualification is ' +
        Math.round(res.qualify * 100) + '. Optimising for meetings instead of opportunity quality is how reps fill calendars with nothing.</p></div>';
    h += '<button class="btn primary big" data-act="coachBack">Back to the day</button>';
    d.innerHTML = h;
    return d;
  }

  /* ---------------- accounts ---------------- */
  function accountsView() {
    var d = document.createElement('div');
    d.className = 'view accounts';
    var accts = st.accounts.filter(function (a) { return a; });
    var h = '<div class="scenekicker">Territory</div>';
    h += '<div class="panel statrow">' +
      stat('Accounts', accts.length) + stat('Pipeline', st.pipeline.length) +
      stat('Value', '$' + Math.round(st.metrics.pipelineCreated / 1000) + 'k') + '</div>';
    if (st.pipeline.length) {
      h += '<div class="listhead">Pipeline</div>' + st.pipeline.map(function (o) {
        return '<div class="prow static"><div class="pmain"><div class="pname">' + esc(o.company) + '</div>' +
          '<div class="psub">' + esc(o.name) + ' · ' + esc(o.title) + '</div></div>' +
          '<div class="pmeta"><span class="tag opp">$' + Math.round(o.value / 1000) + 'k</span></div></div>';
      }).join('');
    }
    h += '<div class="listhead">All contacts</div>';
    h += st.prospects.filter(function (p) { return !p.dead && p.stage !== 'disqualified'; })
      .map(prospectRow).join('');
    h += st.prospects.filter(function (p) { return p.dead || p.stage === 'disqualified'; }).length
      ? '<div class="listhead">Disqualified</div>' +
        st.prospects.filter(function (p) { return p.dead || p.stage === 'disqualified'; })
          .map(function (p) { return '<div class="prow static"><div class="pmain"><div class="pname dim">' +
            esc(p.name) + '</div><div class="psub dim">' + esc(p.companyName) + ' · ' + esc(p.stage) +
            '</div></div></div>'; }).join('')
      : '';
    d.innerHTML = h;
    return d;
  }

  /* ---------------- academy ---------------- */
  function academyView() {
    var d = document.createElement('div');
    d.className = 'view academy';
    var h = '<div class="scenekicker">Sales Academy</div>';
    h += '<p class="dim">Unlocked by experience, not by menu.</p>';
    h += S.LESSONS.map(function (l) {
      var open = st.lessonsUnlocked.indexOf(l.id) >= 0;
      return '<button class="lesson' + (open ? '' : ' locked') + '" data-lesson="' + l.id + '">' +
        '<span class="lno">' + l.id + '</span><span class="lt">' + esc(l.t) + '</span>' +
        (open ? '<span class="larrow">›</span>' : '<span class="lreq">' + l.req + ' XP</span>') + '</button>';
    }).join('');
    if (st.certs.indexOf('field_ready') >= 0)
      h += '<div class="panel"><div class="lbl">Certifications</div><p>FIELD-READY SDR — earned.</p></div>';
    h += '<div class="listhead">Reference</div>';
    h += '<button class="lesson" data-lesson="3"><span class="lno">?</span><span class="lt">Full Sales Knowledge Database</span><span class="larrow">›</span></button>';
    d.innerHTML = h;
    return d;
  }

  function lessonView() {
    var id = S.UI.lessonId || 1;
    var l = S.lessonById(id);
    var d = document.createElement('div');
    d.className = 'view lesson';
    if (!l || st.lessonsUnlocked.indexOf(id) < 0) {
      d.innerHTML = '<button class="linkbtn" data-nav="academy">‹ Academy</button>' +
        '<div class="panel"><p>That lesson is locked. Play more days.</p></div>';
      return d;
    }
    d.innerHTML = '<button class="linkbtn" data-nav="academy">‹ Academy</button>' +
      '<h2>' + esc(l.t) + '</h2>' +
      '<div class="panel prose">' + l.body.split('\n\n').map(function (para) {
        return '<p>' + esc(para).replace(/\n/g, '<br>') + '</p>'; }).join('') + '</div>' +
      (l.body.indexOf('Certification is demonstrated') >= 0
        ? '<button class="btn primary big" data-act="certify">Sit the Field-Ready assessment</button>' : '');
    return d;
  }

  /* ---------------- me ---------------- */
  function meView() {
    var d = document.createElement('div');
    d.className = 'view me';
    var sorted = S.SKILLS.slice().sort(function (a, b) { return st.skills[b] - st.skills[a]; });
    var h = '<div class="scenekicker">Your rep</div>';
    h += '<div class="panel"><div class="bigtitle">' + esc(st.title) + '</div>' +
      '<div class="dim">Level ' + st.level + ' · ' + st.xp + ' XP · Day ' + st.day + '</div></div>';
    h += '<div class="listhead">Skills</div>';
    h += sorted.map(function (k) {
      var v = st.skills[k];
      return '<div class="skrow"><span>' + S.SKILL_LABEL[k] + '</span>' +
        '<span class="bar"><i style="width:' + Math.round(v / 20 * 100) + '%"></i></span>' +
        '<span class="skv">' + Math.round(v) + '</span></div>'; }).join('');
    h += '<div class="listhead">Habits your manager can see</div>';
    h += Object.keys(st.habits).filter(function (k) { return st.habits[k] > 0; })
      .sort(function (a, b) { return st.habits[b] - st.habits[a]; })
      .map(function (k) { return '<div class="skrow"><span>' + habitLabel(k) + '</span><span class="skv">' +
        st.habits[k] + '</span></div>'; }).join('') || '<p class="dim">No patterns yet.</p>';
    h += '<div class="listhead">Achievements</div>';
    h += S.ACHIEVEMENTS.map(function (a) {
      var got = st.achievements.indexOf(a.id) >= 0;
      return '<div class="skrow' + (got ? '' : ' dim') + '"><span>' + (got ? '★ ' : '☆ ') + esc(a.name) +
        '</span><span class="skv">' + (got ? '' : esc(a.desc)) + '</span></div>'; }).join('');
    h += '<button class="btn" data-nav="settings">Settings</button>';
    d.innerHTML = h;
    return d;
  }
  function habitLabel(k) {
    return { rushes:'Rushes to pitch', asks:'Asks questions', scripts:'Sounds scripted',
      pushes:'Pushes past objections', probes:'Probes objections', closes:'Asks for the meeting',
      badtime:'Asks at bad times', respects:'Respects their time', personalizes:'Personalises',
      rejects:'Handles rejection', qualifies:'Qualifies', interrupts:'Interrupts',
      overexplains:'Over-explains' }[k] || k;
  }

  /* ---------------- stats ---------------- */
  function statsView() {
    var d = document.createElement('div');
    d.className = 'view stats';
    var m = st.metrics;
    var conn = m.dials ? Math.round(m.connects / m.dials * 100) : 0;
    var conv = m.connects ? Math.round(m.convos / m.connects * 100) : 0;
    var mtg = m.connects ? Math.round(m.meetingsBooked / m.connects * 100) : 0;
    var qual = m.meetingsBooked ? Math.round(m.qm / m.meetingsBooked * 100) : 0;
    var h = '<div class="scenekicker">Funnel</div>';
    h += '<div class="panel"><div class="funnel">' +
      frow('Dials', m.dials, 1) + frow('Connects', m.connects, m.dials) +
      frow('Conversations', m.convos, m.dials) + frow('Meetings', m.meetingsBooked, m.dials) +
      frow('Qualified', m.qm, m.dials) + '</div>' +
      '<div class="rates">' +
        '<div><b>' + conn + '%</b><span>connect</span></div>' +
        '<div><b>' + conv + '%</b><span>conversation</span></div>' +
        '<div><b>' + mtg + '%</b><span>meeting rate</span></div>' +
        '<div><b>' + qual + '%</b><span>qualified rate</span></div>' +
      '</div></div>';
    h += '<div class="panel warn"><p><b>Activity is not effectiveness.</b> ' +
      (m.dials > 120 && qual < 30
        ? 'You are producing volume and converting poorly. Diagnose the funnel: is the list wrong, the opener wrong, or are you booking meetings with no pain attached?'
        : 'A rep can hit dial targets every day and still have nothing to show for it. Watch the qualified rate.') + '</p></div>';
    h += '<div class="panel statrow">' +
      stat('Emails', m.emails) + stat('Replies', m.replies) +
      stat('Disqualified', m.honestDQ) + stat('Quotas hit', st.quotaMet) + '</div>';
    h += '<div class="listhead">Journal</div>';
    h += st.journal.slice(0, 40).map(function (j) {
      return '<div class="jrow"><span class="jday">D' + j.day + '</span><span class="jtext">' +
        esc(j.text) + '</span></div>'; }).join('');
    d.innerHTML = h;
    return d;
  }
  function frow(label, v, of) {
    var pct = of ? Math.round(v / of * 100) : 0;
    return '<div class="frow"><span>' + label + '</span><span class="fbar"><i style="width:' +
      Math.min(100, pct) + '%"></i></span><span class="fv">' + v + '</span></div>';
  }

  /* ---------------- settings ---------------- */
  function settingsView() {
    var d = document.createElement('div');
    d.className = 'view settings';
    d.innerHTML = '<button class="linkbtn" data-nav="day">‹ Back</button>' +
      '<div class="scenekicker">Settings</div>' +
      '<div class="panel"><div class="lbl">Mode</div>' +
      '<button class="btn" data-act="toggleExpert">Expert mode: ' + (st.flags.expert ? 'ON' : 'off') + '</button>' +
      '<p class="dim">Expert mode removes in-call hints and asks more of you.</p></div>' +
      '<div class="panel"><div class="lbl">Save</div>' +
      '<button class="btn" data-act="export">Export save</button>' +
      '<button class="btn" data-act="import">Import save</button>' +
      '<button class="btn danger" data-act="reset">Reset career (asks twice)</button>' +
      '<p class="dim">Autosaves every action to local storage.</p></div>';
    return d;
  }

  UI.act = act;
  UI.init = function (state) {
    st = state;
    document.body.addEventListener('click', function (e) {
      var t = e.target.closest('[data-nav]');
      if (t) { UI.setView(t.getAttribute('data-nav')); }
    });
    render();
  };
  S.UIrender = render;
})();