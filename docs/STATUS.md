# Build status — SDR Academy

Built against the design brief (78 sections, stages 1-8 per section 70).
Priorities honoured in the brief's order: fun, realism, educational value,
replayability, persistence, visual polish.

**Shell access worked this run.** Everything below was executed and tested, not
speculated. `node test/harness.js`, `node test/balance.js`, `node test/career.js`
and `node test/uitest.js` all pass.

---

## PLAYABLE NOW (verified end to end)

### Core loop
- New career starts on **Day 1, 09:03**, with the manager's briefing and the
  question "who are we actually trying to reach?" No tutorial dump.
- Manager briefing at the start of each day, drawn from your **hidden habit
  model** (do you pitch early, push past objections, sound scripted, ask for
  meetings, respect time).
- Work the list, open a contact, research the account, call, debrief, repeat.
- **End the day** -> XP, level, title, weekly quota, day/week rollover.
- Manager end-of-day review that reads your actual numbers.
- Random world events (promotions, job changes, change freezes, budget cuts,
  champions leaving) that mutate accounts and prospects.

### Conversation engine (the centrepiece)
- **Exactly four choices, always, in a verified 2x2 grid.** Browser test
  asserts 4 nodes, 2 rows, 2 per row, two distinct x positions on the top row,
  minimum tap target 162x106 CSS px on a 390px viewport, no horizontal
  overflow.
- **Positions shuffled every encounter** — all 24 permutations occur.
- **No option is ever labelled** correct / incorrect / best / worst. Asserted.
- **Hidden variables are never rendered.** Only social cue lines.
- **Seven moment types** with distinct, contextual four-choice sets: opener,
  discovery, objection, close, technical, exit, re-engagement.
- Voice is broken and human: "…hello?", "This better be quick.", "Can you make
  this fast? Honestly, this is not the quarter for us.", "Whoa — hold on."

### Sales logic
- 15 prospect archetypes, 20 roles, 16 objection categories, 20 industries,
  procedural companies. Archetypes are weightings, not stereotypes: a skeptical
  CTO can still become a champion.
- Per-prospect hidden state: trust, curiosity, interest, patience, skepticism,
  problem awareness, political risk, competitive loyalty, budget confidence,
  authority, urgency.
- **Same choice, different prospect, different result** — driven by hidden state
  and situational fit, not a random roll.
- Objection **isolation** vs **rebuttal** vs **concession** are mechanically
  distinct, and the debrief explains which one you took and what it cost.
- Honest disqualification is rewarded (`Good Disqualifier` achievement).
- 21 skills that gate coaching quality and certification readiness, plus a
  hidden habit model the manager reads.
- Full outcome taxonomy: meeting, qualified opp, referral, requested info,
  reconnect later, nurture, bad timing, not a fit, no problem, competitor locked
  in, security block, burned relationship, ghosted, not interested.

### Verified balance (30-week simulated careers, 7560 dials each)

| Player | Connect | Meetings / connect | Qualified opps | Burned/ghosted |
|---|---|---|---|---|
| Skilled | 23% | **6.2%** | 102 | 0 |
| Random | 37% | **1.0%** | 17 | 13 |
| Blundering | 37% | **0.0%** | 0 | 520 |

Skill dominates over a large sample, and a mediocre player still occasionally
lands one (a small luck floor exists by design). A full 30-week skilled career
reaches Level 19, Enterprise SDR, ~$3.5M pipeline, hits 13/13 achievements and
unlocks 20/20 lessons.

### Persistence
- Autosaves on every action; **verified surviving a real page refresh** in
  Chrome (day, XP, dial count and prospect count all identical after reload).
- Export / import save, IndexedDB fallback, reset guarded by two confirmations
  (**verified: dismissing both preserves the career**).

### Academy
- 20 lessons from "What Sales Actually Is" to "Field-Ready SDR", unlocked
  naturally by XP, written as judgement rather than scripts.
- Skills screen with 21 bars, habit list, 13 achievements.

---

## PARTIALLY IMPLEMENTED

- **Research** is a single action that costs focus and reveals account intel.
  The brief wants a prioritisation game (choose *what* to research under a time
  budget) — not built.
- **Accounts** show company intel and multiple contacts per company, and a
  referral creates a real second contact at the same account. But there is no
  deliberate multithreading loop or buying-committee map screen.
- **Pipeline** records qualified opportunities and their value, and the Stats
  funnel reads from them. No CRM editing, tasks, or opportunity stage movement.
- **Voicemail** exists as a branch with a coaching debrief, but there is no
  email, LinkedIn, or multichannel sequence system yet. Dials only.
- **Meeting-setting** exists inside the call. There is no separate scheduled
  meeting day or calendar.

## STUBBED / NOT BUILT

- **Certification assessment** (FIELD-READY SDR). The lesson exists and names
  the competencies, but there is no final live assessment. Promotions are
  currently XP-and-quota driven, which the brief explicitly says should not be
  the case.
- **Master mode** — no endless procedural career yet. Accounts do keep
  generating procedurally, which is the foundation for it.
- **Export/analytics trends over time** — the funnel and rates are live; the
  multi-week trend chart is not.
- **Audio** — omitted entirely (the brief calls it optional).
- **Mentor characters** with competing philosophies — only Dana Reyes exists.
- **AE handoff documentation** exercise.

---

## Real bugs found and fixed during testing

1. `ctx is not defined` crashed every call mid-conversation — caught by the
   browser test, not the headless tests. Choice selection now reads context from
   the call object.
2. **First-time contacts were shown re-engagement scenes** ("reference what they
   told you last time") because `attemptConnect` incremented call count before
   the script was built. Now requires a real prior conversation.
3. **Weekly quota could never be met** — the week's dial total was never
   accumulated, so every week was judged on zero.
4. **Trust ran away to 0.92 within a single call** from compounding option
   effects. Added per-call diminishing returns and per-variable ceilings.
5. **Unanswered calls counted no dial and produced no debrief**, silently
   breaking the day loop in the UI.
6. `endDay` threw if called without a started day.

These are exactly the class of bug that ships invisibly without execution —
which is why the brief's insistence on testing mattered.

## Known tuning notes

- The 120-day random-player simulation produces very few meetings, by design —
  a player who picks essentially at random should fail. If it feels too harsh
  in real play, raise the luck floor in `src/calls.js` (`var lucky = ...`).
- Blunder play never books a meeting. Intended.