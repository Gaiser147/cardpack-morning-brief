"use strict";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pad = (n) => String(n).padStart(2, "0");
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const easeIO = (k) => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PREVIEW = true;
function tween(ms, fn, ease) {
  return new Promise((res) => {
    const t0 = performance.now(), e = ease || easeOut;
    const f = (t) => { const k = clamp((t - t0) / ms, 0, 1); fn(e(k), k); if (k < 1) requestAnimationFrame(f); else res(); };
    requestAnimationFrame(f);
  });
}
function anim(el, kf, o) { try { return el.animate(kf, Object.assign({fill: "forwards"}, o)); } catch (e) { return {finished: Promise.resolve(), cancel() {}}; } }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = typeof seed === "number" ? seed : hashStr(String(seed)); return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const plain = (s) => String(s || "").replace(/­/g, "");

/* ================= world: series, kinds, icons ================= */
const HUES = {gold: "#ffd60a", sky: "#5ac8fa", violet: "#b79cff", pink: "#ff8fc7", mint: "#46d9a8", lime: "#b6f05a", orange: "#ff9f1c", red: "#ff2b2b"};
const SERIES = {
  chapter: {name: "Chapter", unit: "Chapter", packTitle: "Daily<br>Chapter", hues: HUES, hl: HUES,
    palettes: [{pk: "#ff6a48", ink: "#1a0c08", day: "#ffffff", tone: "#ffd60a"}, {pk: "#ffd60a", ink: "#111111", day: "#ffffff", tone: "#ff6a48"},
      {pk: "#5ac8fa", ink: "#0b1b2b", day: "#ffd60a", tone: "#ffffff"}, {pk: "#b79cff", ink: "#16093a", day: "#ffd60a", tone: "#ffffff"}, {pk: "#46d9a8", ink: "#062a1d", day: "#ffffff", tone: "#ffd60a"}]},
  color: {name: "Color Page", unit: "Color Page", packTitle: "Color<br>Page", hues: HUES,
    hl: {gold: "#fff2a8", sky: "#d3f1ff", violet: "#ebe2ff", pink: "#ffe0ef", mint: "#d2f7e9", lime: "#ecfccb", orange: "#ffe7c7", red: "#ffd5d2"},
    palettes: [{pk: "#ff4f8b", ink: "#111111", day: "#ffc400", tone: "#1fb6ff"}, {pk: "#1fb6ff", ink: "#111111", day: "#ffc400", tone: "#ff4f8b"},
      {pk: "#ffc400", ink: "#111111", day: "#ffffff", tone: "#ff4f8b"}, {pk: "#a07bff", ink: "#111111", day: "#ffc400", tone: "#46d9a8"}]},
  woodcut: {name: "Woodcut", unit: "Sheet", packTitle: "Daily Sheet", hues: {gold: "#d99a2b", sky: "#2a4b8d", violet: "#7b4a8e", pink: "#b34d6d", mint: "#2f7f7a", lime: "#5f7d33", orange: "#b5612a", red: "#c8302c"},
    onH: {gold: "#1b2340"}, palettes: [{pk: "#2a4b8d", ink: "#f3e9d3", accent: "#c8302c"}, {pk: "#2f7f7a", ink: "#f3e9d3", accent: "#c8302c"}, {pk: "#7b4a8e", ink: "#f3e9d3", accent: "#d99a2b"}, {pk: "#b5612a", ink: "#f3e9d3", accent: "#1b2340"}]}
};
const KIND = {
  deadline: {label: "Deadline", icon: "hour", hue: "gold"},
  boss: {label: "Showdown", icon: "shield", hue: "red"},
  lecture: {label: "Lecture", icon: "cap", hue: "sky"},
  tutorial: {label: "Tutorial", icon: "pencil", hue: "violet"},
  meeting: {label: "Meeting", icon: "group", hue: "sky"},
  focus: {label: "Focus block", icon: "bolt", hue: "violet"},
  event: {label: "Event", icon: "clock", hue: "violet"},
  mail: {label: "Waiting on you", icon: "mail", hue: "pink"},
  task: {label: "To-do", icon: "check", hue: "mint"},
  week: {label: "This week", icon: "calendar", hue: "mint"},
  learn: {label: "Study topic", icon: "bulb", hue: "lime"},
  work: {label: "Work", icon: "chip", hue: "orange"},
  info: {label: "Heads-up", icon: "flag", hue: "orange"},
  free: {label: "Free", icon: "sun", hue: "sky"}
};
/* kinds that describe something that simply happens: no "Done" stamp */
const NO_DONE = ["lecture", "event", "meeting", "boss", "free", "info"];
const RARITY = {1: "Common", 2: "Uncommon", 3: "Rare", 4: "Ultra Rare", 5: "Boss Card"};
const I = {
  hour: '<path d="M6 3h12"/><path d="M6 21h12"/><path d="M7 3c0 4 4 6 5 9-1 3-5 5-5 9"/><path d="M17 3c0 4-4 6-5 9 1 3 5 5 5 9"/>',
  shield: '<path d="M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6z"/><path d="M12 8v4.5"/><path d="M12 16h.01"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.2v4.8c3 2.6 9 2.6 12 0v-4.8"/><path d="M22 9v6"/>',
  pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 7 8.5-7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  up: '<path d="M12 16V4"/><path d="M6.5 9.5L12 4l5.5 5.5"/><path d="M4 20h16"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  pin: '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
  car: '<path d="M3.5 16.5v-3.5l2.2-5h12.6l2.2 5v3.5"/><path d="M3.5 13h17"/><circle cx="7.5" cy="16.8" r="1.8"/><circle cx="16.5" cy="16.8" r="1.8"/>',
  vote: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 12l3 3 6-6"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  group: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5a3 3 0 0 1 0 6"/><path d="M21 20c0-2.6-1.7-4.8-4-5.6"/>',
  tool: '<path d="M4 17l6-6"/><path d="M14 4l6 6-3 3-6-6z"/><path d="M3 21l3-1-2-2z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  reply: '<path d="M10 8L4 13l6 5"/><path d="M4 13h10a6 6 0 0 1 6 6"/>',
  link: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  hand: '<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M10 10V4.5a1.5 1.5 0 0 1 3 0V10"/><path d="M13 10.5V6a1.5 1.5 0 0 1 3 0v6.5"/><path d="M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 6 17.4L4.3 13.6a1.5 1.5 0 0 1 2.6-1.4L8 14"/>',
  draw: '<rect x="6" y="8" width="12" height="13" rx="2"/><path d="M12 2v8"/><path d="M9 5l3-3 3 3"/>',
  flame: '<path d="M12 22c4 0 7-2.8 7-6.8 0-3.2-2-5.4-3.6-7.4-.4 1.8-1.4 3-2.6 3.4.3-3.4-1.2-6.4-4-8.2.2 3.2-1.6 5.4-3.2 7.4C4.6 12.2 5 14 5 15.2 5 19.2 8 22 12 22z"/>',
  cards: '<rect x="3" y="6" width="12" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>'
};
const icon = (n, w) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2.4) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[n] || I.clock) + "</svg>";
const SPARK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 0C6.6 3.6 8.4 5.4 12 6 8.4 6.6 6.6 8.4 6 12 5.4 8.4 3.6 6.6 0 6 3.6 5.4 5.4 3.6 6 0z" fill="currentColor"/></svg>';

function paletteOf(P) { const S = SERIES[P.series] || SERIES.chapter; return S.palettes[(P.palette || 0) % S.palettes.length]; }
function hueOf(P, c) {
  const S = SERIES[P.series] || SERIES.chapter, K = KIND[c.kind] || KIND.event, key = c.kind === "boss" ? "red" : K.hue;
  return {key, h: S.hues[key], hl: (S.hl || S.hues)[key], on: (S.onH && S.onH[key]) || (P.series === "woodcut" ? "#fdf2e3" : "#111")};
}
const WEAR = [[.07, "Mint"], [.15, "Near Mint"], [.38, "Lightly Played"], [.45, "Well Played"], [1.01, "Battle-Scarred"]];
function traitsOf(P, c) {
  const r = rng((P.seed || P.date) + ":" + c.id + ":traits"), a = r(), b = r(), f = typeof c.float === "number" ? clamp(c.float, 0, 1) : Math.pow(r(), 1.8);
  const rim = c.rim || (c.kind === "boss" ? "boss" : c.rarity >= 4 ? "holo" : a < .55 ? "plain" : a < .7 ? "chrome" : a < .85 ? "holo" : "gold");
  const tex = c.texture || (b < .5 ? "none" : b < .67 ? "grain" : b < .84 ? "linen" : "emboss");
  return {rim, tex, float: f, tier: WEAR.find((w) => f < w[0])[1], crease: f > .45 ? Math.min(.8, (f - .45) * 1.5) : 0, creaseN: r() < .5 ? 1 : 2};
}
function foilFor(P, c) {
  if (c.foil) return c.foil;
  if (c.kind === "boss") return "boss";
  if (c.rarity >= 4) return "holo";
  const R = rng((P.seed || P.date) + ":" + c.id + ":foil"); R(); const r = R();
  const m = (c.rarity || 1) <= 1 ? .62 : .42, rest = (r - m) / (1 - m);
  return r < m ? "matte" : rest < .45 ? "chrome" : rest < .75 ? "gold" : "glitter";
}

/* ================= card art: one motif per kind, drawn in the series' print ================= */
function focus(cx, cy, n, r0, r) {
  let d = "";
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + (r() - .5) * .09, s = r0 + r() * 18; d += "M" + (cx + Math.cos(a) * s).toFixed(1) + " " + (cy + Math.sin(a) * s).toFixed(1) + "L" + (cx + Math.cos(a) * 340).toFixed(1) + " " + (cy + Math.sin(a) * 340).toFixed(1); }
  return '<path class="m-sl" d="' + d + '"/>';
}
function mangaMotif(kind, r) {
  const B = '<rect class="m-bg" width="300" height="112"/>';
  switch (kind) {
    case "deadline": return B + focus(150, 56, 46, 44, r) + '<rect class="m-tn" y="80" width="300" height="32" opacity=".6"/><ellipse class="m-hi" cx="150" cy="56" rx="68" ry="44"/>' +
      '<g transform="translate(118 12) rotate(-6)"><rect class="m-pp" width="54" height="70"/><path class="m-ln" d="M9 15h30M9 26h36M9 37h22"/><rect class="m-tn" x="2" y="50" width="50" height="18"/></g>' +
      '<path class="m-ar" stroke-linecap="round" stroke-linejoin="round" d="M197 88V40M182 55l15-15 15 15"/>';
    case "lecture": case "meeting": return B + '<rect class="m-tn" width="300" height="112" opacity=".35"/><rect class="m-pp" x="94" y="10" width="112" height="52"/><path class="m-ln" d="M108 26h56M108 38h76M108 50h40"/>' +
      '<path class="m-ln" d="M24 112Q150 52 276 112"/><path class="m-ln" d="M66 112Q150 74 234 112"/><path class="m-ln" d="M110 112Q150 94 190 112"/>';
    case "focus": case "event": return B + focus(144, 58, 40, 40, r) + '<ellipse class="m-hi" cx="144" cy="58" rx="58" ry="46"/><circle class="m-pp" cx="144" cy="58" r="32"/>' +
      '<path class="m-ln" stroke-linecap="round" d="M144 58V38M144 58l14 9"/><path class="m-ln" d="M144 30v4M144 82v4M116 58h4M168 58h4"/>' +
      (kind === "focus" ? '<path class="m-ac" stroke-linejoin="round" d="M206 18l-26 38h18l-5 34 28-42h-18z"/>' : '<path class="m-ac" d="M196 28a14 14 0 0 1 14 14v10l6 8h-40l6-8V42a14 14 0 0 1 14-14z"/>');
    case "mail": return B + '<path class="m-sl" d="M8 34H88M20 48H96M4 62H90M26 76H100M12 90H84"/>' +
      '<g transform="translate(106 26) rotate(-7)"><rect class="m-pp" width="84" height="56"/><path class="m-ln" stroke-linejoin="round" d="M3 4l39 28 39-28"/></g>' +
      '<path class="m-pp" d="M222 10c24 0 40 12 40 27s-16 27-40 27c-4 0-8 0-11-1l-15 9 4-13c-11-5-18-13-18-22 0-15 16-27 40-27z"/><path class="m-ac" d="M218 20h8l-1.5 22h-5zM222 47a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"/>';
    case "week": {
      const cell = Math.floor(r() * 10), cx = 128 + (cell % 5) * 12, cy = 54 + Math.floor(cell / 5) * 12;
      return B + '<path class="m-tn" d="M0 0h300v112H0z" opacity=".3"/><g transform="rotate(-4 150 56)"><rect class="m-pp" x="112" y="18" width="76" height="80"/><rect class="m-ac" x="112" y="18" width="76" height="18"/>' +
        '<path class="m-ln" d="M126 12v12M174 12v12"/><path class="m-ln" style="stroke-width:1.6" d="M124 48h52M124 60h52M124 72h52M124 84h52M136 42v48M148 42v48M160 42v48"/><rect class="m-ac" x="' + (cx - 4) + '" y="' + (cy - 4) + '" width="12" height="12"/></g>' +
        '<path class="m-ar" stroke-linecap="round" stroke-linejoin="round" style="stroke-width:5" d="M214 70l10 10 20-24"/>';
    }
    case "learn": {
      let d = ""; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; d += "M" + (150 + Math.cos(a) * 42).toFixed(1) + " " + (52 + Math.sin(a) * 38).toFixed(1) + "L" + (150 + Math.cos(a) * 56).toFixed(1) + " " + (52 + Math.sin(a) * 50).toFixed(1); }
      return B + '<rect class="m-tn" width="300" height="112" opacity=".25"/><path class="m-ln" stroke-linecap="round" d="' + d + '"/>' +
        '<path class="m-ac" d="M150 18a26 26 0 0 0-15 47c3 2.4 4 5 4 9h22c0-4 1-6.6 4-9a26 26 0 0 0-15-47z"/><rect class="m-pp" x="139" y="78" width="22" height="9" rx="2"/><rect class="m-pp" x="142" y="88" width="16" height="7" rx="2"/>' +
        '<path class="m-ln" style="stroke-width:2.6" d="M144 44l6 10 6-10"/>';
    }
    case "work": return B + '<path class="m-ln" style="stroke-width:2.2" d="M40 30h70v20h40M40 82h80V62h30M260 30h-70v20h-40M260 82h-80V62h-30"/>' +
      '<circle class="m-pp" cx="40" cy="30" r="5"/><circle class="m-pp" cx="40" cy="82" r="5"/><circle class="m-pp" cx="260" cy="30" r="5"/><circle class="m-pp" cx="260" cy="82" r="5"/>' +
      '<rect class="m-pp" x="118" y="24" width="64" height="64" rx="4"/><rect class="m-ac" x="132" y="38" width="36" height="36" rx="2"/>';
    case "tutorial": case "task": return B + '<rect class="m-tn" width="300" height="112" opacity=".3"/><rect class="m-pp" x="100" y="16" width="100" height="80"/><path class="m-ln" d="M114 36h70M114 50h60M114 64h70M114 78h40"/>' +
      '<g transform="rotate(-38 210 60)"><rect class="m-ac" x="196" y="20" width="18" height="70"/><path class="m-pp" d="M196 90h18l-9 18z"/></g>';
    case "boss": {
      let d = ""; for (let i = 0; i < 18; i++) { const y = -40 + i * 11; d += "M-20 " + y + "L320 " + (y + 110); }
      const pts = []; for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, rr = i % 2 ? 36 + r() * 6 : 56 + r() * 10; pts.push((150 + Math.cos(a) * rr * 1.35).toFixed(1) + "," + (56 + Math.sin(a) * rr).toFixed(1)); }
      return '<path d="' + d + '" stroke="#111" stroke-width="3" opacity=".45"/><polygon points="' + pts.join(" ") + '" fill="#fff" stroke="#111" stroke-width="3.5" stroke-linejoin="round"/>' +
        '<path d="M150 22l30 13v20c0 19-13 33-30 41-17-8-30-22-30-41V35z" fill="#111"/><path d="M146 38h8l-1.5 26h-5zM150 70a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z" fill="#ff2b2b"/>';
    }
    default: return B + focus(150, 56, 32, 40, r) + '<circle class="m-ac" cx="150" cy="56" r="26"/>';
  }
}
function waves(y, fill, amp) {
  const a = amp || 10, d = "M0 " + y + " C40 " + (y - a) + " 60 " + (y + a) + " 100 " + y + " S160 " + (y - a) + " 200 " + y + " 260 " + (y + a) + " 300 " + (y - 2) + " V114 H0Z";
  return '<path d="' + d + '" fill="' + fill + '"/><path d="' + d + '" fill="url(#seig)" opacity=".75"/>';
}
function woodMotif(kind, r) {
  const W = "#f3e9d3", N = "#1b2340", sheet = (x, y, rot) => '<g transform="translate(' + x + " " + y + ") rotate(" + rot + ')"><rect width="52" height="66" fill="' + W + '" stroke="' + N + '" stroke-width="2.6"/><path d="M9 14h30M9 25h34M9 36h22" stroke="' + N + '" stroke-width="2.6"/></g>';
  switch (kind) {
    case "deadline": return '<rect width="300" height="114" fill="#e9b949"/><circle cx="240" cy="32" r="15" fill="#c8302c"/>' + waves(86, "#2a4b8d") + sheet(118, 14, -6) + '<path d="M196 82V40M182 54l14-14 14 14" stroke="' + N + '" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    case "lecture": case "meeting": return '<rect width="300" height="114" fill="#dfe6ee"/><path d="M0 84L60 44 104 70 160 26 222 72 300 40V114H0Z" fill="#6b84b0"/><path d="M160 26l14 11-7 1-7-5-8 6-5-5z" fill="' + W + '"/>' + waves(96, "#2a4b8d", 7) + '<rect x="100" y="12" width="100" height="48" fill="' + W + '" stroke="' + N + '" stroke-width="2.6"/><path d="M112 26h50M112 37h66M112 48h34" stroke="#2a4b8d" stroke-width="2.6"/>';
    case "focus": case "event": return '<rect width="300" height="114" fill="#e7a25d"/>' + waves(90, "#2f7f7a") + '<circle cx="150" cy="50" r="32" fill="' + W + '" stroke="' + N + '" stroke-width="2.6"/><path d="M150 50V30M150 50l14 9" stroke="' + N + '" stroke-width="3" stroke-linecap="round"/>' +
      (kind === "focus" ? '<path d="M210 14l-22 32h15l-4 28 24-36h-15z" fill="#c8302c" stroke="' + N + '" stroke-width="2.2" stroke-linejoin="round"/>' : "");
    case "mail": return '<rect width="300" height="114" fill="#cfe0d8"/><path d="M30 34c8-10 22-10 28 0M44 30c4-8 14-8 18 0" fill="none" stroke="#2f7f7a" stroke-width="2.4"/>' + waves(94, "#2a4b8d", 6) +
      '<path d="M118 46c18-22 44-26 62-18-10 2-18 8-22 16 14-6 30-4 40 4-22-2-40 6-52 18z" fill="' + N + '"/><g transform="translate(150 54) rotate(-8)"><rect width="56" height="38" fill="' + W + '" stroke="' + N + '" stroke-width="2.6"/><path d="M2 3l26 19 26-19" fill="none" stroke="' + N + '" stroke-width="2.6"/></g>';
    case "week": { let d = ""; for (let i = 0; i < 26; i++) { const x = r() * 320 - 10, y = r() * 100; d += "M" + x.toFixed(0) + " " + y.toFixed(0) + "l-7 16"; }
      return '<rect width="300" height="114" fill="#e7d9bb"/><path d="' + d + '" stroke="#2a4b8d" stroke-width="1.6" opacity=".6"/>' + waves(98, "#2f7f7a", 6) + '<g transform="rotate(-4 150 56)"><rect x="114" y="16" width="72" height="76" fill="' + W + '" stroke="' + N + '" stroke-width="2.6"/><rect x="114" y="16" width="72" height="16" fill="#2f7f7a"/><path d="M126 46h48M126 58h48M126 70h48M126 82h48M138 40v46M150 40v46M162 40v46" stroke="' + N + '" stroke-width="1.4"/></g>'; }
    case "learn": { let d = ""; for (let i = 0; i < 22; i++) d += '<circle cx="' + (r() * 300).toFixed(0) + '" cy="' + (r() * 80).toFixed(0) + '" r="' + (1 + r() * 1.6).toFixed(1) + '" fill="' + W + '"/>';
      return '<rect width="300" height="114" fill="' + N + '"/>' + d + waves(98, "#2a4b8d", 6) + '<path d="M150 18a24 24 0 0 0-14 43c3 2.2 4 4.6 4 8h20c0-3.4 1-5.8 4-8a24 24 0 0 0-14-43z" fill="#e9b949" stroke="' + W + '" stroke-width="2.2"/><rect x="140" y="72" width="20" height="8" fill="' + W + '"/>'; }
    case "work": return '<rect width="300" height="114" fill="#2a4b8d"/><rect width="300" height="114" fill="url(#seig)" opacity=".35"/><path d="M40 30h70v20h40M40 82h80V62h30M260 30h-70v20h-40M260 82h-80V62h-30" stroke="#e9b949" stroke-width="2.2" fill="none"/><rect x="120" y="26" width="60" height="60" fill="' + W + '" stroke="' + N + '" stroke-width="2.6"/><rect x="134" y="40" width="32" height="32" fill="#b5612a"/>';
    case "tutorial": case "task": return '<rect width="300" height="114" fill="#e6dcc2"/>' + waves(96, "#5f7d33", 6) + '<rect x="104" y="14" width="92" height="74" fill="' + W + '" stroke="' + N + '" stroke-width="2.6"/><path d="M116 32h64M116 46h54M116 60h64" stroke="' + N + '" stroke-width="2.2"/>';
    case "boss": return '<rect width="300" height="114" fill="#1b2340"/><rect width="300" height="40" fill="#c8302c"/>' +
      '<path d="M0 70C40 40 90 30 128 52 104 46 92 62 106 74 130 92 170 70 186 44 214 70 250 66 300 54V114H0Z" fill="#2a4b8d"/><path d="M0 70C40 40 90 30 128 52 104 46 92 62 106 74 130 92 170 70 186 44 214 70 250 66 300 54V114H0Z" fill="url(#seig)"/>' +
      '<path d="M150 14l28 12v19c0 18-12 31-28 38-16-7-28-20-28-38V26z" fill="' + W + '" stroke="' + N + '" stroke-width="2.6"/><path d="M146 30h8l-1.5 24h-5zM150 60a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z" fill="#c8302c"/>';
    default: return '<rect width="300" height="114" fill="#e9b949"/><circle cx="150" cy="50" r="22" fill="#c8302c"/>' + waves(88, "#2a4b8d");
  }
}
function motifSVG(P, c) {
  const r = rng((P.seed || P.date) + ":" + c.id + ":art");
  const inner = P.series === "woodcut" ? woodMotif(c.kind, r) : mangaMotif(c.kind, r);
  return '<svg viewBox="0 0 300 ' + (P.series === "woodcut" ? 114 : 112) + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + inner + "</svg>";
}
function backHTML(P) {
  const S = SERIES[P.series] || SERIES.chapter, pal = paletteOf(P);
  if (P.series === "woodcut") return '<div class="bk" style="background:' + pal.pk + '"><svg viewBox="0 0 300 419" preserveAspectRatio="none"><rect width="300" height="419" fill="url(#seig)" opacity=".5"/><rect x="18" y="18" width="264" height="383" fill="none" stroke="#f3e9d3" stroke-width="3"/></svg><b>Daily<br>Sheet<small>' + S.unit + " " + pad(P.no || 1) + "</small></b></div>";
  const r = rng("back"); let d = "";
  for (let i = 0; i < 44; i++) { const a = (i / 44) * Math.PI * 2 + (r() - .5) * .08, s = 46 + r() * 30; d += "M" + (150 + Math.cos(a) * s).toFixed(0) + " " + (210 + Math.sin(a) * s).toFixed(0) + "L" + (150 + Math.cos(a) * 420).toFixed(0) + " " + (210 + Math.sin(a) * 420).toFixed(0); }
  const tone = P.series === "color" ? pal.tone : pal.pk;
  return '<div class="bk" style="background:#111"><svg viewBox="0 0 300 419" preserveAspectRatio="none"><defs><radialGradient id="bkg"><stop offset="0" stop-color="' + tone + '"/><stop offset="1" stop-color="' + tone + '" stop-opacity="0"/></radialGradient></defs><circle cx="150" cy="210" r="150" fill="url(#bkg)" opacity=".9"/><path d="' + d + '" stroke="#fff" stroke-width="1.6" opacity=".55"/></svg><b>Daily<br>Pack<small>' + S.unit + " " + pad(P.no || 1) + "</small></b></div>";
}
function isDone(P, c) { return !!(c.done || (Store.state.done && Store.state.done[P.date + ":" + c.id])); }
function cardHTML(P, c, i, n) {
  const S = SERIES[P.series] || SERIES.chapter, K = KIND[c.kind] || KIND.event, hu = hueOf(P, c);
  const rows = (c.rows || []).slice(0, 2).map(([ic, b, s]) => "<li><i>" + icon(ic, 2.5) + "</i><div><b>" + esc(b) + "</b>" + (s ? "<span>" + esc(s) + "</span>" : "") + "</div></li>").join("");
  const st = (c.stats || []).slice(0, 3); while (st.length < 3) st.push(["", ""]);
  const line = c.line || ["", ""];
  const T = traitsOf(P, c);
  const cls = "tc s-" + P.series + " k-" + c.kind + " r" + (c.rarity || 1) + " f-" + foilFor(P, c) + " rim-" + T.rim + " tex-" + T.tex + (plain(c.title).length > 18 ? " long" : "") + (String(c.value || "").length > 6 || plain(c.title).length > 24 ? " hd-stack" : "") + (isDone(P, c) ? " is-done" : "");
  return '<article class="' + cls + '" data-i="' + i + '" style="--h:' + hu.h + ";--hl:" + hu.hl + ";--on-h:" + hu.on + ";--tone-url:url(#tone-" + hu.key + ");--w:" + T.float.toFixed(3) + ";--cr:" + T.crease.toFixed(2) + ";--crease:var(--wear-crease-" + T.creaseN + ')" aria-label="' + esc(cardSpeech(P, c, i, n)) + '">' +
    '<div class="ci"><span class="rim"></span><span class="rim b"></span><div class="face front">' + (P.series === "woodcut" ? '<span class="inner"></span>' : "") +
    '<header class="hd"><h3 class="nm">' + esc(c.title) + '</h3><div class="val"><span class="vn">' + esc(c.value) + "</span>" + (c.valueSub ? "<small>" + esc(c.valueSub) + "</small>" : "") + "</div></header>" +
    '<div class="art">' + motifSVG(P, c) + '<span class="tag">' + icon(K.icon, 2.6) + esc(c.tag || K.label) + (c.kind === "boss" ? " · Boss" : "") + "</span>" +
    (P.series === "woodcut" ? '<span class="seal">' + (c.kind === "boss" ? "Boss" : clamp(c.rarity || 1, 1, 5) + SPARK) + "<small>" + (c.kind === "boss" ? "card" : "rarity") + "</small></span>" : "") + "</div>" +
    '<p class="ln"><span>' + esc(line[0]) + "</span><span>" + esc(line[1] || "") + "</span></p>" +
    '<ul class="rows">' + rows + "</ul>" +
    '<div class="st">' + st.map(([k, v]) => "<div>" + esc(k) + "<b>" + esc(v) + "</b></div>").join("") + "</div>" +
    '<footer class="ft"><span>' + pad(i + 1) + "/" + pad(n) + " · " + S.unit + " " + pad(P.no || 1) + '</span><span class="rar">' + SPARK.repeat(clamp(c.rarity || 1, 1, 5)) + "</span></footer>" +
    '<div class="tex"></div><div class="wear"></div><div class="chips"></div><div class="fx"></div><div class="glare"></div><div class="stamp">' + icon("check", 3) + "Done</div>" +
    '</div><div class="face back">' + backHTML(P) + "</div></div></article>";
}
function cardSpeech(P, c, i, n) {
  const K = KIND[c.kind] || KIND.event;
  return "Card " + (i + 1) + " of " + n + ", " + RARITY[c.rarity || 1] + ". " + (c.tag || K.label) + ": " + plain(c.title) + ", " + c.value + (c.valueSub ? " " + c.valueSub : "") + ". " +
    (c.rows || []).slice(0, 2).map((r) => r[1] + (r[2] ? ", " + r[2] : "")).join(". ");
}
function packTitleHTML(P) { const S = SERIES[P.series] || SERIES.chapter; return '<div class="pp-title">' + (P.series === "woodcut" ? esc(P.month) : S.packTitle) + "</div>"; }
function packPrintHTML(P) {
  const S = SERIES[P.series] || SERIES.chapter, pal = paletteOf(P), r = rng((P.seed || P.date) + ":pack"), n = (P.cards || []).length;
  if (P.series === "woodcut") {
    return '<div class="pp-panel"><svg class="pp-art" viewBox="0 0 258 434" preserveAspectRatio="none"><circle cx="196" cy="236" r="40" fill="' + pal.accent + '"/>' +
      '<path d="M0 300C40 270 80 320 130 296S210 266 258 290V434H0Z" fill="' + pal.pk + '"/><path d="M0 300C40 270 80 320 130 296S210 266 258 290V434H0Z" fill="url(#seig)"/>' +
      '<path d="M0 360C50 334 90 380 140 356S220 330 258 352V434H0Z" fill="#1b2340"/><path d="M0 360C50 334 90 380 140 356S220 330 258 352V434H0Z" fill="url(#seig)" opacity=".6"/></svg></div>' +
      '<div class="pp-day">' + esc(P.day) + '</div><div class="pp-tab">' + esc((P.weekday || "").toUpperCase()) + '</div>' +
      '<div class="pp-seal">' + n + "<br>sheets</div>" + '<div class="pp-foot"><span>' + S.name + " " + pad(P.no || 1) + "</span><span>" + n + (n === 1 ? " card" : " cards") + "</span></div>";
  }
  let d = ""; const cx = 196, cy = 300;
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2 + (r() - .5) * .07, s = 70 + r() * 30; d += "M" + (cx + Math.cos(a) * s).toFixed(0) + " " + (cy + Math.sin(a) * s).toFixed(0) + "L" + (cx + Math.cos(a) * 600).toFixed(0) + " " + (cy + Math.sin(a) * 600).toFixed(0); }
  const toneDots = P.series === "color"
    ? '<defs><pattern id="ppt-' + P.date + '" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.6" fill="' + pal.tone + '"/></pattern></defs><rect width="286" height="408" fill="url(#ppt-' + P.date + ')" opacity=".55"/>'
    : '<defs><pattern id="ppt-' + P.date + '" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="' + pal.tone + '"/></pattern></defs><rect y="250" width="286" height="160" fill="url(#ppt-' + P.date + ')" opacity=".85"/>';
  return '<svg class="pp-art" viewBox="0 0 286 408" preserveAspectRatio="none">' + toneDots + '<path d="' + d + '" stroke="' + pal.ink + '" stroke-width="2.4" opacity=".75"/></svg>' +
    '<div class="pp-tab">' + esc((P.weekday || "").toUpperCase()) + '</div>' + (P.series === "chapter" ? '<div class="pp-sfx" style="color:' + pal.tone + '">WHAM!</div>' : "") + '<div class="pp-day">' + esc(P.day) + "</div>" +
    '<div class="pp-foot"><span>' + esc(P.month) + " · " + S.name + " " + pad(P.no || 1) + "</span><span>" + n + (n === 1 ? " card" : " cards") + "</span></div>";
}
function applyPackColors(el, P) {
  const pal = paletteOf(P);
  el.style.setProperty("--pk", pal.pk); el.style.setProperty("--pk-ink", pal.ink); el.style.setProperty("--pk-day", pal.day || "#fff");
}
function ensureTones() {
  const defs = $("defs");
  Object.entries(SERIES.color.hues).forEach(([k, v]) => {
    if (document.getElementById("tone-" + k)) return;
    defs.insertAdjacentHTML("beforeend", '<pattern id="tone-' + k + '" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.7" fill="' + v + '"/></pattern>');
  });
}

/* ================= textures, generated once ================= */
let crinkleCanvas = null;
(function textures() {
  try {
    const c = document.createElement("canvas"); c.width = 360; c.height = 520;
    const g = c.getContext("2d"), r = rng(7);
    for (let i = 0; i < 46; i++) { g.beginPath(); g.moveTo(r() * 360, r() * 520); for (let k = 0; k < 3 + r() * 3; k++) g.lineTo(r() * 360, r() * 520); g.closePath(); g.fillStyle = r() > .5 ? "rgba(255,255,255," + (.04 + r() * .12) + ")" : "rgba(30,8,0," + (.03 + r() * .09) + ")"; g.fill(); }
    for (let i = 0; i < 120; i++) {
      const x = r() * 360, y = r() * 520, a = r() * Math.PI * 2, len = 20 + r() * 170, x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, mx = (x + x2) / 2 + (r() - .5) * 30, my = (y + y2) / 2 + (r() - .5) * 30;
      g.lineWidth = .6 + r() * 1.4; g.strokeStyle = "rgba(255,255,255," + (.18 + r() * .35) + ")"; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, x2, y2); g.stroke();
      g.strokeStyle = "rgba(30,8,0," + (.1 + r() * .2) + ")"; g.beginPath(); g.moveTo(x + 1.2, y + 1.2); g.quadraticCurveTo(mx + 1.2, my + 1.2, x2 + 1.2, y2 + 1.2); g.stroke();
    }
    crinkleCanvas = c;
    document.documentElement.style.setProperty("--crinkle", "url(" + c.toDataURL("image/png") + ")");
    const gl = document.createElement("canvas"); gl.width = gl.height = 180; const q = gl.getContext("2d"), cols = ["#ff4fa3", "#2bb3ff", "#ffb000", "#8f5bff", "#20c997", "#ff6a48"];
    for (let i = 0; i < 30; i++) {
      const x = r() * 180, y = r() * 180, s = 1.6 + r() * 3.4; q.fillStyle = cols[i % cols.length]; q.globalAlpha = .55 + r() * .4; q.beginPath();
      q.moveTo(x, y - s); q.quadraticCurveTo(x, y, x + s, y); q.quadraticCurveTo(x, y, x, y + s); q.quadraticCurveTo(x, y, x - s, y); q.quadraticCurveTo(x, y, x, y - s); q.fill();
    }
    document.documentElement.style.setProperty("--glitter-c", "url(" + gl.toDataURL("image/png") + ")");
    const mk = (w, h, fn) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; fn(cv.getContext("2d"), w, h); return "url(" + cv.toDataURL("image/png") + ")"; };
    const root = document.documentElement.style;
    root.setProperty("--wear-scr", mk(300, 420, (q, W, H) => { for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, l = 6 + r() * 60; q.strokeStyle = "rgba(70,62,52," + (.25 + r() * .45) + ")"; q.lineWidth = .4 + r() * .9; q.beginPath(); q.moveTo(x, y); q.quadraticCurveTo(x + Math.cos(a) * l * .5 + (r() - .5) * 6, y + Math.sin(a) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); q.stroke(); } }));
    root.setProperty("--wear-dust", mk(300, 420, (q, W, H) => {
      for (let i = 0; i < 16; i++) { const x = r() * W, y = r() * H, rr = 20 + r() * 70, g2 = q.createRadialGradient(x, y, 0, x, y, rr); g2.addColorStop(0, "rgba(120,100,70," + (.12 + r() * .16) + ")"); g2.addColorStop(1, "rgba(120,100,70,0)"); q.fillStyle = g2; q.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      for (let i = 0; i < 520; i++) { const edge = r() < .65, x = edge ? (r() < .5 ? r() * 30 : W - r() * 30) : r() * W, y = edge && r() < .5 ? (r() < .5 ? r() * 30 : H - r() * 30) : r() * H; q.fillStyle = "rgba(60,48,32," + (.2 + r() * .5) + ")"; q.beginPath(); q.arc(x, y, .4 + r() * 1.3, 0, 7); q.fill(); }
    }));
    root.setProperty("--wear-edge", mk(300, 420, (q, W, H) => {
      q.fillStyle = "rgba(255,255,255,.95)";
      const chip = (x, y) => { q.beginPath(); const s = 1 + r() * 4.5; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; q.lineTo(x + Math.cos(a) * s * (.5 + r()), y + Math.sin(a) * s * (.5 + r())); } q.fill(); };
      for (let i = 0; i < 140; i++) { const t = r(), side = (r() * 4) | 0, d = r() * 5; if (side === 0) chip(t * W, d); else if (side === 1) chip(W - d, t * H); else if (side === 2) chip(t * W, H - d); else chip(d, t * H); }
      for (let k = 0; k < 4; k++) { const cx = k % 2 ? W : 0, cy = k > 1 ? H : 0; for (let i = 0; i < 14; i++) chip(cx + (k % 2 ? -1 : 1) * r() * 16, cy + (k > 1 ? -1 : 1) * r() * 16); }
    }));
    [1, 2].forEach((n) => root.setProperty("--wear-crease-" + n, mk(300, 420, (q, W, H) => {
      const x0 = n === 1 ? -20 : W * .2, y0 = n === 1 ? H * .3 : -20, x1 = n === 1 ? W + 20 : W * .85, y1 = n === 1 ? H * .62 : H + 20;
      q.lineCap = "round"; q.strokeStyle = "rgba(255,255,255,.85)"; q.lineWidth = 2.2; q.beginPath(); q.moveTo(x0, y0); q.lineTo(x1, y1); q.stroke();
      q.strokeStyle = "rgba(40,30,20,.55)"; q.lineWidth = 1.4; q.beginPath(); q.moveTo(x0 + 1.6, y0 + 1.6); q.lineTo(x1 + 1.6, y1 + 1.6); q.stroke();
    })));
    root.setProperty("--tex-grain", mk(160, 160, (q, W, H) => { const id = q.createImageData(W, H); for (let i = 0; i < id.data.length; i += 4) { const v = 150 + r() * 105; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } q.putImageData(id, 0, 0); }));
    root.setProperty("--tex-linen", mk(120, 120, (q, W, H) => { q.fillStyle = "#fff"; q.fillRect(0, 0, W, H); for (let i = 0; i < W; i += 2) { q.fillStyle = "rgba(90,80,60," + (.06 + r() * .12) + ")"; q.fillRect(i, 0, 1, H); q.fillRect(0, i, W, 1); } }));
    root.setProperty("--tex-emboss", mk(120, 120, (q, W, H) => { q.fillStyle = "#808080"; q.fillRect(0, 0, W, H); for (let i = -H; i < W; i += 7) { q.strokeStyle = "rgba(255,255,255,.55)"; q.lineWidth = 1.2; q.beginPath(); q.moveTo(i, 0); q.lineTo(i + H, H); q.stroke(); q.strokeStyle = "rgba(0,0,0,.45)"; q.beginPath(); q.moveTo(i + 1.5, 0); q.lineTo(i + 1.5 + H, H); q.stroke(); } }));
    const w = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="22"><g fill="none" stroke="#9fb4ff" stroke-width="1.2" opacity=".35"><circle cx="22" cy="22" r="20"/><circle cx="22" cy="22" r="14"/><circle cx="22" cy="22" r="8"/><circle cx="0" cy="22" r="20"/><circle cx="0" cy="22" r="14"/><circle cx="44" cy="22" r="20"/><circle cx="44" cy="22" r="14"/></g></svg>';
    document.documentElement.style.setProperty("--wave-bg", 'url("data:image/svg+xml;utf8,' + encodeURIComponent(w) + '")');
  } catch (e) {}
})();

/* ================= sound: synthesised, quiet, material ================= */
const Sfx = (() => {
  let ctx = null, out = null, noise = null, fine = null, dense = null, loops = {}, muted = false, unlocked = false, lastPop = 0;
  try { muted = localStorage.getItem("mb-muted") === "1"; } catch (e) {}
  function crackle(density, decayMs, seconds) {
    const sr = ctx.sampleRate, len = Math.floor(sr * seconds), b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0); let t = 0;
    while (true) {
      t += Math.max(1, Math.floor(-Math.log(1 - Math.random()) * sr / density)); if (t >= len) break;
      const amp = Math.pow(Math.random(), 2.4) * (Math.random() < .5 ? -1 : 1), dec = (.15 + Math.random() * decayMs) * sr / 1000;
      for (let k = 0; k < dec * 5 && t + k < len; k++) d[t + k] += amp * (Math.random() * 2 - 1) * Math.exp(-k / dec);
    }
    return b;
  }
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); out = ctx.createGain(); out.gain.value = muted ? 0 : .9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; out.connect(comp); comp.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    fine = crackle(170, 1.1, 3); dense = crackle(1400, 2, 2);
    return true;
  }
  function resume() {
    if (!init()) return;
    if (ctx.state !== "running") ctx.resume().catch(() => {});
    if (!unlocked) { unlocked = true; try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) {} }
  }
  function play(buf, o) {
    if (!ctx || muted || ctx.state !== "running") return;
    const t = (o.t != null ? o.t : ctx.currentTime) + (o.at || 0), dur = o.dur || .2;
    const s = ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = o.rate || 1;
    const f = ctx.createBiquadFilter(); f.type = o.type || "highpass"; f.frequency.setValueAtTime(o.f || 2000, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur); f.Q.value = o.q || .7;
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .3, t + (o.attack || .01));
    g.gain.setValueAtTime(o.vol || .3, t + dur * (o.hold || .3)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * Math.max(0, buf.duration - dur - .05)); s.stop(t + dur + .05);
  }
  function tone(o) {
    if (!ctx || muted || ctx.state !== "running") return;
    const t = ctx.currentTime + (o.at || 0), dur = o.dur || .2, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || "sine"; osc.frequency.setValueAtTime(o.f, t); if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .2, t + (o.attack || .012)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(g); g.connect(out); osc.start(t); osc.stop(t + dur + .05);
  }
  function loopStart(name, buf, f, q, type) {
    resume(); if (!ctx) return; loopStop(name, true);
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = .94 + Math.random() * .12;
    const fl = ctx.createBiquadFilter(); fl.type = type || "highpass"; fl.frequency.value = f; fl.Q.value = q || .7;
    const g = ctx.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(out); s.start(0, Math.random() * buf.duration); loops[name] = {s, g, fl};
  }
  function loopLevel(name, v, f) { const l = loops[name]; if (!l) return; const t = ctx.currentTime; l.g.gain.setTargetAtTime(v, t, .05); if (f) l.fl.frequency.setTargetAtTime(f, t, .08); }
  function loopStop(name, now) { const l = loops[name]; if (!l) return; delete loops[name]; const t = ctx.currentTime; l.g.gain.setTargetAtTime(0, t, now ? .005 : .07); l.s.stop(t + (now ? .03 : .4)); }
  const buzz = (p) => { if (!muted && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };
  /* one perforation bridge snapping: a tiny bright tick, each one a little different */
  function pop(v, at) { play(noise, {dur: .012 + Math.random() * .012, f: 2300 + Math.random() * 2600, type: "bandpass", q: 1.6 + Math.random() * 2, vol: clamp(v, .03, .32) * (.6 + Math.random() * .5), attack: .0008, hold: .05, at: at || 0}); }
  return {
    resume, buzz, get muted() { return muted; },
    setMuted(m) { muted = m; try { localStorage.setItem("mb-muted", m ? "1" : "0"); } catch (e) {} if (ctx) out.gain.setTargetAtTime(m ? 0 : .9, ctx.currentTime, .02); },
    handleStart() { if (!muted) loopStart("handle", fine, 3200, .6); }, handleLevel(v) { loopLevel("handle", Math.min(1, v) * .075); }, handleStop() { loopStop("handle"); },
    tearStart() { if (!muted) loopStart("tear", dense, 2600, .9, "bandpass"); }, tearLevel(v, p) { loopLevel("tear", Math.min(1, v) * .12, 2000 + (p || 0) * 2200); }, tearStop(now) { loopStop("tear", now); },
    perf(v) { if (!ctx) return; const now = ctx.currentTime; if (now - lastPop < .006) return; lastPop = now; pop(v); },
    rip() { resume(); for (let i = 0; i < 12; i++) pop(.28 - i * .015, i * .011 + Math.random() * .006); play(dense, {dur: .32, f: 1800, f2: 4600, type: "bandpass", q: .7, vol: .34, attack: .006, hold: .25}); },
    fwump() { tone({f: 150, f2: 52, dur: .26, vol: .26, attack: .018}); play(noise, {dur: .22, f: 420, f2: 160, type: "lowpass", vol: .22, attack: .02}); play(fine, {dur: .5, f: 3400, vol: .12, at: .04}); },
    flutter() { play(noise, {dur: .5, f: 900, f2: 260, type: "bandpass", q: 1.4, vol: .12, attack: .05}); },
    slideStart() { if (!muted) loopStart("slide", noise, 700, .8, "lowpass"); }, slideLevel(v) { loopLevel("slide", Math.min(1, v) * .1, 500 + Math.min(1, v) * 900); }, slideStop() { loopStop("slide"); },
    slideOut() { play(noise, {dur: .3, f: 300, f2: 1900, type: "bandpass", q: 1, vol: .13, attack: .06}); play(fine, {dur: .08, f: 3000, vol: .14, at: .22}); },
    flip() { play(noise, {dur: .09, f: 2600, f2: 900, type: "bandpass", q: 1.2, vol: .16}); },
    reveal(r) {
      if (r >= 5) { tone({f: 82, f2: 38, dur: .9, vol: .34, attack: .01}); tone({f: 220, f2: 196, dur: .5, type: "triangle", vol: .12, attack: .004}); play(noise, {dur: .7, f: 260, f2: 90, type: "lowpass", vol: .3, attack: .01, hold: .2});
        [329.6, 311.1, 293.7].forEach((f, i) => tone({f, dur: .32, type: "sawtooth", vol: .035, at: .32 + i * .16})); return; }
      if (r === 4) { [1318.5, 1661.2, 1975.5, 2637, 3322.4].forEach((f, i) => tone({f, dur: .6, vol: .06, at: i * .06})); play(fine, {dur: .7, f: 5000, vol: .14, at: .1}); return; }
      if (r === 3) { [987.8, 1318.5].forEach((f, i) => tone({f, dur: .4, vol: .07, at: i * .09})); return; }
      tone({f: 1567.98, dur: .18, vol: .05});
    },
    tuck() { play(noise, {dur: .07, f: 700, type: "lowpass", vol: .3, attack: .003}); tone({f: 180, f2: 110, dur: .08, type: "triangle", vol: .1}); },
    tick() { tone({f: 2093, dur: .03, vol: .035}); },
    chime() { [783.99, 1174.66, 1567.98].forEach((f, i) => tone({f, dur: .7, vol: .05, at: i * .12})); },
    fanfare() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({f, dur: i === 3 ? .7 : .2, type: "triangle", vol: .1, at: i * .1})); }
  };
})();
["pointerup", "touchend", "keydown", "click"].forEach((ev) => document.addEventListener(ev, () => Sfx.resume(), {capture: true, passive: true}));

/* ================= sparkles and light ================= */
const Sparks = (() => {
  const cv = $("sparks"), g = cv.getContext("2d"); let parts = [], raf = 0, W = 0, H = 0, dpr = 1, ambient = null;
  function size() { dpr = Math.min(1.25, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener("resize", size);
  function star(x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(0, 0, s, 0); g.quadraticCurveTo(0, 0, 0, s); g.quadraticCurveTo(0, 0, -s, 0); g.quadraticCurveTo(0, 0, 0, -s); g.fill(); g.restore();
  }
  function loop() {
    g.clearRect(0, 0, W, H);
    if (ambient && Math.random() < ambient.rate) {
      const a = ambient, x = a.x + (Math.random() - .5) * a.w * 1.3, y = a.y + (Math.random() - .5) * a.h * 1.2;
      parts.push({x, y, vx: (Math.random() - .5) * .15, vy: -.12 - Math.random() * .2, life: 0, max: 60 + Math.random() * 60, s: 2 + Math.random() * 4.5, c: a.colors[(Math.random() * a.colors.length) | 0], rot: Math.random(), tw: true, g: 0});
    }
    parts = parts.filter((p) => p.life < p.max);
    for (const p of parts) {
      p.life++; p.vy += p.g; p.vx *= p.drag || 1; p.vy *= p.drag || 1; p.x += p.vx; p.y += p.vy; p.rot += .02;
      const k = p.life / p.max, a = p.tw ? Math.sin(k * Math.PI) : 1 - k;
      g.globalAlpha = clamp(a, 0, 1); g.fillStyle = p.c; star(p.x, p.y, p.s * (p.tw ? (.6 + Math.sin(k * Math.PI) * .6) : 1), p.rot);
    }
    g.globalAlpha = 1;
    raf = parts.length || ambient ? requestAnimationFrame(loop) : 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  return {
    ambient(rect, colors, rate) { ambient = rect ? {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, w: rect.width, h: rect.height, colors: colors || ["#fff8dc", "#ffffff", "#ffe08a"], rate: rate || .25} : null; if (ambient && !reduced) kick(); },
    clear() { parts.forEach((p) => { p.max = Math.min(p.max, p.life + 8); }); },
    burst(x, y, o) {
      if (reduced) return; o = o || {};
      const n = o.n || 26, cols = o.colors || ["#fff", "#ffe08a", "#ffd60a"];
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, sp = (o.speed || 4) * (.35 + Math.random()); parts.push({x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), g: o.g != null ? o.g : .06, drag: .97, life: 0, max: 40 + Math.random() * 40, s: (o.size || 4) * (.5 + Math.random()), c: cols[i % cols.length], rot: Math.random() * 6, tw: false}); }
      kick();
    }
  };
})();
