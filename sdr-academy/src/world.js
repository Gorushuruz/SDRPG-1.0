/* SDR Academy — curriculum, manager, day loop. */
(function () {
  var S = window.SDRA;

  /* ---------------- Sales Academy ---------------- */
  S.LESSONS = [
    { id:1, t:'What Sales Actually Is', req:0,
      body:'You are not selling software. You are trying to earn the right to spend eleven minutes of a stranger\'s attention, then ten more. Most of the job is the first eleven minutes.\n\nThe second half of the job is knowing when to stop. Reps who cannot disqualify are reps who fill their calendar with meetings that will never become anything, and then their manager stops believing their numbers.' },
    { id:2, t:'What an SDR Does', req:0,
      body:'An SDR creates qualified pipeline. That is the whole job description.\n\nYou research accounts, you reach people, you learn whether they have a problem worth solving, who owns it, and whether anything can happen in the next ninety days. Then you create a meeting that an account executive can actually work.\n\nAn SDR is not a gatekeeper with a quota. A meeting with no pain, no authority and no timeline is not pipeline — it is a calendar invitation.' },
    { id:3, t:'ICP: Who You Are Looking For', req:60,
      body:'An Ideal Customer Profile is a description of the accounts most likely to succeed with your product and to expand.\n\nIt is built from four things: firmographics (size, industry, region), technographics (stack, existing tools, maturity), pain signals (what hurts that you fix), and trigger events (why now — an acquisition, a new executive, a compliance deadline).\n\nAn ICP is a filter that lets you say no. If your criteria cannot disqualify an account, they are not an ICP — they are a wish.' },
    { id:4, t:'Personas', req:100,
      body:'A persona is the person who has the problem, feels it, and can move on it.\n\nIn B2B tech, the same company has four personas who care about four different outcomes: the CTO cares about architecture and risk, the CFO cares about payback, the VP Ops cares about throughput and headcount, security cares about evidence.\n\nThe most common rookie error is treating them as interchangeable. The second most common is picking the loudest one instead of the one who can actually say yes.' },
    { id:5, t:'Account Research', req:140,
      body:'Research is not reading the website. It is forming hypotheses you can test on the call.\n\nLook for: a recent event (funding, acquisition, new executive, expansion), hiring (what roles, what does that imply about pressure), technology signals (job postings naming your competitor, a case study in their industry), and language you can reuse.\n\nThe goal of research is to have something specific to say and something specific to ask. If your opener would work for anyone in any industry, you have not researched, you have decorated.' },
    { id:6, t:'Pain vs Symptom', req:200,
      body:'A symptom is what they complain about. Pain is the business consequence of that symptom.\n\n"Reporting takes three days" is a symptom. "Three days means the board gets numbers two weeks late, which has happened four times this year" is pain.\n\nSymptoms are cheap to fix and nobody budgets for them. Pain has a number attached, and numbers are what get approved.' },
    { id:7, t:'Business Impact', req:260,
      body:'Impact is pain multiplied by frequency and by who feels it.\n\nYou do not need the exact figure. You need the shape: who pays, how often, and what it costs them to be wrong. A rep who can say "this is costing you roughly the equivalent of two FTEs in rework, every cycle" has done more than a rep with a perfect deck.\n\nThe question to learn: what happens if this is still true in twelve months?' },
    { id:8, t:'Cold Call Fundamentals', req:320,
      body:'The call has a shape: reason for call, permission, relevance, discovery, close.\n\nThe first ten seconds decide whether the other eleven minutes exist. You are interrupting someone, so you owe them a reason that is about them.\n\nDo not ask permission to "take a moment of their time". Ask permission to ask a question — it is a smaller ask, and it gets a real answer more often.' },
    { id:9, t:'Openers', req:360,
      body:'An opener is not a script. It is a reason for them to stay on the line that is true and specific.\n\nStrong openers name a change, a gap, or a pattern. Weak openers name your category. "I sell AI to manufacturers" tells a manufacturer nothing they do not already know.\n\nThe test: would this sentence make sense if said to someone who had nothing to do with your product?' },
    { id:10, t:'Pattern Interrupts', req:400,
      body:'A pattern interrupt breaks the pattern they expect from a vendor.\n\nVendors call with a compliment, a question, and a demo request. Anything that breaks that sequence earns you attention — but it only works once per prospect. Used repeatedly it becomes its own pattern and reads as manipulative.' },
    { id:11, t:'Discovery', req:450,
      body:'Discovery is not an interview. It is building on what they just said.\n\nThe difference is audible. An interrogation asks the same six questions in the same order regardless of the answer. Discovery follows the thread: they mention a delay, you ask where the delay originates; they mention a team, you ask about that team.\n\nAsk about the last time it happened, not what they usually do. Past behaviour is specific; hypotheticals are polite.' },
    { id:12, t:'Qualification', req:520,
      body:'Qualification asks whether anything can realistically happen. Five questions, in this order:\n\n1. Do they have a problem? 2. How big is it? 3. Do they know they have it? 4. Is there a next step and a date? 5. Who else is involved?\n\nYou are not trying to be liked. You are trying to be right. A rep who disqualifies accurately will always out-produce a rep who fills their calendar, because their conversion rates — and therefore their credibility — are higher.' },
    { id:13, t:'Objection Handling', req:600,
      body:'An objection is information. Until you know what kind, it is not yet an argument you can have.\n\nClassify first: is it real? Is it about the solution, the process, or the person? Then decide the response: explore it, isolate it, resolve it, accept it, defer it, escalate it, or disqualify on it.\n\nThe most common failure is not a bad rebuttal. It is rebutting before you understand — pushing through a headwind the prospect never raised, while the real one went untouched.' },
    { id:14, t:'Cold Email', req:700,
      body:'An email gets replied to when it is obviously about them, obviously short, and obviously easy to answer.\n\nStructure: subject that names a real pattern, first line proving you know their situation, one problem, one idea, one ask.\n\nPersonalisation is not the first name. If you could send it to every company in an industry, it is not personalised — it is a mail merge with a nicer vocabulary.' },
    { id:15, t:'Follow-Up', req:800,
      body:'Most deals are not lost at the close. They are lost in the silence after it.\n\nA follow-up must add something. A new angle, a relevant piece, a question you did not ask before. "Just bumping this" trains people to ignore you, because that is exactly what it trains them to do.\n\nAlso: follow up on time. A promise you miss costs more trust than a promise you never made.' },
    { id:16, t:'Multichannel Outreach', req:900,
      body:'Different people are reachable in different places. A person who ignores calls will answer a LinkedIn message. A person who ignores email will pick up on the fourth attempt.\n\nSequencing should adapt: after a live conversation, an email that references the call. After silence, change the angle rather than the volume. Respect an opt-out permanently — one email after a "not interested" is how a deal that could have returned in six months dies forever.' },
    { id:17, t:'Meeting Setting', req:1000,
      body:'A booked meeting is not a win until it is qualified. Did they have a problem, do they own the outcome, is there a next step, are there others involved?\n\nOffer two specific times rather than asking what works — an open question hands the work back to them, and they will choose "never".\n\nMeetings that are not qualified are pipeline theatre. They look good in the weekly report and they teach the AE that your meetings are worthless.' },
    { id:18, t:'Pipeline Management', req:1100,
      body:'If it is not in the CRM, it does not exist.\n\nNot because of the tool. Because the CRM is how a team agrees on what is true. Two reps who remember different things about the same account will make different promises.\n\nLog the problem, the impact, the stakeholders, the objection, the next step and the date. If you cannot write the next step, the conversation did not produce one.' },
    { id:19, t:'Enterprise Prospecting', req:1300,
      body:'In enterprise, one contact is a data point. A committee is the deal.\n\nMap the roles: the economic buyer, the champion, the technical evaluator, the blocker, the procurement. Each one optimises for something different and none of them will tell you the others\' priorities.\n\nThe play is multithreading: get one person to introduce you to the next, legitimately. Exceeding one person\'s authority without them is how deals die quietly at the internal review meeting.' },
    { id:20, t:'Field-Ready SDR', req:1800,
      body:'Certification is demonstrated, not accumulated.\n\nYou will be assessed on research, ICP judgement, opener discipline, discovery depth, objection isolation, qualification honesty, follow-up, CRM discipline, meeting quality, multithreading, business acumen, technical honesty and ethics — across a live sequence of encounters, including at least one where the right answer is to disqualify.\n\nPassing is not automatic. Run the assessment when your history says you are ready.' }
  ];

  S.lessonById = function (id) {
    return S.LESSONS.filter(function (l) { return l.id === id; })[0];
  };
  S.unlockLessons = function (st) {
    var newly = [];
    S.LESSONS.forEach(function (l) {
      if (st.lessonsUnlocked.indexOf(l.id) < 0 && st.xp >= l.req) {
        st.lessonsUnlocked.push(l.id); newly.push(l);
      }
    });
    return newly;
  };

  /* ---------------- Manager: Dana Reyes ---------------- */
  S.MANAGER = {
    name: 'Dana Reyes', title: 'Regional Sales Director',
    voice: 'direct, unsentimental, remembers everything'
  };

  S.managerBrief = function (st) {
    var m = S.MANAGER;
    var target = S.weeklyTarget(st.level);
    var doneToday = st.todayStats ? st.todayStats.dials : 0;
    var lines = [];
    if (st.day === 1) {
      lines.push('"' + m.name + '" drops a printed list on your desk. "Twenty-five accounts. Your call block starts in twenty minutes."');
      lines.push('She does not sit down. "Before you touch the phone — tell me who we are actually trying to reach."');
      return lines;
    }
    /* Habit-based coaching from the hidden player model */
    lines.push(m.name + ' catches you at your desk with coffee.');
    if (st.habits.pitchesEarly > st.habits.asksQuestions + 2)
      lines.push('"You are pitching before they finish answering. Every time. Watch what happens to their answers — you are shaping them."');
    else if (st.habits.pushesObjections > st.habits.probesObjections + 2)
      lines.push('"You push through objections instead of finding out what they are. Sometimes there is nothing behind them. Sometimes there is everything."');
    else if (st.habits.scripts > 3)
      lines.push('"You sound like a recording. I can hear the seams. Nobody trusts a recording."');
    else if (st.habits.asksForMeeting > 4)
      lines.push('"Good — you are asking. Now listen to how they say yes. Some of them are relieved."');
    if (st.metrics.meetingsBooked > 0 && st.metrics.qm === 0)
      lines.push('"You have meetings and zero qualified ones. Ask me what that is."');
    if (st.metrics.honestDQ >= 1)
      lines.push('"You disqualified one. Thank you. That is the single most senior thing anyone on this floor did today."');
    lines.push('"Target this week: ' + target + ' dials. Dials, not meetings. Quality is a separate argument."');
    return lines;
  };

  S.managerReview = function (st) {
    var ts = st.todayStats || { dials: 0, connects: 0, meetingsBooked: 0, pos: 0 };
    var out = [];
    var m = S.MANAGER;
    if (ts.dials === 0) {
      out.push(m.name + ' does not say anything. She just looks at your list. "Nothing. You had eight hours."');
      st.morale = S.clamp(st.morale - 4, 0, st.moraleMax);
      return out;
    }
    var conn = ts.dials ? (ts.connects / ts.dials) : 0;
    out.push(m.name + ' reads your numbers. "Today: ' + ts.dials + ' dials, ' + ts.connects + ' connects, ' + ts.meetingsBooked + ' meetings."');
    if (conn < 0.25 && ts.dials > 10)
      out.push('"Connect rate is low. Before you blame the list — did you do the research, or did you just start dialling?"');
    else if (conn > 0.5 && ts.meetingsBooked === 0)
      out.push('"You connected plenty and got nothing. Either your opener is too soft or you are talking to people who do not have the problem."');
    else if (ts.meetingsBooked > 2)
      out.push('"That is a good day. Now ask yourself whether any of those meetings had a problem attached to them."');
    if (st.metrics.honestDQ > 0) out.push('"You disqualified. Good. Remember how that felt — that is the job."');
    if (st.streak >= 2) out.push('"You are on a run. Do not let it make you sloppy."');
    if (st.energy < 30) out.push('"You sound fried. Prospecting is attention, not volume. Go home."');
    return out;
  };

  /* ---------------- Random events ---------------- */
  S.RANDOM_EVENTS = [
    { id:'promoted', text:'A contact you know has been promoted. Their whole world just changed.',
      apply:function(st, p){ p.title = p.title.replace('Director','Senior Director'); p.authority = Math.min(1, p.authority + 0.1); p.notes.push('Got promoted.'); } },
    { id:'left', text:'A contact replies from a personal address: "Last week. Thanks for being easy to work with."',
      apply:function(st, p){ p.stage = 'dead'; p.companyName = 'gone'; p.dead = true; p.notes.push('Left the company.'); st.metrics.reengaged += 0; } },
    { id:'freeze', text:'An account announces a change freeze until the fiscal year ends.',
      apply:function(st, p){ p.hidden.timePressure = 0.1; p.hidden.urgency *= 0.4; p.notes.push('Change freeze.'); } },
    { id:'news', text:'An account announces expansion into two new regions.',
      apply:function(st, p){ p.hidden.urgency = S.clamp(p.hidden.urgency + 0.2, 0, 1); p.hidden.budgetConfidence = S.clamp(p.hidden.budgetConfidence + 0.15, 0, 1); p.notes.push('Expanding.'); } },
    { id:'champion_left', text:'Your best contact left the company. The project dies with them.',
      apply:function(st, p){ p.relationship = 'STRANGER'; p.stage = 'touched'; p.hidden.politicalRisk = S.clamp(p.hidden.politicalRisk + 0.4, 0, 1); p.notes.push('Champion left.'); } },
    { id:'budget', text:'An account cuts discretionary spend after a bad quarter.',
      apply:function(st, p){ p.hidden.budgetConfidence *= 0.5; p.notes.push('Budget frozen.'); } },
    { id:'new_exec', text:'A new executive arrives and immediately asks for a vendor review.',
      apply:function(st, p){ p.hidden.problemAwareness = S.clamp(p.hidden.problemAwareness + 0.25, 0, 1); p.hidden.skepticism = Math.max(0.1, p.hidden.skepticism - 0.2); p.notes.push('New exec wants a review.'); } },
    { id:'blocked', text:'An account\'s security team blocks AI pilots until next year.',
      apply:function(st, p){ p.stage = 'disqualified'; p.notes.push('Security block.'); } },
    { id:'reply', text:'A prospect who never answered you replies to your third email.',
      apply:function(st, p){ p.stage = 'nurture'; p.hidden.interest = S.clamp(p.hidden.interest + 0.15, 0, 1); p.notes.push('Replied late.'); } },
    { id:'forward', text:'A prospect forwards your email to their boss. You are now in a room you did not prepare for.',
      apply:function(st, p){ p.hidden.authority = S.clamp(p.hidden.authority + 0.2, 0, 1); p.stage = 'engaged'; p.notes.push('Forwarded internally.'); } }
  ];

  S.rollEvent = function (st) {
    if (!S.chance(0.4)) return null;
    var ev = S.pick(S.RANDOM_EVENTS);
    var pool = st.prospects.filter(function (p) { return !p.dead && p.stage !== 'disqualified'; });
    var p = pool.length ? S.pick(pool) : null;
    if (!p) return null;
    ev.apply(st, p);
    S.addJournal(st, 'Day ' + st.day + ': ' + p.name + ' — ' + ev.text, 'event');
    return { ev: ev, prospect: p };
  };

  /* ---------------- Day loop ---------------- */
  S.startDay = function (st) {
    st.energy = st.energyMax;
    st.focus = st.focusMax;
    st.todayStats = { dials: 0, connects: 0, pos: 0, meetingsBooked: 0, emails: 0, replies: 0, xp: 0, disqual: 0 };
    st.today = { day: st.day, week: st.week };
    st.inbox = [];
    /* fresh accounts keep the world alive */
    if (st.prospects.filter(function (p) { return !p.dead && p.stage !== 'disqualified'; }).length < 8) {
      for (var i = 0; i < 4; i++) S.spawnAccount(st, true);
    }
    var newly = S.unlockLessons(st);
    return { newly: newly };
  };

  S.spawnAccount = function (st, silent) {
    var co = S.makeCompany();
    var n = S.rint(1, 3);
    var out = [];
    for (var i = 0; i < n; i++) {
      var p = S.makeProspect(co);
      p.companyName = co.name;
      p.hidden._company_pains = co.pains;
      st.prospects.push(p); out.push(p);
    }
    st.accounts.push(co);
    if (!silent) S.addJournal(st, 'New account assigned: ' + co.name + ' (' + co.industry + ', ' + co.employees + ' employees).', 'account');
    return out;
  };

  S.endDay = function (st) {
    var ts = st.todayStats || { dials: 0, connects: 0, pos: 0, meetingsBooked: 0, emails: 0, replies: 0, xp: 0, disqual: 0 };
    var xp = 0;
    xp += ts.dials * 1.2;
    xp += ts.connects * 3;
    xp += ts.pos * 4;
    xp += ts.meetingsBooked * 9;
    xp += ts.emails * 0.8;
    var res = S.awardXp(st, Math.round(xp));
    if (ts.dials >= 20) st.metrics.daysWon++; else st.metrics.daysLost++;
    st.day++;
    /* Weekly quota is measured on dials actually made. Accumulate across the week
       before the rollover check, otherwise the week is always judged on zero. */
    st._weekDials = (st._weekDials || 0) + ts.dials;
    if ((st.day - 1) % 5 === 0) {
      var target = S.weeklyTarget(st.level);
      st.week++;
      var hit = st._weekDials >= target;
      st.weekHistory.push({ week: st.week, dials: st._weekDials, target: target, hit: hit });
      if (hit) { st.quotaMet++; st.streak++; }
      else { st.quotaMissed++; st.streak = 0; }
      st._weekDials = 0;
    }
    if (st.level >= 3 && st.day > 5) st.flags.careerModeUnlocked = true;
    var ach = S.checkAchievements(st);
    return { xp: Math.round(xp), res: res, achievements: ach, weekEnded: (st.day - 1) % 5 === 0 };
  };
})();