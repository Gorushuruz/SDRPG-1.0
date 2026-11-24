# SDR Academy

A mobile-first, text-based career RPG that trains you to become a capable B2B
technology SDR/BDR. You sell enterprise AI software into companies that mostly
do not want to hear from you. Some of them have a real problem. Some of them
do not. Telling those two apart is the whole job, and the game never tells you
which is which.

## Run it

**Option A — open the file directly.** No install, no server:

```
open /Users/<USERNAME>/OS3/sdr-academy/index.html
```

This works because the game is plain scripts with no build step and no modules.
It is fully playable from `file://`, and saves to the browser's local storage.

**Option B — local dev server** (recommended if you want to test on your phone
on the same Wi-Fi):

```
cd /Users/<USERNAME>/OS3/sdr-academy
python3 -m http.server 8080
```

Then open `http://localhost:8080` on your Mac, or `http://<your-mac-ip>:8080`
on your phone.

**Option C — put it on your phone.** Serve it over the network as above and open
the LAN address on the phone. Progress is stored per-browser, so it saves on
whichever device you play it on.

## Save data

Autosaves on every action to `localStorage` under `sdra.save.v3`, with an
IndexedDB mirror as fallback. Close the tab, refresh, come back later — the
career is intact. **Settings -> Export save** writes a JSON file you can keep;
**Import save** restores it. Reset asks twice and will not wipe a career by
accident.

Note: the save lives in the browser, so clearing site data deletes it. Export
before you clear browsing data or switch devices.


## How the sales logic works

Every prospect carries hidden variables — trust, curiosity, interest, patience,
skepticism, problem awareness, political risk, competitive loyalty, budget
confidence, authority. **They are never displayed.** You read social cues
("they are giving you short answers") and social behaviour instead.

Each of the four options is a *move* with effect pressure and a situational fit
penalty. The same move lands differently on different people:

- **Isolating** an objection is the strongest move when there is a real, deep,
  un-isolated objection — and worth almost nothing when the prospect is politely
  brushing you off.
- **Conceding** is right when the account is genuinely poor or they are already
  hostile, and expensive when there is heat or a problem you have not diagnosed.
- **Rebutting before you understand** is penalised precisely because it is the
  most common real-world rookie failure.

Outcomes are not random. Qualification (pain, authority, urgency, budget,
access) gates everything, an unisolated deep objection caps the result, and
player skill modulates each move without replacing judgment. A skilled player
converts roughly 6% of connects to meetings; a random player gets a handful; a
player who blunders gets none — but a mediocre SDR still occasionally gets
lucky, and a great SDR still loses to bad timing, budget freezes and internal
politics.

The four answer positions are shuffled every encounter. No option is ever
labelled correct, incorrect, best or worst.
