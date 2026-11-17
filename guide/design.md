---
name: Cardpack Morning Brief
description: Your day as a booster pack. A daily trading-card pack in a Manga print world, torn open, drawn card by card, held as a hand, kept in a binder.
colors:
  stage-night: "#121218"
  stage-night-glow: "#1d1d28"
  stage-night-color: "#160f26"
  stage-night-color-glow: "#241a3d"
  stage-night-woodcut: "#0e1530"
  stage-night-woodcut-glow: "#18244a"
  on-night: "#f6f2ea"
  on-night-soft: "#bdb9cc"
  line-night: "rgba(255,255,255,.16)"
  chrome-glass: "rgba(12,12,20,.62)"
  ink: "#111111"
  paper: "#ffffff"
  washi: "#f3e9d3"
  indigo: "#1b2340"
  indigo-soft-text: "#3a3f57"
  boss-red: "#ff2b2b"
  woodblock-red: "#c8302c"
  stamp-red: "#e0252b"
  signal-yellow: "#ffd60a"
  hue-gold: "#ffd60a"
  hue-sky: "#5ac8fa"
  hue-violet: "#b79cff"
  hue-pink: "#ff8fc7"
  hue-mint: "#46d9a8"
  hue-lime: "#b6f05a"
  hue-orange: "#ff9f1c"
typography:
  display:
    fontFamily: "Dela Gothic One, sans-serif"
    fontSize: "clamp(24px, 7vw, 30px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Dela Gothic One, sans-serif"
    fontSize: "clamp(22px, 6.6vw, 28px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  card-name:
    fontFamily: "Dela Gothic One, sans-serif"
    fontSize: "calc(100cqw / 300 * 21)"
    fontWeight: 400
    lineHeight: 1.03
    letterSpacing: "-0.005em"
  card-value:
    fontFamily: "Dela Gothic One, sans-serif"
    fontSize: "calc(100cqw / 300 * 26)"
    fontWeight: 400
    lineHeight: 0.9
  title:
    fontFamily: "Zen Kaku Gothic New, sans-serif"
    fontSize: "15px"
    fontWeight: 900
    lineHeight: 1.2
  body:
    fontFamily: "Zen Kaku Gothic New, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Zen Kaku Gothic New, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.2
  woodblock-display:
    fontFamily: "Shippori Mincho B1, serif"
    fontSize: "calc(100cqw / 300 * 21)"
    fontWeight: 800
    lineHeight: 1.05
rounded:
  pill: "999px"
  card-rim: "calc(100cqw / 300 * 14)"
  card-face: "calc(100cqw / 300 * 10)"
  card-face-woodblock: "calc(100cqw / 300 * 8)"
  card-row: "calc(100cqw / 300 * 9)"
  list-row: "14px"
  toast: "12px"
  pocket: "8px"
spacing:
  chrome-gap: "8px"
  chrome-inset: "12px"
  edge: "16px"
  edge-wide: "22px"
  touch: "44px"
components:
  pill:
    backgroundColor: "{colors.chrome-glass}"
    textColor: "{colors.on-night}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 16px"
  cta-draw:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "56px"
    padding: "0 26px 0 20px"
  act:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 18px"
  act-ghost:
    textColor: "{colors.on-night}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 18px"
  list-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.list-row}"
    padding: "7px 12px 7px 9px"
  list-row-boss:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.list-row}"
  card-front-chapter:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card-face}"
  card-front-woodcut:
    backgroundColor: "{colors.washi}"
    textColor: "{colors.indigo}"
    rounded: "{rounded.card-face-woodblock}"
  card-value-box:
    typography: "{typography.card-value}"
    textColor: "{colors.ink}"
  toast:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.toast}"
    padding: "9px 14px"
---

# Design system: Cardpack Morning Brief

## Overview

**Creative north star: "Your day as a booster pack"**

Every morning one sealed, crinkled foil pack waits on a dark stage. You swipe along the perforation, the strip tears hole by hole in 3D and curls away, the pack glows from inside in the colour of its rarest card, and you draw the day's cards one by one, flip them, tilt them in the light and send each into your hand. The finished state is a fanned hand with a list beneath it; every day's pack stays in a binder. Rarity encodes urgency. The next exam or big event is always the red boss card.

The world is Manga print: trading cards in the 63:88 format with a thick ink frame, halftone dots, speedlines and sound-effect lettering for times and values, one picture panel per card kind. Three print series rotate (Chapter, Color Page, Woodcut), driven by a recipe in each day's data (series, palette, light, seed). The pack material never changes: the series is only printed onto the foil. Everything the page shows is drawn at runtime: inline SVG for art and icons, canvas for every texture, WebAudio for every sound. No raster ships.

Density is one idea per moment. The stage carries one pack or one card at centre; chrome is translucent and recedes. Colour lives on the pack and the cards, not on the UI.

**Key Characteristics:**
- One sealed foil pack per day, torn along a perforation, cards drawn one at a time.
- Three rotating print series on one invariant card anatomy measured in k units.
- Rarity drives light, foil and banner; the boss (exam or big event) is always the red card.
- Seeded per-card traits (foil, rim, surface, wear float) so a pack looks identical on every reload.
- Material motion with springs and real easing; full reduced-motion path straight to the hand.
- Zero shipped rasters: SVG art, canvas textures, synthesised sound.

## Colors

A near-black stage tinted per series, translucent chrome on top, and saturated print colour reserved for the pack and the cards.

### Primary
- **Boss Red** (boss-red): the boss colour and nothing else. Boss card header and panel (Chapter, Color Page), offset shadow on the Color Page boss card, boss dot in the fan pager, boss list row border, rarity-5 banner, pack glow and flash when the boss card is next. In Woodcut the boss role is carried by **Woodblock Red** (woodblock-red), which is also that series' seal colour.

### Secondary
- **Signal Yellow** (signal-yellow): the one UI accent. Focus ring, binder count badge, streak chip, selection, pressed preview chip, rarity-4 banner and rarity-4 pack glow. It doubles as the Deadline card hue (hue-gold), which is why the must-do's time box is yellow, never red.

### Tertiary: card hues by kind
One hue per card kind, set on the card as its spot colour (value box, row icons, panel accent, Color Page offset):
- **Deadline** hue-gold · **Boss** boss-red · **Lecture**, **Meeting** and **Free** hue-sky · **Tutorial**, **Focus block**, **Event** hue-violet · **Mail** hue-pink · **This week** and **To-do** hue-mint · **Study topic** hue-lime · **Work** and **Heads-up** hue-orange.
- Color Page pairs each hue with a pale tint for header and panel ground (gold #fff2a8, sky #d3f1ff, violet #ebe2ff, pink #ffe0ef, mint #d2f7e9, lime #ecfccb, orange #ffe7c7, red #ffd5d2).
- Woodcut swaps to flat woodblock pigments (gold #d99a2b, sky #2a4b8d, violet #7b4a8e, pink #b34d6d, mint #2f7f7a, lime #5f7d33, orange #b5612a, red #c8302c), with text on hue in #fdf2e3 except gold, which takes indigo.

### Pack palettes (per series, chosen by the recipe's palette index, wrapping)
- **Chapter**: foil #ff6a48 / #ffd60a / #5ac8fa / #b79cff / #46d9a8, each with a dark ink, a day-number fill (white or yellow) and a tone colour for the RIIIP lettering.
- **Color Page**: foil #ff4f8b / #1fb6ff / #ffc400 / #a07bff, ink #111, day fill #ffc400 or white, tone as the complementary print colour.
- **Woodcut**: foil #2a4b8d / #2f7f7a / #7b4a8e / #b5612a, ink washi, with an accent sun (#c8302c, #d99a2b or indigo).

### Neutral
- **Stage Night** (stage-night, with stage-night-glow as the radial lift behind the pack): the Chapter stage. Color Page uses a violet night, Woodcut an indigo night; the stage is the only page-level colour that changes with the series.
- **Warm Paper Text** (on-night) and **Muted Lilac Text** (on-night-soft): primary and secondary text on the stage.
- **Night Hairline** (line-night) and **Chrome Glass** (chrome-glass): pill borders and blurred pill fills.
- **Ink** and **Paper**: the Manga print pair on cards, CTA, list rows and toast.
- **Washi**, **Indigo** and **Indigo Soft Text**: the Woodcut card ground, keyline and secondary text.
- **Stamp Red** (stamp-red): the "Done" stamp on Manga cards.

### Named Rules
**The Red Is Reserved Rule.** Red as a fill means boss. No other card kind takes red as its hue, header, panel or value box, and no UI element is filled red, in any series; the must-do's time box is yellow. The only other reds are ink marks: the "Done" stamp and the Woodcut seal.

**The Colour Lives On Paper Rule.** Saturated colour belongs to the pack foil and the cards. The stage is a tinted night, chrome is translucent glass with a hairline, and the only UI accent is Signal Yellow.

## Typography

**Display Font:** Dela Gothic One (with sans-serif)
**Body Font:** Zen Kaku Gothic New, 400/500/700/900 (with sans-serif)
**Woodblock Font:** Shippori Mincho B1, 800 (with serif), Woodcut series only

**Character:** A heavy, rounded poster grotesk for numbers and names, like Manga sound-effect lettering, over a clean Japanese gothic for everything that must be read fast. Woodcut trades the poster voice for a carved Mincho.

### Hierarchy
- **Display** (Dela 400, clamp(24px, 7vw, 30px), 1): the date title over the hand. Binder title 30px, binder page heads 20px, pack names in the binder 16px.
- **Headline** (Dela 400, clamp(22px, 6.6vw, 28px), 1.05): the stage line above the pack ("Monday, November 16", "Card 3 of 8"), with a 14px 500 soft subline beneath.
- **Card name** (Dela 400, 21k, 1.03, balanced, hyphenated): 17.5k when the title runs past 18 characters.
- **Card value** (Dela 400, 26k, 0.9): the time or date in the value box; 31k white with a 4.5k ink stroke in Color Page, Mincho 27k in Woodcut. Its sub-line is Zen Kaku 900 at 10.5k.
- **Pack lettering** (Dela, in p units): day number 128p with a 5p ink stroke and offset, pack title 29p in a paper box, vertical tab 21p, RIIIP sound effect 42px.
- **Title** (Zen Kaku 900, 15px, 1.2): list row names; card row heads 13.5k; stat values 13k.
- **Body** (Zen Kaku 400 to 500, 16px, 1.45): base text; list sublines 13px; card row sublines 12k.
- **Label** (Zen Kaku 700, 14px): pills, segment control, toast; card type tag 12k 900; card info line 12k 700; stat labels and footer 11.5k.

### Named Rules
**The Three Voices Rule.** Dela speaks numbers and names, Zen Kaku speaks sentences, Mincho speaks only in Woodcut, where it replaces Dela on cards, pack and seal. No fourth face, and no system face standing in for display.

**The Value Shouts Rule.** On every card the value (time, date, "2 days") is the loudest object: the largest Dela setting on the face, boxed, rotated, in the card's hue.

## Layout

Phone-first, portrait, 360 to 430px; one fixed full-viewport stage with no page scroll. Three views share it: the **stage** (pack and drawn card at centre), the **hand** (header, fan, pager, actions, footer) and the **binder** (scrolling grid). A zoom dialog overlays all three.

- **Chrome bar**: fixed, 12px from the sides and 10px below the safe area, 8px gaps, all controls 44px tall. Left: binder; right: hand/list segment and replay (hand view only), mute, skip (stage only).
- **Pack sizing**: width min(68vw, 286px, (100svh - 230px) / 1.62), aspect 1:1.62, centred; the opened pack drops to 72% of the viewport height at scale .94 so the drawn card has the space above it.
- **Revealed card**: width min(80vw, 320px, available height x .716), centred between the bar and the pack mouth.
- **Fan**: card width min(80vw, 330px, (100svh - 400px) x .716), refit to the fan's real height; the fan's bottom 14px fades out.
- **List**: 16px gutters, 6px between rows, scrolls inside the hand view with a 12px top fade.
- **Binder**: two columns (gap 22px x 16px); from 700px four columns inside an 860px measure, and the hand header centres. Under 400px the binder pill drops its label.
- **Card interior**: every measure is in **k** = 100cqw / 300, through a container query on the card, so one anatomy renders identically at 32px in the mini-hand, ~100px in a binder pocket and 330px in zoom. The pack uses the same idea with **p** = 100cqw / 286.

### Named Rules
**The k-Unit Rule.** Nothing inside a card is sized in px. Card width is 300k, height follows 63:88, and every border, font and gap is a multiple of k.

**The Centre Stage Rule.** Exactly one object owns the centre at a time: the pack, then one card. A card waits at centre until you send it to your hand.

## Elevation & Depth

Depth is physical and lit, not tonal. Objects sit in real 3D (perspective 820k on cards, 900px on the pack, 1100px on the fan) and tilt under the finger; a soft blurred floor shadow (rgba(0,0,0,.5), blur 14k) moves opposite the tilt; glare is a screen-blended radial that follows the pointer. Foils are multiply-blended gradient or canvas layers masked to the upper face. Light is event-driven: rays, halo or ring behind the pack (from the recipe's light field), an inner glow from the pack mouth in the rarity colour, a red flash on the boss reveal.

### Shadow Vocabulary
- **Card floor** (blurred 14k, rgba(0,0,0,.5), offset follows tilt): every card, fading with flip angle.
- **Pack floor** (radial ellipse, blur 3px): the pack on the stage.
- **CTA lift** (`box-shadow: 0 10px 24px rgba(0,0,0,.4)`): the draw button only.
- **List row** (`box-shadow: 0 6px 14px rgba(0,0,0,.25)`): list rows on the night stage.
- **Print offset** (zero blur, ink #111): value box 3k, pack title box 4p, day number and RIIIP drop 3 to 5p. Color Page adds the offset in the card hue: rim 8k, card rows 2.5k; on the boss card in boss red.

### Named Rules
**The Print Offset Rule.** A hard zero-blur offset is a print device and appears only on printed objects (value box, pack lettering, Color Page rim and rows). Never on chrome, pills, toasts or list rows.

**The Light Means Rarity Rule.** Pack glow colour and strength come from the next card's rarity: warm white at .32 for rarity 1 to 2, cyan (120,220,255) at .6 for 3, yellow (255,214,10) at .95 for 4, red (255,43,43) at .95 for the boss.

## Shapes

Trading-card rectangles at 63:88 with gently rounded corners (rim 14k, face 10k, Woodcut face 8k); the pack is 1:1.62 with a sawtooth perforation mask (11p teeth), a crimped bottom band (20p) and 7p corners. A 6k paper-white rim surrounds the 6.5k ink frame so the frame reads on the dark stage. Card rows are rounded boxes (9k radius, 2.5k ink border) in Manga series and hairline-ruled lines in Woodcut. The Color Page picture panel is slanted (clip to 80% on the right edge, overlapping the info line by 20k). Woodcut adds an inner 1.6k indigo keyline at 6k inset and a rotated square seal. UI chrome is fully pill-shaped (999px); list rows 14px; toast 12px.

## Components

### Trading card (signature)
Tactile, printed, collectible. One anatomy for every kind and series:
- **Rim** (6k, radius 14k): plain paper, chrome, holo, gold or boss gradient; the gradient slides with tilt. Woodcut plain rim is #efe3c8.
- **Face** (radius 10k, 6.5k ink border): header (min 66k, 4k rule) with name left and value box right; when the value runs past 6 characters or the name past 24, the value stacks under the name and the panel shortens to 98k.
- **Picture panel** (118k; Woodcut 114k): one SVG motif per kind (Deadline sheet and arrow, Lecture/Meeting board and hall arcs, Boss shield in a storm, Mail envelope and speech bubble, Week calendar sheet, Learn bulb, Work circuit board, Focus/Event clock, Tutorial/To-do pencil, other kinds a focus burst), in the series' print: Chapter ink and halftone with the hue as one spot; Color Page hue halftone on the tint; Woodcut flat pigments over seigaiha waves. Type tag top left (ink box, icon plus kind label, "· Boss" on the boss card).
- **Info line** (two ends), up to **two rows** (icon disc 27k in the hue, bold head, subline), **three stats** under 2.5k rules, **footer** with "01/08 · Chapter 01" and one spark per rarity point.
- **Overlays**, in order: surface texture, wear, edge chips, foil, glare, done stamp.
- **Back**: ink card with speedlines around a tone glow and the series lettering; Woodcut back is the foil colour with seigaiha and a washi keyline.
- **Boss variant**: Chapter inverts to an ink face with a red header and panel; Color Page turns header and panel red and its offset red; Woodcut turns frame, keyline and header woodblock red with an indigo value box. Always boss rim and boss foil.

### Rarity, foil, rim, surface and wear
Traits come from the pack seed and the card id (seeded, so stable on reload) unless the card data overrides them (`foil`, `rim`, `texture`, `float`).
- **Rarity** 1 Common · 2 Uncommon · 3 Rare · 4 Ultra Rare · 5 Boss Card. Shown as sparks in the footer, the banner at reveal, and the pack light.
- **Foil**: boss → boss; rarity ≥ 4 → holo; otherwise seeded: matte 42%, chrome 20%, glitter 20%, gold 18%. Chrome greys the art.
- **Rim**: boss → boss; rarity ≥ 4 → holo; otherwise plain 55%, chrome 15%, holo 15%, gold 15%.
- **Surface**: none 50%, grain 17%, linen 17%, emboss 16%.
- **Wear float** 0 to 1, seeded as r^1.8 (skewed toward clean), tiers: < .07 Mint · < .15 Near Mint · < .38 Lightly Played · < .45 Well Played · otherwise Battle-Scarred. Scratches and dust at min(.85, float x 1.25), edge chips from float .12, one of two creases above .45. The tier shows on the reveal banner; the zoom shows tier and float to four places.

### Foil pack
Crinkled foil in the palette colour with two parallax crinkle layers, a pointer-following glare, a sweep at presentation and an edge light that follows tilt. The series print sits on the foil: Chapter and Color Page get speedline art, a boxed pack title, a vertical tab and the giant day number; Woodcut gets a washi panel with waves, sun, Mincho day number and a red seal. The tear strip (13.2% of the height) carries "Tear here" and a perforation line and is cut into 30 slices.

### Chrome pills
- **Shape:** full pill (999px), 44px tall, 1.5px night hairline, chrome glass with a 10px backdrop blur.
- **Content:** Zen Kaku 700 14px, 19px stroke icons; icon-only pills are 44px square.
- **Press:** scale .95 over 150ms ease-out. Disabled at 35% opacity.
- **Segment control** (Hand / List): pill track, pressed segment in Warm Paper with ink text.

### Draw CTA
Paper pill, 56px, 3px ink border, Zen Kaku 900 16.5px with a 22px icon and a grey count ("3 left"). Bottom-centre above the safe area. It is the keyboard and one-tap path for every drag: "Draw card", then "To hand", last "To hand · done".

### Card actions
Under the active hand card: a paper pill for the data's link (label from data, external-link icon) and a ghost pill "Done" / "Remove stamp". The done action never appears on Lecture, Event, Meeting, Boss, Free or Heads-up.

### List rows
Paper, 2.5px ink border, 14px radius: 38px hue icon tile, name (900, 15px, one line, ellipsis) over line and first row, value right in Dela 17px. Boss row inverts to ink with a red border and red icon tile. Done rows sit at 60% with a struck name. Tapping a row returns to the fan at that card.

### Binder
Mini packs in a grid (sealed ones keep their top and a yellow "Sealed" chip; opened ones show the torn edge and a card count), a yellow streak chip and a card count. Opening a pack shows its cards in three-up pockets.

### Rarity banner
Rotated (-2deg) Dela label top right of the revealed card with a wear-tier pill: ink on white for rarity 1 to 3, yellow for 4, red and larger (24px) for the boss.

### Motion
- **Present**: rays fade 1400ms; pack drops from -75vh with a -9deg tilt, overshoots 4% at 72%, settles in 1050ms on cubic-bezier(.2,.8,.25,1); one light sweep 1100ms; then a slow breathing tilt (2.2deg / 4deg) and a swipe-dot hint looping every 2100ms.
- **Tear**: progress follows the finger at drag distance / (0.8 x strip width); each slice curls up to 55deg around the tear edge and rolls back up to 150deg; a tick sounds per perforation bridge. At 97% it completes on its own; on release it completes above 62% and otherwise holds with "Keep swiping". Completion finishes in 170ms, the strip flies off in 880ms (up 260px, 70px sideways, -38deg, rotateX 160deg, opaque until 72%), 16 foil flakes scatter for 0.9 to 1.3s, and RIIIP pops for 900ms (not in Woodcut). Keyboard tear runs 720ms on ease-in-out.
- **Glow and settle**: inner glow to .9 in 500ms, a 520ms pause, the pack sinks in 620ms on cubic-bezier(.3,.7,.2,1), glow eases to .35.
- **Draw**: the card rides out of the mouth under the finger; released past 40% of the pull distance or above .55px/ms it goes, otherwise it springs back in 220ms. The tap path pulls in 300ms.
- **Flip**: a 760ms arc from the mouth to centre on cubic-bezier(.25,.8,.3,1) with a 30px lift, 1.04 scale and -2deg mid-pose; after 200ms the card turns 180 to -5deg in 420ms ease-in-out and settles to 0 in 170ms. At 85% of the turn the card lands: sparks by rarity, banner in 260ms on cubic-bezier(.2,.9,.3,1.3), a 600ms idle sway. The boss adds a red flash (600ms) and a 420ms shake of card and pack.
- **Confirm (to hand)**: CTA or a downward swipe past 95px; the card flies to the mini-hand in 420ms on cubic-bezier(.5,0,.3,1), shrinking to 32px and rotating by its index.
- **Finale**: the pack falls away (110vh, 9deg) in 560ms; the hand deals from the mini-hand, each card 760ms on cubic-bezier(.3,.7,.3,1), staggered 60ms; header fades in at 300ms, controls at 420ms.
- **Fan**: cards arc around a pivot at 175% of card height with a step of clamp(44 / (n - 1), 5.5, 11) degrees; the active card lifts 18px and scales from .9 to 1. Drag pans at fan width x .34 per card with .35 rubber-band at the ends; a flick (.22px/ms) or 20% drag advances one card; snap is 420ms with a back-out overshoot, buttons and arrows ease out in 380ms.
- **Tilt spring**: stiffness 170, damping 12.5, shared by pack and cards.
- **Zoom** opens in 260ms on cubic-bezier(.2,.9,.3,1.2); the done stamp lands from 1.8x in 260ms on cubic-bezier(.3,1.4,.5,1).
- **Ambient light**: rays spin once per 60s; halo breathes over 4.6s, ring over 5.2s.

### Interaction, accessibility and honesty contract
- **Skip** is one tap from every stage phase and goes straight to the hand; Escape does the same.
- **Every drag has a tap and a key**: tear zone is a focusable button (Enter or Space tears), Enter or Space draws and confirms, arrows move the fan, Escape closes zoom and binder.
- **Reduced motion** opens straight on the hand view, cancels rays, flakes, sway and flashes, and runs any remaining transitions instantly.
- **Reopening the same day** lands on the hand with an "Already opened today" toast and a replay pill.
- **Screen readers**: each card's aria-label reads position, rarity, kind, title, value and rows; a polite live region announces the pack opening and each revealed or focused card; only the active fan card is exposed; zoom is a modal dialog that focuses its close button. Focus ring: 3px Signal Yellow at 3px offset.
- **Sound and haptics** are synthesised and quiet, one mute pill, persisted.
- **Honesty**: the hand summary appends "no mail" and "no boss" when the pack has none; the list states "No mail is waiting on you.", "No boss fight in the next three weeks." and "No cards today." when true; the footer always names the data timestamp and adds "demo data" when the baked fallback is showing. Links appear only when the data carries one.

### Data contract
Collection `packs`, one document per day, newest 90 by `date`. A pack is valid with a `date` string and a non-empty `cards` array; otherwise the baked fallback renders.
- **Pack**: `date` (YYYY-MM-DD), `label`, `weekday`, `day`, `month`, `stand` (data timestamp), `summary`, `series` (chapter · color · woodcut), `palette` (index, wraps per series), `light` (rays · halo · ring), `no` (issue number), `seed`, `cards`.
- **Card**: `id`, `kind` (deadline · boss · lecture · tutorial · meeting · event · focus · work · mail · task · week · learn · info · free), `rarity` 1 to 5, `title` (soft hyphens allowed), `value`, `valueSub`, `line` [left, right], `rows` (up to 2 of [icon, head, sub]), `stats` (up to 3 of [label, value]), optional `link` {label, href}, `say`, `tag`, `done`, and trait overrides `foil`, `rim`, `texture`, `float`.
- **Order**: the must-do is the first card; the boss card is `boss` with rarity 5. Links never go to money, contracts, health or credentials.
- **Per-viewer state**: `data/users/<uid>/state` with `opened` (date → time) and `done` (date:id → time), mirrored in local storage with the mute choice.

## Do's and Don'ts

### Do:
- **Do** size everything inside a card and pack in k (100cqw / 300) and p (100cqw / 286) units, never px.
- **Do** keep the 63:88 card anatomy identical across series: rim, header with name and value box, picture panel, info line, two rows, three stats, footer with sparks.
- **Do** make the next exam or big event `boss` with rarity 5 so they render as the red boss card with boss rim, boss foil, red light and flash in every series.
- **Do** derive foil, rim, surface and wear from the pack seed and card id, and let card data override them only on purpose.
- **Do** draw new art as inline SVG with the series motif classes and new textures on canvas at runtime; ship no rasters.
- **Do** give every gesture a one-tap CTA and a keyboard path, and keep skip one tap away in every stage phase.
- **Do** state empty sections and fallback data honestly, with the data timestamp visible.

### Don't:
- **Don't** fill anything red but the boss card and its signals; the must-do's time box is yellow, and the stamp and seal stay outline ink marks.
- **Don't** put hard offset shadows on chrome, pills, toasts or list rows; the zero-blur offset belongs to printed card and pack elements.
- **Don't** use Shippori Mincho outside Woodcut, or a fourth typeface anywhere.
- **Don't** print the series onto anything but the foil pack; the crinkled foil material stays the same every day.
- **Don't** randomise traits at render time with Math.random; a reload must show the same card.
- **Don't** add action buttons for money, contracts, health or credentials, or a done stamp on lectures, events, meetings, the boss card, heads-ups or free time.
- **Don't** invent card content the source data does not contain.
