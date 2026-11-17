# Setup prompt

Copy the block below into a new chat on [claude.ai](https://claude.ai) (web, desktop or mobile app).
Claude will look at the connectors you already have, ask you what belongs in your brief, publish the page from this repo and create the daily scheduled task.

You need a Claude plan where **artifacts with a database** and **scheduled tasks** are available. Connect the apps you want in your brief (Google Calendar, Gmail, …) under *Settings → Connectors* before you start, or add them later and run the setup again.

```text
Set up "Cardpack Morning Brief" for me: every morning a sealed trading-card pack of my day that I tear open in an artifact. The page comes ready-made from https://github.com/gaiser147/cardpack-morning-brief. You publish it once, then a recurring scheduled task writes one new pack per day into the artifact's database. Work through these steps in order. Ask me before you publish or schedule anything.

1. CHECK MY CONNECTORS
Look at which connectors and tools you can use right now (calendar, mail, tasks/notes, learning platform, work tools, weather/news, …). Only list them, don't read my data yet. Show me a short list: connected and useful / connected but not useful / useful but missing. For the missing ones say in one line where I can add them.

2. ASK ME WHAT GOES IN THE BRIEF
Use your question tool if you have one (multiple choice, up to 4 questions per round, your recommendation first). Propose defaults from what you found instead of asking open questions. Ask about:
- Sources: which of my connected sources to use.
- Cards: which kinds I want. Options: today's ONE must-do (always on), today's events, meetings, lectures/tutorials, work shift, mails waiting on my reply, deadlines due this week, to-dos, a "boss card" for the next exam or big event (how many days ahead, default 21), a study topic, a heads-up (weather, commute, news on a topic I name).
- Timing: when the pack should be ready (default 06:30), every day or weekdays only, my time zone.
- Language for the card text (the page UI itself is English).
- Optional: 2–5 sentences about me and my fixed weekly schedule, used as a fallback when a source fails.
Briefly confirm the result before you continue.

3. GET THE PAGE FROM THE REPO
Download these files exactly as they are (use your code/bash tool, e.g. curl, or your web fetch tool):
- https://raw.githubusercontent.com/gaiser147/cardpack-morning-brief/main/artifact/morning-brief.html
- https://raw.githubusercontent.com/gaiser147/cardpack-morning-brief/main/artifact/examples/sample-pack.json
- https://raw.githubusercontent.com/gaiser147/cardpack-morning-brief/main/prompts/daily-task.md
Don't rewrite, shorten, "improve" or rebuild the page, and never recreate it from memory. If you can't download a file, tell me which one and ask me to attach it (I can download the repo as a ZIP from GitHub), then wait.

4. PUBLISH THE PAGE
Publish morning-brief.html unchanged as a new private artifact titled "Morning Brief" with exactly these capabilities:
{"db": {"rules": [{"path": "packs", "read": "view", "write": "owner"}, {"path": "data/users/{self}", "write": "interact"}]}, "user": {}}
(Only I/the task may write packs; the page stores which packs I opened and which cards I stamped under data/users/<me>.)
Then write sample-pack.json into the artifact's database as document packs/<today's date>, with date, label, weekday, day, month and stand set to today, so I can test the page right away. Give me the link.

5. FILL IN THE DAILY TASK
Take daily-task.md, keep only the part below the line, and replace every {{…}} with my answers: the artifact link, my name, language, time zone, ready-by time, context, weekly schedule, my real sources with their real connector names, and the card kinds I chose. Delete the sources and kinds I don't use. Don't loosen any of its rules (read only, never send or change anything, no invented data, length limits). Show me a 5-line summary, not the whole text.

6. CREATE THE RECURRING TASK
Create a scheduled task named "Morning Brief" that runs at the chosen time and days in my time zone (start it about 15 minutes before the ready-by time), with the filled text as its instructions and only the connectors it needs. Then offer to run it once now so a real pack for today replaces the sample.

At the end tell me in a few lines: the artifact link, when it runs, which sources it reads, and how to change it later (sources, time, card kinds).
```

## What happens next

- Every morning the task reads your sources (read only), builds 4–9 cards and writes `packs/<date>` into the artifact's database. The page itself is never republished.
- You get a push notification like *"Your daily pack is here: Physics sheet 3 · Boss card: Programming quiz in 9 days"*. Always open the same link; older days are in the binder.
- To change sources, time or card kinds later, ask Claude in any chat: *"Update my Morning Brief task: also read my Todoist, and run at 07:00."*

## Doing it by hand

1. Publish [`artifact/morning-brief.html`](../artifact/morning-brief.html) as an artifact with the capabilities from step 4.
2. Write [`artifact/examples/sample-pack.json`](../artifact/examples/sample-pack.json) as `packs/<today>` to test it.
3. Fill in [`daily-task.md`](daily-task.md) and create a daily scheduled task with it.
