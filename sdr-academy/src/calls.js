/* SDR Academy — call flow, outcomes, coaching. */
(function () {
  var S = window.SDRA;

  S.CALL_LINES = {
    no_answer: ['Nothing. Voicemail.', 'Four rings, then a click.', 'It goes to a voicemail box — not theirs.'],
    gatekeep: ['"Who is this?"', '"Put me through to—" *pause* "Hold on."', '"I\'ll transfer you."'],
    immediate_hangup: ['*click*', 'One word. Then nothing.'],
    gatekeeper_screen: ['"Can I ask what this is regarding?"', '"Whose number is this?"']
  };

  /* ---------------- Connect logic ---------------- */
  S.attemptConnect = function (st, p) {
    st.metrics.dials++;
    st.energy = S.clamp(st.energy - 1.5, 0, st.energyMax);
    st.focus = S.clamp(st.focus - 1.2, 0, st.focusMax);
    p.memory.calls++;
    p.memory.lastTouchDay = st.day;
    p._turn = 0;

    var base = 0.42;
    var mods = [];
    mods.push((p.relationship === 'STRANGER' ? -0.05 : 0.05));
    mods.push((st.skills.research - 4) * 0.012);
    mods.push((p.prefTime === 'morning' ? 0.03 : 0));
    mods.push((p.hidden.mood > 0.5 ? -0.08 : 0));
    mods.push((p.archetype === 'gatekeeper' ? -0.06 : 0));
    mods.push((p.hidden.skepticism * 0.08));

    if (S.chance(base, mods)) {
      st.metrics.connects++;
      st.energy = S.clamp(st.energy - 3, 0, st.energyMax);
      st.focus = S.clamp(st.focus - 3.5, 0, st.focusMax);
      return { connected: true, kind: 'live' };
    }
    /* voicemail: leave it or not — the game will offer that as a moment */
    return { connected: false, kind: S.chance(0.34) ? 'voicemail' : 'no_answer' };
  };

  /* ---------------- Sequence construction ----------------
     Length, and which moments appear, depend on the prospect, the history and the player's skill. */
  S.buildCallScript = function (st, p) {
    var h = p.hidden;
    var seq = [];
    /* Re-engagement requires a conversation that actually happened. A dial is not a
       conversation — plenty of people never pick up — and treating every dial as a
       prior relationship was drowning the real opener and objection scenes. */
    var alreadyTalked = (p.memory.convos || 0) > 0 || p.relationship !== 'STRANGER';

    seq.push({ kind: alreadyTalked ? 'reengage' : 'opener' });

    /* Do we get a real conversation? Depends on patience and how the opener landed is unknown yet,
       so pre-roll the *willingness* with the hidden read on patience/curiosity/past treatment. */
    var willing = S.clamp(
      h.patience * 0.5 + h.openness * 0.3 + (p.relationship === 'STRANGER' ? 0 : 0.15)
      - h.skepticism * 0.15 - (p.memory.soundedScripted * 0.04) - p.mood * 0.2, 0.05, 0.95);

    if (S.chance(willing)) {
      st.metrics.convos++;
      p.memory.convos = (p.memory.convos || 0) + 1;
      if (S.chance(0.4 + h.openness * 0.4 - h.skepticism * 0.3)) {
        st.metrics.posConvos++;
        seq.push({ kind: 'discovery', topic: S.pick(h._company_pains || ['the process']) });
      }
      if (p.department === 'Technology' || p.department === 'Security' || S.chance(0.25)) {
        seq.push({ kind: 'technical', q: S.pick(['How does this actually work with our data?',
          'Where does it run — your cloud or ours?', 'What happens to the data after a call?']) });
      }
      if (h.surfacedObjection !== null && S.chance(0.85)) seq.push({ kind: 'objection' });
      if (h.interest > 0.3 || S.chance(0.4)) seq.push({ kind: 'close' });
    } else {
      /* short call — one meaningful moment only */
      seq.push({ kind: 'objection' });
    }
    return seq;
  };

  /* ---------------- Outcome resolution ---------------- */
  S.resolveOutcome = function (st, p, chosenScores) {
    var h = p.hidden;
    var o = h.realObjection;
    var best = chosenScores.slice().sort(function (a, b) { return b.score - a.score; })[0];
    var worst = chosenScores.slice().sort(function (a, b) { return a.score - b.score; })[0];
    var avg = chosenScores.reduce(function (a, s) { return a + s.score; }, 0) / chosenScores.length;

    /* Real qualification, not feeling. A good SDR disqualifies bad fits. */
    /* Qualification is about whether anything can realistically happen. Access is
       evidence of a relationship, but a first call can still be qualified — so it is
       a mild bonus, not a quarter of the score. */
    var fit = {
      pain: h.problemAwareness,
      authority: h.authority,
      urgency: 0.3 + h.urgency * 0.7,
      budget: 0.25 + h.budgetConfidence * 0.75,
      access: 0.35 + (S.relIndex(p.relationship) / 5) * 0.65
    };
    var qualify = (fit.pain * 0.26 + fit.authority * 0.24 + fit.urgency * 0.17 + fit.budget * 0.16 + fit.access * 0.17);

    /* Objection handling matters — an unresolved real objection caps everything. */
    if (!o.handled && o.depth === 'deep' && o.category !== 'low_priority') qualify *= 0.78;

    var trust = h.trust, interest = h.interest;
    var outcome;
    var roll = S.rnd();
    var heat = interest * 0.42 + trust * 0.24 + h.curiosity * 0.18 + avg * 0.16;

    /* Luck floor: a bad call can occasionally land, and a great SDR can occasionally
       lose a good one. Over a large sample skill dominates; on any single call it does not. */
    var lucky = S.chance(0.035) && h.curiosity > 0.42 && qualify > 0.45;

    if (lucky && trust > 0.1) {
      outcome = S.chance(0.4) ? { k: 'meeting', label: 'Meeting booked (a bit of luck)' }
        : { k: 'requested_info', label: 'Prospect requested more information' };
    } else if (p.mood > 0.65 || trust < 0.08) {
      outcome = S.chance(0.45) ? { k: 'burned', label: 'Burned the relationship' }
        : S.chance(0.5) ? { k: 'ended_early', label: 'Prospect ended the call early' }
        : { k: 'ghosted', label: 'Ghosted' };
    } else if (h.curiosity > 0.68 && qualify > 0.56 && S.chance(Math.pow(heat, 1.55) * 0.92)) {
      outcome = S.chance(0.45) ? { k: 'referred', label: 'Referred you to another stakeholder' }
        : { k: 'meeting', label: 'Meeting booked' };
    } else if (interest > 0.55 && qualify > 0.55 && S.chance(Math.pow(heat, 1.4) * 1.0)) {
      outcome = S.chance(0.35) ? { k: 'qualified_opp', label: 'Qualified opportunity' }
        : { k: 'meeting', label: 'Discovery meeting booked' };
    } else if (interest > 0.45 && qualify > 0.45 && S.chance(Math.pow(heat, 1.7) * 0.7)) {
      outcome = S.chance(0.4) ? { k: 'requested_info', label: 'Prospect requested more information' }
        : S.chance(0.5) ? { k: 'meeting_later', label: 'Agreed to reconnect later' }
        : { k: 'nurture', label: 'Nurture' };
    } else if (qualify < 0.35) {
      /* a legitimately bad opportunity. Excellent sales can still land here. */
      outcome = { k: 'not_fit', label: 'Not a fit' };
      if (avg > 0.35) { st.metrics.honestDQ++; }
    } else if (o.category === 'competition' && !o.handled) {
      outcome = { k: 'incumbent', label: 'Competitor locked in' };
    } else if (o.category === 'security' && !o.handled) {
      outcome = { k: 'blocked', label: 'Security blocked it' };
    } else if (h.patience < 0.2 || h.skepticism > 0.85) {
      /* curious but low patience is still worth a second touch — ghosting is not the
         same as rejection, and reps who treat them alike lose half their pipeline */
      outcome = S.chance(0.4) ? { k: 'nurture', label: 'Nurture — right person, wrong moment' }
        : { k: 'not_interested', label: 'Not interested' };
    } else if (S.chance(0.3 + heat * 0.4)) {
      outcome = { k: 'bad_timing', label: 'Bad timing' };
    } else {
      outcome = S.chance(0.5) ? { k: 'no_problem', label: 'No real problem found' }
        : { k: 'not_interested', label: 'Not interested' };
    }

    /* --- apply consequences --- */
    var res = { outcome: outcome, qualify: qualify, fit: fit,
      best: best, worst: worst, avg: avg,
      obj: { category: o.category, truth: o.truth, handled: o.handled, isolated: o.isolated } };

    switch (outcome.k) {
      case 'meeting': case 'qualified_opp': case 'meeting_later':
        st.metrics.meetingsBooked++;
        if (qualify > 0.55) st.metrics.qm++;
        p.stage = qualify > 0.55 ? 'opp' : 'meeting';
        p.relationship = S.relUp(p.relationship);
        if (qualify > 0.55) {
          p.dealValue = S.rint(12, 90) * 1000;
          st.metrics.pipelineCreated += p.dealValue;
          S.addPipeline(st, p, 'qualified');
        }
        if (p.cLevel === 'C') st.metrics.execConvos++;
        break;
      case 'referred':
        st.metrics.multiAccounts = 1;
        p.relationship = S.relUp(p.relationship);
        p.stage = 'engaged';
        S.spawnReferral(st, p);
        break;
      case 'requested_info':
        p.stage = 'nurture'; p.relationship = S.relUp(p.relationship);
        break;
      case 'burned':
        p.relationship = 'STRANGER'; p.mood = 0.8; p.stage = 'nurture';
        S.addJournal(st, 'Burned the relationship with ' + p.name + '.', 'mistake');
        st.morale = S.clamp(st.morale - 5, 0, st.moraleMax);
        break;
      case 'ghosted':
        p.stage = 'nurture'; p.memory.ghosted++;
        break;
      case 'not_fit': case 'no_problem':
        p.stage = 'disqualified';
        S.addJournal(st, 'Disqualified ' + p.name + ' at ' + p.companyName + ': ' + o.truth + '.', 'lesson');
        break;
      default:
        if (S.chance(0.35)) p.relationship = S.relDown(p.relationship);
        p.stage = 'touched';
    }

    if (S.relIndex(p.relationship) >= S.relIndex('CHAMPION')) st.metrics.champions = 1;
    return res;
  };

  S.addPipeline = function (st, p, stage) {
    st.pipeline.push({ id: p.id, name: p.name, title: p.title, company: p.companyName,
      companyId: p.companyId, value: p.dealValue, stage: stage || 'qualified', day: st.day,
      objections: [p.hidden.realObjection.category], champion: p.name,
      qualification: Math.round(p.hidden.problemAwareness * 100) });
  };

  S.spawnReferral = function (st, p) {
    var co = st.accounts.filter(function (a) { return a.id === p.companyId; })[0];
    if (!co) return;
    var np = S.makeProspect(co, { archetype: 'champion_candidate' });
    np.companyName = co.name;
    np.relationship = 'AWARE';
    np.notes.push('Referred by ' + p.name + '.');
    st.prospects.push(np);
    p.memory.referred.push(np.name);
    S.addJournal(st, p.name + ' referred you to ' + np.name + ' (' + np.title + ').', 'win');
  };

  /* ---------------- Coaching debrief ---------------- */
  S.coach = function (st, p, res, turns) {
    var best = res.best, worst = res.worst;
    var cats = S.scorecard(st, p, turns, res);
    var out = {
      what: [], why: [], well: [], missed: [], signals: [], expert: [], lesson: '', better: '',
      skills: [], scorecard: cats
    };
    var avg = res.avg;
    out.what.push(res.outcome.label + ' with ' + p.name + ' (' + p.title + ').');

    var o = res.obj;
    if (!o.handled && o.category !== 'low_priority') {
      out.why.push('The surface objection was ' + o.category + '. The underlying truth: ' + o.truth + '.');
      if (!o.isolated) out.why.push('You never isolated it. Without that, any response was a guess.');
    } else if (o.isolated) {
      out.why.push('You isolated the real objection (' + o.truth + '), which is why the outcome could be managed rather than merely survived.');
    }

    if (best && best.why) out.well.push('Your strongest move was ' + best.move + ': ' + best.why);
    if (worst && worst.score < -0.05 && worst.why) out.missed.push('Your weakest moment was ' + worst.move + ': ' + worst.why);

    /* signals: name what they gave away */
    if (p.hidden.problemAwareness > 0.6) out.signals.push('They described the problem with detail — that was real pain, not politeness.');
    if (p.hidden.problemAwareness < 0.35) out.signals.push('They never once described a concrete pain. That is a disqualifier, not an opening.');
    if (p.hidden.curiosity > 0.65) out.signals.push('They asked you questions unprompted — interest signal.');
    if (p.hidden.patience < 0.25) out.signals.push('Their patience was gone early. Long calls with this person are a trap.');
    if (p.hidden.politicalRisk > 0.6) out.signals.push('Sponsor risk is high here. Even a great call will not survive the internal meeting.');
    if (p.memory.soundedScripted > 1) out.signals.push('They have heard your script more than once.');

    out.expert.push('An experienced SDR would have checked authority before enthusiasm. Enthusiasm without a path to a yes is a trap, and it costs you two weeks.');

    /* skill scoring */
    var sc = {
      'Conversation Quality': S.clamp(Math.round(50 + avg * 90), 5, 100),
      'Discovery': S.clamp(Math.round(p.hidden.problemAwareness * 100 * (st.habits.asksQuestions > 3 ? 1 : 0.85)), 5, 100),
      'Objection Handling': o.isolated ? S.clamp(Math.round(55 + p.hidden.trust * 45), 5, 100)
        : S.clamp(Math.round(25 + p.hidden.trust * 30), 5, 100),
      'Business Acumen': S.clamp(Math.round((p.hidden.problemAwareness * 0.5 + res.qualify * 0.5) * 100), 5, 100),
      'Call Control': S.clamp(Math.round(45 + avg * 60 + (p.mood < 0.4 ? 15 : -10)), 5, 100),
      'Professionalism': S.clamp(Math.round(50 + p.hidden.trust * 40 - p.mood * 25), 5, 100),
      'Next-Step Discipline': p.stage === 'opp' || p.stage === 'meeting' ? 85 : S.clamp(Math.round(35 + (st.habits.asksForMeeting > 3 ? 25 : 0)), 5, 100)
    };
    var low = Object.keys(sc).sort(function (a, b) { return sc[a] - sc[b]; })[0];
    out.lesson = res.outcome.k === 'not_fit'
      ? 'A perfect conversation can still end in disqualification. Learning that early is worth more than a fake yes.'
      : 'The gap in your weakest category was ' + low + '. That is where the next level lives.';
    out.better = best && best.why ? best.why : 'Ask more, say less.';
    out.skills = Object.keys(sc).map(function (k) { return { k: k, v: sc[k] }; });
    return out;
  };

  /* Kept as a public hook for the scorecard module. */
  S.scorecard = function (st, p, turns, res) { return null; };

  S.grade = function (n) {
    if (n >= 90) return { g: 'A', label: 'Excellent' };
    if (n >= 78) return { g: 'B', label: 'Strong' };
    if (n >= 65) return { g: 'C', label: 'Solid' };
    if (n >= 50) return { g: 'D', label: 'Developing' };
    return { g: 'F', label: 'Needs work' };
  };
})();