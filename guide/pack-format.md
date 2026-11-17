# Pack format

A pack is one JSON document in the artifact database at `packs/<YYYY-MM-DD>`. The page loads the newest 90 packs, shows the newest one as today's pack and all of them in the binder. Full examples: [`artifact/examples/sample-pack.json`](../artifact/examples/sample-pack.json) (one pack) and [`artifact/examples/demo-packs.json`](../artifact/examples/demo-packs.json) (the three packs of the live demo).

## Pack

| Field | Type | Meaning |
|---|---|---|
| `date` | `"YYYY-MM-DD"` | the pack's day, also the document id |
| `label` | text | short, e.g. `"Mon Nov 16"` (heading over the hand, binder) |
| `weekday`, `day`, `month` | text | `"Monday"`, `"16"`, `"November"` (printed on the pack) |
| `stand` | text | when the data was fetched, plus a note if a source failed |
| `summary` | text ≤ 60 | line above the hand, e.g. `"1 must-do · 3 events · 1 mail"` |
| `series` | `chapter` \| `color` \| `woodcut` | the day's print style |
| `palette` | number | colour variant of the series (chapter 0–4, color 0–3, woodcut 0–3) |
| `light` | `rays` \| `halo` \| `ring` | light behind the pack |
| `no` | number | running issue number within the series ("Chapter 03") |
| `seed` | text | random seed for foil, rims and wear (e.g. `"mb-2026-11-16"`) |
| `cards` | list | 1–9 cards, in draw order |

## Card

| Field | Required | Limit | Meaning |
|---|---|---|---|
| `id` | yes | slug | unique within the pack; also the key for done stamps |
| `kind` | yes | see below | sets colour, icon and picture |
| `rarity` | yes | 1–5 | 4 = the must-do (holo), 5 = boss (only `boss`) |
| `title` | yes | ≤ 28 | card name |
| `value` | yes | ≤ 8 | the big number: time, range, due date |
| `valueSub` | no | ≤ 12 | small line under the value |
| `line` | yes | [≤ 22, ≤ 18] | type line, left and right |
| `rows` | yes | ≤ 2 × [icon, ≤ 30, ≤ 38] | info rows with an icon |
| `stats` | yes | exactly 3 × [≤ 10, ≤ 10] | footer stats |
| `link` | no | {label ≤ 22, href} | button under the card in the hand |
| `tag` | no | ≤ 14 | replaces the kind label on the card, e.g. `"Exam"` on a boss card |
| `say` | no | ≤ 50 | one sentence for screen readers |
| `done` | no | true | "Done" stamp set by the task |

### Kinds

| `kind` | Label on the card | Hue | Use it for |
|---|---|---|---|
| `deadline` | Deadline | gold | submissions, tests with a due date |
| `boss` | Showdown · Boss | **red** | the next exam or big event (always rarity 5, always red) |
| `lecture` | Lecture | sky | lectures, talks |
| `tutorial` | Tutorial | violet | tutorials, exercise classes, seminars |
| `meeting` | Meeting | sky | meetings, calls |
| `event` | Event | violet | any other appointment |
| `focus` | Focus block | violet | study or deep-work blocks |
| `work` | Work | orange | work day, shift |
| `mail` | Waiting on you | pink | a person waiting for your reply |
| `task` | To-do | mint | to-dos dated today |
| `week` | This week | mint | due later this week |
| `learn` | Study topic | lime | one topic to revise |
| `info` | Heads-up | orange | weather, strikes, news that change your day |
| `free` | Free | sky | an honest empty card when nothing is on |

No "Done" button on `lecture`, `event`, `meeting`, `boss`, `free` and `info`: those just happen.

**Icons**: `up flag pin car vote book group tool check reply mail clock bolt calendar bulb chip cap hour shield pencil sun`

## What the page does on its own

- **Foil, rim, surface, wear**: rolled from `seed`, the card `id` and `rarity`. Deterministic, so a card looks the same on every reload. The must-do is always holo, the boss card always red. Common cards often have no foil at all. You can force them per card with `foil` (`matte holo chrome gold glitter boss`), `rim` (`plain chrome holo gold boss`), `texture` (`none grain linen emboss`) and `float` (0–1 wear).
- **Viewer state**: the page stores `opened` (packs you opened) and `done` (your own stamps) under `data/users/<user>/state`, mirrored in local storage. The task never touches this.
- **Honest empty states**: without a mail card the list says "No mail is waiting on you.", without a boss card "No boss fight in the next three weeks." So the task should really look 21 days ahead.
- **No database** (opened locally or on GitHub Pages): the page shows the baked-in pack(s) and says "demo data" in the footer.
