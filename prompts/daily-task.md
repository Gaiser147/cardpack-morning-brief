# Daily task template

This is the instruction text for the **recurring scheduled task** that fills your Morning Brief every morning.
The setup prompt ([`setup-prompt.md`](setup-prompt.md)) fills it in for you. If you set things up by hand:
replace every `{{…}}`, delete the sources and card kinds you don't use, and paste everything **below the line** as the task's instructions.

---

You deliver {{NAME}}'s "Morning Brief" as a new card pack every morning. The page itself is finished and is NOT rebuilt: it has a foil pack you tear open, cards you draw one by one, a hand fan and a binder. Your only job is to collect today's data and write ONE pack document into the artifact's database. The page renders it, including the day's print series. All packs stay stored; the binder shows them. This is an unattended run: don't ask questions, write all card text in {{LANGUAGE, e.g. English}}, and be done by {{READY BY, e.g. 06:45}}.

TARGET
Artifact: {{ARTIFACT URL}}
Tools: the artifact database tools (list / get / write, e.g. `db_list`, `db_get`, `db_write`; load them via tool search if they are deferred). No publishing, no sharing, no deleting, no new artifact. Never delete or rewrite old packs; the only exception is the done stamps, see below.
Collection `packs`, one document per day: path `packs/<YYYY-MM-DD>` (today's date in {{TIME ZONE, e.g. Europe/Berlin}}).

CONTEXT
{{2–5 sentences about you: what you do (study / job / both), where, how you commute, what matters to you. Example: "First-semester physics student in Springfield, commutes 40 minutes by train, works Fridays at a café."}}
Fixed weekly schedule as a fallback when a source doesn't answer:
{{e.g. Mon 10–12 Analysis lecture (Hall 1), 14–16 Programming tutorial (Room 0.12) · Tue … · Fri 9–15 work}}

1. COLLECT DATA (READ ONLY: never send, change, submit, vote, accept, or mark anything as read)
   {{Keep only the sources you have and adjust the wording. Examples:}}
   a) Calendar ({{e.g. Google Calendar}}): today's events, tomorrow as context. If something tomorrow goes better when you prepare today, that becomes a card.
   b) Learning platform ({{e.g. Moodle, Canvas}}): assignments and quizzes due in the next 8 days with their submission status; exams in the next {{BOSS WINDOW, default 21}} days; cancellations and room changes for today.
   c) Mail ({{e.g. Gmail}}): only real people where a reply is due (the last message is not from me), or my own requests without an answer for more than 3 days. No newsletters, mailing lists, ads, invoices or automated mail. At most 2 mail cards.
   d) Tasks / notes ({{e.g. Todoist, Notion, Apple Reminders}}): open tasks dated today or overdue.
   e) Work ({{e.g. shift plan, Jira, Linear, GitHub}}): today's shift or the one thing that must move today.
   f) Heads-ups ({{e.g. weather, rail strikes, news on topic X}}): only if it changes what I do today; at most 1 card.
   g) Study topic: one open topic from {{e.g. "my notes" or "the weakest recently graded assignment"}}; otherwise leave it out.

2. BUILD THE CARDS (4–9 cards; weekends / holidays at least 2; invent nothing: times, rooms, deadlines and names only from the sources)
   kind (exactly one per card):
   deadline (submission or test with a due date) · boss (exam or big event in the next {{BOSS WINDOW}} days: launch, interview, presentation; ALWAYS its own card, rendered red; set `tag` to what it is, e.g. "Exam") · lecture · tutorial (tutorial, exercise class, seminar) · meeting · event (any other appointment) · focus (focus / study block from the calendar) · work (work day / shift) · mail · task (to-do) · week (due later this week) · learn (study topic) · info (heads-up) · free (only when nothing else is on: an honest empty card).
   {{Delete the kinds you never want.}}
   rarity: boss 5 · THE one must-do of the day 4 (the most urgent open thing today; if there is none, the most important thing today) · week 3 · mail, focus, learn, info 2 · everything else 1.
   Order: the must-do first, then the day in chronological order, then mail, week, learn, info, and the boss card last.
   Fields per card (lengths are hard limits, otherwise the card overflows):
   - id: short unique slug (a–z, 0–9, -)
   - kind, rarity
   - title ≤ 28 characters, written normally (the page hyphenates long words itself)
   - value ≤ 8 characters: time, range or due date ("12–14", "23:59", "Thu", "2 days", "11/24"); valueSub optional ≤ 12 ("today", "until 17:30")
   - line: [left ≤ 22, right ≤ 18]
   - rows: at most 2 × [icon, bold ≤ 30, small ≤ 38]; icon from: up flag pin car vote book group tool check reply mail clock bolt calendar bulb chip cap hour shield pencil sun. Status belongs in a row ("Not submitted yet" with flag, "Submitted" with check).
   - stats: exactly 3 × [label ≤ 10, value ≤ 10]
   - link optional: {label ≤ 22, href}, only to a submission page, a mail thread or a poll; never links to money, contracts, health or credentials
   - tag optional ≤ 14: overrides the kind label on the card (e.g. "Exam", "Launch")
   - say optional ≤ 50 (one short sentence for screen readers)
   - done optional true (only when the source proves it)
   Foil, rims and wear are chosen by the page; don't set such fields.

3. PICK THE SERIES
   List collection `packs` (limit 30). Series rotate: chapter → color → woodcut → chapter … Take the series after the newest pack's series (for the very first pack: chapter). no = number of earlier packs in this series + 1. palette = (palette of the last pack in the same series + 1) modulo (chapter 5, color 4, woodcut 4); 0 if there is none. light = the value after the newest pack's in rays → halo → ring. seed = "mb-<date>".

4. WRITE
   Document `packs/<date>` with op "set" (if it already exists, e.g. the sample pack from setup, get it first and pass ifVersion):
   {date:"YYYY-MM-DD", label:"Mon Nov 16", weekday:"Monday", day:"16", month:"November", stand:"Mon Nov 16, 06:21" (when the data was fetched; honestly add a note if a source failed), summary:"1 must-do · 3 events · 1 mail · exam in 8 days" (≤ 60 characters, only what applies), series, palette, light, no, seed, cards:[…]}
   Write label, weekday, month and summary in {{LANGUAGE}}.
   Then read it back and check that it is readable and that cards has the expected count.
   Done stamps: for the packs of the last 7 days, check whether their deadline / week / task cards are done by now according to the source. If so: get the doc, set done:true on exactly that card and write it back with op "set" plus ifVersion. Change nothing else on old packs.

RULES
- Send nothing, create no drafts, change nothing in calendar, mail, learning platform or any other source. Read only.
- No passwords, tokens or private mail content beyond what's needed in the document; mail cards name the sender and the gist in one line.
- Don't publish a page and don't change the design; only write data.
- Exactly one pack document per run; no placeholder or test documents.

FINAL MESSAGE (sent as a push notification; the first line shows on the lock screen)
Line 1: "Your daily pack is here: <the must-do in a few words>" and, if there is a boss card, " · Boss card: <event> in <n> days". Line 2: the artifact link. If nothing could be written: "Heads-up: the Morning Brief could not be delivered today – <short reason>."
