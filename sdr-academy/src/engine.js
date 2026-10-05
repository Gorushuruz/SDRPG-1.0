/* SDR Academy — conversation engine.
   Four choices per moment. Position randomized. Every option carries *effects*, not a
   "correct" flag: whether it lands depends on the prospect's hidden variables, the
   relationship, history and the player's skills. */
(function () {
  var S = window.SDRA;

  /* ---------------- hidden variable model ---------------- */
  S.HIDDEN_VARS = ['trust','curiosity','interest','urgency','problemAwareness','patience',
    'skepticism','politicalRisk','competitiveLoyalty','budgetConfidence','authority','mood'];

  S.perceived = function (p) {
    /* Cue lines the player reads. This is the ONLY feedback channel in-conversation. */
    var cues = [];
    var h = p.hidden;
    if (h.trust > 0.6) cues.push('They are actually listening to you.');
    else if (h.trust < 0.15) cues.push('They have not committed to the call yet.');
    if (h.curiosity > 0.6) cues.push('They asked you a question without being prompted.');
    if (h.interest > 0.6) cues.push('They are asking about next steps in their own words.');
    else if (h.interest > 0.35) cues.push('They have not said no to anything yet.');
    else cues.push('They are giving you short answers.');
    if (h.patience < 0.25) cues.push('They keep glancing at something else. You are burning time.');
    if (h.skepticism > 0.7) cues.push('They have not believed a single word yet.');
    if (h.problemAwareness > 0.7) cues.push('They are describing the problem in numbers.');
    return cues;
  };

  /* Apply an option's effect against the prospect. Effects are *pressure*, the prospect's
     personality modulates it. Nothing here is a pure success roll. */
  S.applyEffects = function (p, eff, skillAvg) {
    var h = p.hidden, log = [];
    /* Per-call diminishing returns. A single option must not move the relationship
       permanently; a three-turn call should leave a mark, not a permanent transformation.
       Without this, three good-sounding lines in a row take trust from 0.15 to 0.92. */
    var turn = p._turn || 0;
    var decay = Math.pow(0.62, turn);
    p._turn = turn + 1;
    var auth = S.clamp(h.patience * (1.3 - h.skepticism * 0.6) + (skillAvg - 5) * 0.02, 0.05, 1.8);
    Object.keys(eff).forEach(function (k) {
      var raw = eff[k];
      if (typeof raw !== 'number') return;
      var v = raw * decay;
      if (k === 'trust' || k === 'curiosity' || k === 'problemAwareness') {
        /* good skills amplify connection-building, bad ones get punished */
        v = raw * auth;
      }
      if (k === 'patience') {
        v = raw * (2 - h.skepticism * 0.5); /* skeptical people are more forgiving of honesty */
        if (raw > 0) v = raw * (0.5 + h.patience); /* you only earn patience if there is any */
      }
      if (k === 'interest') v = raw * (0.6 + h.curiosity * 0.8);
      if (k === 'interest' && raw > 0) v = raw * (1.25 - h.competitiveLoyalty * 0.7);
      if (k === 'mood' || k === 'patience') v = v * (h.openness * 0.7 + 0.5);
      if (h[k] === undefined) h[k] = 0;
      var before = h[k];
      h[k] = S.clamp(h[k] + v, 0, 1);
      /* hard ceiling on how far one call can move the two compounding variables */
      if (k === 'trust') h[k] = Math.min(h[k], 0.20 + 0.55 * (p._turn > 2 ? 1.4 : p._turn));
      if (k === 'curiosity') h[k] = Math.min(h[k], 0.20 + 0.50 * (p._turn > 2 ? 1.4 : p._turn));
      if (Math.abs(h[k] - before) > 0.03)
        log.push({ v: k, d: h[k] - before });
    });
    p.mood = S.clamp(p.mood + (eff.mood || 0), 0, 1);
    return log;
  };

  /* ---------------- choice archetypes ----------------
     Each move kind has a real risk. Judgment, not memorization. */
  S.MOVES = {
    permission:  { label: 'ask permission',    probe:true,  patience:+0.05 },
    label:      { label: 'label their emotion', empathy:true,  trust:+0.10 },
    mirror:     { label: 'mirror',            listen:true,  trust:+0.06, curiosity:+0.05 },
    question:   { label: 'open discovery question', probe:true, curiosity:+0.10 },
    tight_q:    { label: 'tight question',     probe:true,  curiosity:+0.07, patience:-0.04 },
    pain_q:     { label: 'business impact question', probe:true, curiosity:+0.13, problemAwareness:+0.14 },
    stack_q:    { label: 'role-aware question', probe:true, curiosity:+0.09, trust:+0.05 },
    pitch:      { label: 'pitch',             pitch:true,  interest:-0.03, curiosity:-0.08 },
    feature:    { label: 'feature dump',      pitch:true,  interest:-0.08, curiosity:-0.15, patience:-0.08 },
    value:      { label: 'value statement',   value:true,  interest:+0.08, skepticism:-0.03 },
    question_back:{label:'return the question', probe:true, patience:-0.06, curiosity:+0.06 },
    reframe:    { label: 'reframe',           reframe:true, interest:+0.06, skepticism:-0.06 },
    concede:    { label: 'concede and exit',  ethical:true, respect:true, patience:+0.20, interest:-0.10 },
    isolate:    { label: 'isolate the real issue', probe:true, curiosity:+0.12, trust:+0.08 },
    assumptive_close:{ label:'assumptive close', close:true, patience:-0.10 },
    ask_close:  { label: 'ask for the meeting directly', close:true, interest:+0.05 },
    ask_time:   { label: 'ask a small permission', probe:true, patience:-0.02, trust:+0.05 },
    honest_limit:{ label: 'admit you do not know', honest:true, trust:+0.14, interest:-0.04 },
    overreach:  { label: 'guess the answer',   bluff:true,  trust:-0.16, skepticism:+0.10 },
    push:       { label: 'push past the objection', push:true, patience:-0.18, trust:-0.10 },
    empathy:    { label: 'empathy',            empathy:true, trust:+0.09, patience:+0.05 },
    scripted:   { label: 'deliver the script', script:true,  trust:-0.05, curiosity:-0.05 },
    check:      { label: 'confirm understanding', listen:true, trust:+0.08 }
  };

  /* ---------------- moment library ----------------
     A moment = a spoken line + 4 candidate responses. Candidate responses are drawn from
     the move library, then personalised with the prospect's context. No response is ever
     flagged. Responses that are plausible-but-wrong are generated by mixing a good move
     with a bad situational fit (e.g. isolate on someone who has not surfaced an objection). */
  S.buildMoment = function (p, ctx, kind) {
    var h = p.hidden, line, options = [];
    var speak = S.pick;

    if (kind === 'answer') {
      line = ctx.line || 'They answer your question.';
    }

    /* --- 1. Opener moments --- */
    if (kind === 'opener') {
      var lines = {
        gatekeeper: ['"Who is this?"', '"Put me through to — wait, who is asking?"'],
        busy_exec: ['"Yeah."', '"This better be quick."'],
        overloaded: ['"One sec — hold on." *keys* "Okay. What."'],
        curator: ['"— this is the fourth call today."'],
        default: ['"...hello?"', '"Okay — who is this?"']
      };
      line = speak(lines[ctx.openHint] || lines.default);
      options = [
        { text: 'Name, company, and a fifteen-second reason tied to what I noticed about their industry.',
          move: 'permission', eff: { trust:+0.10, curiosity:+0.06, patience:+0.03 },
          why: 'You gave a reason and kept it short enough to be worth hearing.' },
        { text: 'Name, company, and "we help companies like yours automate X" — the standard pitch line.',
          move: 'pitch', eff: { interest:-0.04, curiosity:-0.08, patience:-0.06 },
          why: 'Generic value statement. Nothing in it was about them, so there is nothing to be curious about.' },
        { text: 'Apologise for the interruption, ask if this is a bad time, and offer to call back.',
          move: 'concede', eff: { patience:+0.18, trust:+0.06, interest:-0.08 },
          why: 'Respectful, and correct if the read was right. But you exited before you found out if it was.' },
        { text: 'Lead with the company name and the specific trigger event you researched — then stop talking.',
          move: 'permission', eff: { trust:+0.13, curiosity:+0.12, patience:+0.02 },
          why: 'Specificity is the fastest trust instrument you own. They had to wonder how you knew.' }
      ];
    }

    /* --- 2. Discovery moments --- */
    if (kind === 'discovery') {
      var topic = ctx.topic || 'their situation';
      var q = ctx.question || ('"So what happens today with ' + topic + '?"');
      line = p.name.split(' ')[0] + ' answers: ' + q;
      var roleAware = p.department === 'Technology' || p.department === 'Security';
      options = [
        { text: '"Walk me through the last time that broke. What happened, step by step?"',
          move: 'pain_q', eff: { curiosity:+0.10, problemAwareness:+0.16, trust:+0.09 },
          why: 'Past behaviour beats hypotheticals. This is the highest-yield discovery question in the set.' },
        { text: roleAware
            ? '"Before I say anything technical — how does that fit with how your team already works?"'
            : '"How does that land with your team day to day?"',
          move: 'stack_q', eff: { curiosity:+0.09, trust:+0.09, problemAwareness:+0.06 },
          why: 'You spoke to the role, not the company. People relax when they recognise themselves in the question.' },
        { text: '"That sounds painful. Is it something you are actively trying to fix this year, or is it more of a someday thing?"',
          move: 'tight_q', eff: { curiosity:+0.06, problemAwareness:+0.04, interest:+0.02 },
          why: 'A decent filter question, but it invites a comfortable yes. It asked about intent, not reality.' },
        { text: '"Totally — and this is exactly what we solve. We had a similar company cut their cycle time by half."',
          move: 'pitch', eff: { interest:-0.06, curiosity:-0.12, problemAwareness:-0.04, patience:-0.06 },
          why: 'You jumped on their answer instead of digging. Whatever they said next was shaped by your pitch, not their problem.' }
      ];
    }

    /* --- 3. Objection moments — the centrepiece --- */
    if (kind === 'objection') {
      var o = h.realObjection;
      var surf = o.surfaceText || o.surface;
      line = p.name.split(' ')[0] + ': "' + surf + '"';
      var aboutToPush = ctx.pushedOnce;
      options = [
        { text: 'Ask what they mean by it — specifically — before responding at all. "When you say budget, is it that the problem is not big enough to justify spend, or that the money is already spoken for?"',
          move: 'isolate', eff: { curiosity:+0.14, trust:+0.10, problemAwareness:+0.05, objectionsIsolated:+1 },
          why: 'Isolation. An objection is information until you know which one it is. Guessing is how reps argue with the wrong person.' },
        { text: 'Answer it immediately with the strongest proof point you have.',
          move: 'reframe', eff: { trust:-0.04, skepticism:-0.02, curiosity:-0.06, patience:-0.08 },
          why: 'You rebutted before you knew what the objection actually was. Often you were arguing with a headwind they never raised.' },
        { text: 'Label it and stay: "It sounds like this has been on the list and it keeps not being the priority."',
          move: 'label', eff: { trust:+0.11, curiosity:+0.08, patience:-0.02 },
          why: 'Labelling is powerful but it is an assumption. If wrong, it becomes the thing they push back against.' },
        { text: 'Accept it cleanly: "That makes sense — it sounds like this is not a priority for you right now. I will stop wasting your time."',
          move: 'concede', eff: { patience:+0.22, trust:+0.10, interest:-0.12, respect:+1 },
          why: 'Sometimes this is exactly right. But conceding before you checked whether the objection was real costs you the ones that were winnable.' }
      ];
      /* situational twist: if they already pushed back once, the "reframe" option gets harsher */
      if (aboutToPush) {
        options[1].text = 'Push harder — "I hear you, but if we could show you the number, would that change anything?"';
        options[1].move = 'push';
        options[1].eff = { patience:-0.22, trust:-0.12, interest:-0.02, mood:+0.25 };
        options[1].why = 'Second pressure without new information. This is where most real deals die.';
      }
    }

    /* --- 4. Close moments --- */
    if (kind === 'close') {
      line = p.name.split(' ')[0] + ' pauses. "So — what happens from here?"';
      var warm = h.interest > 0.45;
      options = [
        { text: warm
            ? 'Ask directly for 20 minutes with the person who owns the outcome, and offer two times.'
            : 'Ask directly: "Would it be worth 20 minutes with whoever owns this, to see if it is even worth solving?"',
          move: 'ask_close', eff: { interest:+0.10, trust:+0.05, meetings:+1 },
          why: 'A direct, low-risk ask. You made it about their problem, not your demo.' },
        { text: '"If I sent you three things, would you look at them?"',
          move: 'concede', eff: { patience:+0.12, interest:-0.05 },
          why: 'A safe ending. Low risk, near-zero upside, and you learned nothing about whether they had a problem.' },
        { text: 'Assume the yes: "I will send over a Tuesday at 2 — does that work?"',
          move: 'assumptive_close', eff: { interest:+0.05, patience:-0.12, trust:-0.06 },
          why: 'Premature. An assumptive close works when commitment is already visible. Used early, it reads as pressure.' },
        { text: 'Ask permission for next steps: "Would it be crazy to look at this together for 20 minutes next week?"',
          move: 'ask_time', eff: { trust:+0.10, interest:+0.03 },
          why: 'Permission framing lowers the stakes and genuinely raises the odds with a sceptical buyer. Slightly weaker than a clean direct ask with a hot prospect.' }
      ];
    }

    /* --- 5. Technical / product honesty moments --- */
    if (kind === 'technical') {
      line = p.name.split(' ')[0] + ': "' + (ctx.q || 'How does this actually work with our data?') + '"';
      var knowIt = ctx.playerTech; /* derived from productKnowledge skill */
      options = [
        { text: 'Give a short, accurate high-level answer, then ask about their architecture before going further.',
          move: 'honest_limit', eff: { trust:+0.15, curiosity:+0.06 },
          why: 'The correct instinct: answer what you know, then hand the rest to someone who does.' },
        { text: 'Bluff a confident technical answer to keep momentum.',
          move: 'overreach', eff: { trust:-0.18, skepticism:+0.14, patience:-0.10 },
          why: 'Technical buyers check. One confident wrong sentence costs you the deal and your credibility.' },
        { text: 'Deflect: "That is a great question, let me have our solutions engineer follow up."',
          move: 'concede', eff: { trust:+0.02, curiosity:-0.04, patience:+0.05 },
          why: 'Reasonable, but too early — you had not even tried the easy part, and it looks like you were hiding.' },
        { text: 'Over-explain the architecture, including integrations you do not know are relevant to them.',
          move: 'feature', eff: { curiosity:-0.10, patience:-0.14, trust:-0.04 },
          why: 'Depth without relevance reads as insecurity. The buyer is now doing your job.' }
      ];
    }

    /* --- 6. Disqualify / exit moment --- */
    if (kind === 'exit') {
      line = 'There is a long pause on the line.';
      options = [
        { text: 'Name it honestly: "I do not think this is a fit for you right now, and I would rather say that than waste your time."',
          move: 'concede', eff: { trust:+0.20, respect:+1, interest:-0.10 },
          why: 'Honest disqualification is a skill. It protects your week and it protects your reputation with the people who will buy from you in two years.' },
        { text: 'Keep pushing — "Come on, let me show you what it could look like first."',
          move: 'push', eff: { patience:-0.25, trust:-0.18, mood:+0.3 },
          why: 'You are now the person who wasted their time. Some accounts recover; most do not.' },
        { text: 'Ask for the referral: "Who else there is dealing with this?"',
          move: 'tight_q', eff: { trust:+0.02, interest:+0.03 },
          why: 'Not wrong, but wrong order. You asked them to do you a favour while you had just decided they are a bad fit.' },
        { text: 'Leave the door open with a scheduled follow-up in three weeks.',
          move: 'ask_time', eff: { trust:+0.05, patience:+0.06 },
          why: 'Reasonable middle path — but only if you are genuinely willing to work it later.' }
      ];
    }

    /* --- 7. Re-engagement moments (follow-up on a ghosted contact) --- */
    if (kind === 'reengage') {
      line = p.name.split(' ')[0] + ' replies to your follow-up: "' +
        (ctx.msg || 'Not ignoring you — just buried. What did you actually want to talk about?') + '"';
      options = [
        { text: 'Reference the specific thing they told you last time, and say what you did about it.',
          move: 'check', eff: { trust:+0.16, curiosity:+0.10, interest:+0.08, reengaged:+1 },
          why: 'Memory is the most underrated sales skill. Proof you listened is worth more than any opener.' },
        { text: 'Resend the one-pager with no reference to the last call.',
          move: 'scripted', eff: { trust:-0.08, curiosity:-0.06, interest:-0.04 },
          why: 'They replied to a person, not a document. This is how you teach a prospect you do not care.' },
        { text: 'Ask again for the meeting immediately, as if no time has passed.',
          move: 'ask_close', eff: { interest:+0.04, patience:-0.10, trust:-0.04 },
          why: 'Efficient, slightly tone-deaf. You skipped over the fact that they had to take time to reply to you at all.' },
        { text: 'Ask what changed since we spoke — give them an easy exit if nothing has.',
          move: 'question', eff: { curiosity:+0.11, trust:+0.07, patience:+0.04 },
          why: 'Good — it makes ghosting easy to decline and honesty easy to answer.' }
      ];
    }

    /* Randomized positions — the strongest fit is never in a fixed slot. */
    var order = S.shuffle([0,1,2,3]);
    return { line: line, options: options, order: order, kind: kind, cues: S.perceived(p) };
  };

  /* ---------------- turn resolution ---------------- */
  S.resolveTurn = function (p, ctx, moment, chosen) {
    var skillAvg = 0;
    S.SKILLS.forEach(function (k) { });
    var relevant = ctx.skillFocus || ['listening','empathy','curiosity'];
    skillAvg = relevant.reduce(function (a, k) { return a + (p._state ? 0 : 0); }, 0);
    return null;
  };

  /* Habits are the hidden player model the manager reads. */
  S.HABIT_MAP = {
    permission:'respectsTime', label:'listens', mirror:'listens', question:'asksQuestions',
    tight_q:'asksQuestions', pain_q:'asksQuestions', stack_q:'asksQuestions',
    pitch:'pitchesEarly', feature:'overexplains', value:'valueArticulation',
    question_back:'listens', reframe:'pushesObjections', concede:'respectsTime',
    isolate:'probesObjections', assumptive_close:'asksBadTime', ask_close:'asksForMeeting',
    ask_time:'respectsTime', honest_limit:'professionalism', overreach:'rushToPitch',
    push:'pushesObjections', empathy:'listens', scripted:'scripts', check:'listens'
  };

  S.scoreOption = function (st, p, moment, opt, ctx) {
    ctx = ctx || {};
    var h = p.hidden;
    var move = opt.move;
    var eff = opt.eff || {};
    var sim = {};
    Object.keys(eff).forEach(function (k) { if (k !== 'reflections') sim[k] = eff[k]; });

    /* Player skill modulates. Not a replacement for judgment. */
    var skillKeys = {
      permission:['professionalism','research'], label:['empathy','listening'], mirror:['listening'],
      question:['curiosity','discovery'], tight_q:['qualification'], pain_q:['discovery','businessAcumen'],
      stack_q:['productKnowledge','businessAcumen'], pitch:['callControl'],
      feature:['callControl','communication'], value:['valueArticulation','businessAcumen'],
      question_back:['callControl'], reframe:['objectionHandling','communication'],
      concede:['ethicalJudgment','qualification'], isolate:['qualification','objectionHandling'],
      assumptive_close:['callControl'], ask_close:['callControl','qualification'],
      ask_time:['callControl','listening'], honest_limit:['productKnowledge','professionalism'],
      overreach:['confidence'], push:['callControl'], empathy:['empathy'],
      scripted:['communication'], check:['listening']
    }[move] || ['communication'];

    var sk = skillKeys.reduce(function (a, k) { return a + (st.skills[k] || 1); }, 0) / skillKeys.length;
    var skillMul = 0.78 + sk * 0.045;   /* 1.0 ≈ skill 5 */

    /* Situational fit: an "isolate" move on someone who has surfaced no objection is a
       non-sequitur; a "concede" on a blazing hot prospect throws away heat. */
    var o = h.realObjection;
    var fit = 1;
    if (move === 'isolate' && h.surfacedObjection === null) fit *= 0.55;
    if (move === 'concede' && h.interest > 0.7 && h.skepticism < 0.5) fit *= 0.40;
    if (move === 'push' && h.patience < 0.4) fit *= 0.6;
    if (move === 'label' && h.trust < 0.3) fit *= 0.7;
    if (move === 'assumptive_close' && h.interest < 0.35) fit *= 0.6;
    if (move === 'ask_close' && h.interest < 0.15) fit *= 0.7;
    if (move === 'value' && h.problemAwareness < 0.35) fit *= 0.7;
    if (move === 'pain_q' && h.problemAwareness > 0.7) fit *= 1.15;
    if (move === 'overreach' && ctx.kind !== 'technical') fit *= 0.7;

    /* --- Contribution model. Each option earns (or spends) across the variables that
       actually decide this call. Diminishing returns on relationship-building so that
       "be nice" cannot beat "be right" once you are already trusted. --- */
    var contrib = 0;
    var dTrust = eff.trust || 0;
    var dCuri  = eff.curiosity || 0;
    var dInter = eff.interest || 0;
    var dPat   = eff.patience || 0;
    var dAw    = eff.problemAwareness || 0;

    /* trust and curiosity are the compounding pair; interest matters most late */
    contrib += dTrust  * (1.4 - h.trust * 0.8);
    contrib += dCuri   * (0.8 + h.openness * 0.9);
    contrib += dInter  * (0.5 + h.curiosity * 0.5) * (1.3 - h.competitiveLoyalty * 0.6);
    contrib += dAw     * 1.2;
    /* patience is a budget you only spend if you bought something with it */
    contrib += dPat   * (0.4 + dTrust * 2 + dCuri * 2);

    /* --- Move-specific judgement. These are the reasons two plausible answers differ. --- */
    if (move === 'isolate') {
      /* highest value when there is a real, un-isolated, deep objection — and near-zero
         value when the objection is a polite brush-off you should just accept. */
      contrib += o && !o.isolated && o.depth === 'deep' ? 0.30 : -0.12;
      if (o && o.depth === 'shallow') contrib -= 0.10;
    }
    if (move === 'concede') {
      /* right when the account is genuinely poor or they are already hostile;
         expensive when there is heat or a real problem you have not yet diagnosed. */
      var poor = (h.problemAwareness < 0.3) || p.mood > 0.5 || h.skepticism > 0.85;
      var heat = h.interest > 0.45 || h.curiosity > 0.5;
      contrib += poor ? 0.34 : -0.18;
      contrib -= heat ? 0.16 : 0;
      if (o && !o.isolated && o.depth === 'deep') contrib -= 0.22;
    }
    if (move === 'reframe') {
      /* rebutting before you understand is the classic rookie failure */
      contrib += (o && o.isolated) ? 0.16 : -0.14;
    }
    if (move === 'label') {
      contrib += (h.trust > 0.45 ? 0.14 : -0.10);
      contrib += dCuri * 1.2;
    }
    if (move === 'push') {
      contrib += (h.trust > 0.6 && h.patience > 0.4) ? 0.06 : -0.28;
    }
    if (move === 'pitch' || move === 'value') {
      /* early is bad, after a real problem is articulated is merely early */
      contrib += h.problemAwareness > 0.55 ? 0.10 : -0.20;
    }
    if (move === 'feature') {
      contrib -= 0.18;
      if (p.department === 'Technology' || p.department === 'Security') contrib -= 0.14;
    }
    if (move === 'pain_q') contrib += 0.14;
    if (move === 'stack_q') contrib += 0.10;
    if (move === 'permission') contrib += 0.08 + (p.researched ? 0.14 : 0);
    if (move === 'question' || move === 'tight_q') contrib += 0.06;
    /* an honest, low-friction question about what changed is a strong re-engagement
       move in its own right — it must be competitive with the memory reference */
    if (move === 'question') contrib += p.memory.calls > 1 ? 0.14 : 0;
    if (move === 'check') {
      /* referencing what they told you last time is powerful — but it is meaningless
         on a first contact, and it wears thin if you have nothing specific to cite */
      var canCite = p.memory.statedPriorities.length > 0;
      contrib += canCite ? 0.20 : -0.18;
      contrib += p.memory.calls > 1 ? 0.04 : 0;
    }
    if (move === 'ask_close') contrib += h.interest > 0.45 ? 0.24 : 0.02;
    if (move === 'ask_time') contrib += h.trust > 0.5 ? 0.14 : 0.04;
    if (move === 'assumptive_close') contrib += h.interest > 0.6 ? 0.14 : -0.20;
    if (move === 'honest_limit') contrib += 0.20 + (ctx.kind === 'technical' ? 0.08 : 0);
    if (move === 'overreach') contrib -= 0.30;
    if (move === 'scripted') {
      contrib -= 0.16 + (p.memory.calls > 0 ? 0.14 : 0) + p.memory.soundedScripted * 0.03;
    }
    if (move === 'empathy' || move === 'mirror') contrib += 0.06 + dTrust * 1.2;
    if (move === 'question_back') contrib += h.patience < 0.4 ? 0.14 : 0.02;
    if (move === 'isolate') { /* handled above */ }
    if (move === 'ask_close' && h.interest < 0.15) contrib -= 0.12;

    var score = contrib * skillMul * (0.55 + fit * 0.45);

    return { score: score, sim: sim, skillMul: skillMul, fit: fit, move: move, skillKeys: skillKeys };
  };

  S.applyOption = function (st, p, ctx, moment, opt, scored) {
    var changed = S.applyEffects(p, scored.sim, 5);
    var habit = S.HABIT_MAP[opt.move];
    if (habit) st.habits[habit] = (st.habits[habit] || 0) + 1;
    /* skill growth comes from difficulty + quality, not from winning */
    var growth = opt.move === 'overreach' ? 0 : (opt.move === 'push' ? 0.4 : 1);
    scored.skillKeys.forEach(function (k) {
      if (growth >= 1 && S.chance(0.30 * growth)) st.skills[k] = S.clamp(st.skills[k] + 0.06, 1, 20);
    });
    if (scored.sim.meetings) st.metrics.meetingsBooked += 0;
    if (scored.sim.reengaged) st.metrics.reengaged += 1;
    if (scored.sim.objectionsIsolated) st.metrics.objectionsIsolated += 1;
    return changed;
  };
})();