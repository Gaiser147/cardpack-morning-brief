/* ================= data: packs in the artifact database, one baked-in fallback ================= */
/* the baked-in pack(s): one sample pack in the artifact build, several in the demo build */
const FALLBACKS = [].concat(JSON.parse($("pack-fallback").textContent)).sort((a, b) => b.date.localeCompare(a.date));
const FALLBACK = FALLBACKS[0];
const Store = {
  db: null, uid: null, packs: [], state: {opened: {}, done: {}}, ref: null, wq: Promise.resolve(), onChange: null, live: false,
  valid(p) { return p && typeof p.date === "string" && Array.isArray(p.cards) && p.cards.length > 0; },
  loadLocal() { try { const s = JSON.parse(localStorage.getItem("mb-state") || "null"); if (s) this.state = {opened: s.opened || {}, done: s.done || {}}; } catch (e) {} },
  saveLocal() { try { localStorage.setItem("mb-state", JSON.stringify(this.state)); } catch (e) {} },
  async init() {
    this.loadLocal();
    const within = (p, ms) => Promise.race([Promise.resolve(p).catch(() => null), sleep(ms).then(() => null)]);
    let db = null;
    try { if (window.claude && typeof window.claude.use === "function") db = await within(window.claude.use("db"), 5000); } catch (e) { db = null; }
    if (!db) { this.packs = FALLBACKS.slice(); return; }
    this.db = db;
    try { const user = await within(window.claude.use("user"), 3000); this.uid = user && typeof user.id === "function" ? await within(user.id(), 3000) : null; } catch (e) {}
    if (this.uid) {
      try {
        this.ref = db.doc("data/users/" + this.uid + "/state");
        const s = await within(this.ref.get(), 5000);
        if (s && s.exists) { const d = JSON.parse(JSON.stringify(s.data() || {})); this.state = {opened: Object.assign({}, this.state.opened, d.opened), done: Object.assign({}, this.state.done, d.done)}; }
      } catch (e) { this.ref = null; }
    }
    await new Promise((resolve) => {
      let first = true;
      const done = () => { if (!first) return; first = false; clearTimeout(t); if (!this.packs.length) this.packs = FALLBACKS.slice(); resolve(); };
      const t = setTimeout(done, 6500);
      try {
        db.collection("packs").orderBy("date", "desc").limit(90).onSnapshot((snap) => {
          const list = snap.docs.map((d) => d.data()).filter((p) => this.valid(p)).map((p) => JSON.parse(JSON.stringify(p)));
          const cached = !!(snap.metadata && snap.metadata.fromCache);
          if (!list.length && cached) return;
          this.packs = list.length ? list : FALLBACKS.slice(); this.live = list.length > 0;
          /* a cached first answer may be yesterday's state: give the server a moment to deliver today's pack */
          if (first && cached) { if (!this.cacheT) this.cacheT = setTimeout(done, 2500); return; }
          if (first) done(); else if (this.onChange) this.onChange();
        }, () => done());
      } catch (e) { done(); }
    });
  },
  sorted() { return this.packs.slice().sort((a, b) => b.date.localeCompare(a.date)); },
  today() { return this.sorted()[0] || FALLBACK; },
  save() {
    this.saveLocal();
    if (!this.ref) return;
    const body = JSON.parse(JSON.stringify(this.state));
    this.wq = this.wq.then(() => this.ref.set(body)).catch(() => {});
  },
  markOpened(P) { if (this.state.opened[P.date]) return; this.state.opened[P.date] = Date.now(); this.save(); },
  toggleDone(P, c) { const k = P.date + ":" + c.id; if (this.state.done[k]) delete this.state.done[k]; else this.state.done[k] = Date.now(); this.save(); return !!this.state.done[k]; },
  streak() { const ds = this.sorted().map((p) => p.date); let n = 0; for (let i = 0; i < ds.length; i++) { if (this.state.opened[ds[i]]) n++; else if (n || i > 0) break; } return n; }
};

/* ================= small UI helpers ================= */
const body = document.body, live = (t) => { $("live").textContent = ""; setTimeout(() => { $("live").textContent = t; }, 40); };
let toastT = 0;
function toast(t) { const el = $("toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 2000); }
function setPhase(ph) { body.classList.remove("phase-intro", "phase-opened", "phase-draw", "phase-reveal", "phase-finale"); if (ph) body.classList.add("phase-" + ph); }
function setSeries(s) { body.classList.remove("s-chapter", "s-color", "s-woodcut"); body.classList.add("s-" + s); }
function elFrom(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function barBottom() { return $("bar").getBoundingClientRect().bottom; }
function flakes(x, y, dir, color) {
  if (reduced) return;
  const cols = [color, "#ffffff", color, "#d9dbe2"];
  for (let i = 0; i < 16; i++) {
    const el = document.createElement("i"); el.className = "flake"; el.style.background = cols[i % cols.length]; document.body.appendChild(el);
    const a = (-90 + (Math.random() - .5) * 150) * Math.PI / 180, dist = 60 + Math.random() * 120, tx = x + Math.cos(a) * dist + dir * 30, ty = y + Math.sin(a) * dist;
    anim(el, [{transform: "translate(" + x + "px," + y + "px) rotate(0deg)", opacity: 1}, {transform: "translate(" + tx + "px," + ty + "px) rotate(" + (Math.random() * 540 - 270) + "deg)", opacity: 1, offset: .55},
      {transform: "translate(" + (tx + dir * 10) + "px," + (ty + 130) + "px) rotate(" + (Math.random() * 720) + "deg)", opacity: 0}], {duration: 900 + Math.random() * 400, easing: "cubic-bezier(.2,.7,.4,1)"}).finished.then(() => el.remove());
  }
}

/* ================= card tilt: shared by the revealed card, the hand and the zoom ================= */
function tiltCard(el, rx, ry, lift) {
  el.style.setProperty("--rx", rx.toFixed(2) + "deg"); el.style.setProperty("--ry", ry.toFixed(2) + "deg");
  el.style.setProperty("--mx", (50 + ry * 3.2).toFixed(1) + "%"); el.style.setProperty("--my", (50 - rx * 3.4).toFixed(1) + "%");
  el.style.setProperty("--rxn", rx.toFixed(2)); el.style.setProperty("--ryn", ry.toFixed(2));
  if (lift != null) el.style.setProperty("--lift", lift.toFixed(2));
}
function springCard(el) {
  cancelAnimationFrame(el._spr);
  let rx = parseFloat(el.style.getPropertyValue("--rx")) || 0, ry = parseFloat(el.style.getPropertyValue("--ry")) || 0, vx = 0, vy = 0, last = performance.now();
  const f = (t) => {
    const dt = Math.min(.032, (t - last) / 1000); last = t;
    vx += (-170 * rx - 12.5 * vx) * dt; rx += vx * dt; vy += (-170 * ry - 12.5 * vy) * dt; ry += vy * dt;
    if (Math.abs(rx) + Math.abs(ry) + Math.abs(vx) + Math.abs(vy) < .02) { tiltCard(el, 0, 0, 0); return; }
    tiltCard(el, rx, ry, Math.min(1, (Math.abs(rx) + Math.abs(ry)) / 14)); el._spr = requestAnimationFrame(f);
  };
  el._spr = requestAnimationFrame(f);
}
function bindTilt(el, o) {
  o = o || {}; let d = null;
  el.addEventListener("pointerdown", (e) => { if (o.enabled && !o.enabled()) return; d = {x: e.clientX, y: e.clientY, id: e.pointerId, moved: 0}; try { el.setPointerCapture(e.pointerId); } catch (err) {} cancelAnimationFrame(el._spr); cancelAnimationFrame(el._idle); el._idle = 0; });
  el.addEventListener("pointermove", (e) => {
    if (!d) { if (e.pointerType === "mouse" && o.hover) { const r = el.getBoundingClientRect(); tiltCard(el, -((e.clientY - r.top) / r.height - .5) * 14, ((e.clientX - r.left) / r.width - .5) * 20, .6); } return; }
    const dx = e.clientX - d.x, dy = e.clientY - d.y; d.moved = Math.max(d.moved, Math.hypot(dx, dy));
    if (o.onSwipeDown && dy > 95 && Math.abs(dy) > Math.abs(dx) * 1.2) { const fn = o.onSwipeDown; d = null; springCard(el); fn(dx); return; }
    tiltCard(el, 16 * Math.tanh(-dy / 120), 22 * Math.tanh(dx / 120), Math.min(1, Math.hypot(dx, dy) / 90));
  });
  const up = () => { if (!d) return; const tap = d.moved < 8; d = null; springCard(el); if (tap && o.onTap) o.onTap(); };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  el.addEventListener("pointerleave", (e) => { if (!d && e.pointerType === "mouse" && o.hover) springCard(el); });
}
function idleSway(el) {
  if (reduced) return; const t0 = performance.now();
  const f = (t) => { const s = (t - t0) / 1000, a = Math.max(0, 1 - s / .6); if (!a) { tiltCard(el, 0, 0, 0); el._idle = 0; return; } tiltCard(el, Math.sin(s * 3.2) * 4 * a, Math.sin(s * 2.4 + .7) * 7 * a, .35 * a); el._idle = requestAnimationFrame(f); };
  el._idle = requestAnimationFrame(f);
}

/* ================= the pack: tilt with light and spring ================= */
const wrap = $("packWrap"), pack = $("pack"), packMove = $("packMove");
let tilt = {rx: 0, ry: 0}, springRaf = 0, breatheRaf = 0, dragging = null;
function setTilt(rx, ry) {
  tilt = {rx, ry}; const s = wrap.style;
  s.setProperty("--rx", rx.toFixed(2) + "deg"); s.setProperty("--ry", ry.toFixed(2) + "deg");
  s.setProperty("--gx", (50 - ry * 3.4).toFixed(1) + "%"); s.setProperty("--gy", (26 + rx * 3.2).toFixed(1) + "%");
  s.setProperty("--px", (ry * .55).toFixed(2) + "px"); s.setProperty("--py", (-rx * .55).toFixed(2) + "px");
}
function stopMotion() { cancelAnimationFrame(springRaf); cancelAnimationFrame(breatheRaf); springRaf = breatheRaf = 0; }
function springBack() {
  stopMotion(); let {rx, ry} = tilt, vx = 0, vy = 0, last = performance.now();
  const f = (t) => { const dt = Math.min(.032, (t - last) / 1000); last = t; vx += (-170 * rx - 12.5 * vx) * dt; rx += vx * dt; vy += (-170 * ry - 12.5 * vy) * dt; ry += vy * dt;
    if (Math.abs(rx) + Math.abs(ry) + Math.abs(vx) + Math.abs(vy) < .02) { setTilt(0, 0); springRaf = 0; if (Flow.phase === "intro") breathe(); return; } setTilt(rx, ry); springRaf = requestAnimationFrame(f); };
  springRaf = requestAnimationFrame(f);
}
function breathe() {
  if (reduced) return; stopMotion(); const t0 = performance.now(), a = tilt;
  const f = (t) => { const s = (t - t0) / 1000, k = Math.min(1, s / .8); setTilt(lerp(a.rx, Math.sin(s * 1.1) * 2.2, k), lerp(a.ry, Math.sin(s * .8 + .6) * 4, k)); breatheRaf = requestAnimationFrame(f); };
  breatheRaf = requestAnimationFrame(f);
}
pack.addEventListener("pointerdown", (e) => {
  if (Flow.phase !== "intro" || e.target.closest(".tear-zone")) return;
  dragging = {x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now()};
  try { pack.setPointerCapture(e.pointerId); } catch (err) {} stopMotion(); Sfx.resume(); Sfx.handleStart(); hint(false);
});
pack.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - dragging.x, dy = e.clientY - dragging.y; setTilt(11 * Math.tanh(-dy / 120), 16 * Math.tanh(dx / 120));
  const now = performance.now(), v = Math.hypot(e.clientX - dragging.lx, e.clientY - dragging.ly) / Math.max(1, now - dragging.lt);
  Sfx.handleLevel(v * .9); dragging.lx = e.clientX; dragging.ly = e.clientY; dragging.lt = now;
});
const endDrag = () => { if (!dragging) return; dragging = null; Sfx.handleStop(); springBack(); };
pack.addEventListener("pointerup", endDrag); pack.addEventListener("pointercancel", endDrag);

/* ================= tearing along the perforation, in 3D slices ================= */
let hintAnim = null;
function hint(on) {
  if (hintAnim) { hintAnim.cancel(); hintAnim = null; }
  if (!on || reduced) return;
  const dir = Tear.dir || 1, a = dir > 0 ? Math.max(5, Tear.p * 100) : Math.min(95, 100 - Tear.p * 100), b = dir > 0 ? 95 : 5;
  hintAnim = anim($("swipeDot"), [{left: a + "%", opacity: 0, transform: "translateZ(5px) scale(.6)"}, {left: a + "%", opacity: 1, transform: "translateZ(5px) scale(1)", offset: .12},
    {left: b + "%", opacity: 1, transform: "translateZ(5px) scale(1)", offset: .7}, {left: b + "%", opacity: 0, transform: "translateZ(5px) scale(.8)", offset: .82}, {left: b + "%", opacity: 0}],
  {duration: 2100, iterations: Infinity, easing: "cubic-bezier(.45,0,.25,1)", delay: 400, fill: "none"});
}
const Tear = {
  slices: [], w: 0, h: 0, dir: 0, p: 0, done: false, holes: 0,
  build(P) {
    const strip = $("strip"); strip.getAnimations().forEach((a) => a.cancel()); $("tearLayer").getAnimations().forEach((a) => a.cancel()); strip.innerHTML = ""; strip.className = "strip"; strip.style.opacity = ""; this.slices = [];
    const w = strip.clientWidth, h = strip.clientHeight; this.w = w; this.h = h; this.p = 0; this.dir = 0; this.done = false; this.holes = 0;
    if (!w || !h) return;
    const pal = paletteOf(P), dpr = Math.min(2, devicePixelRatio || 1), u = w / 286, c = document.createElement("canvas");
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    const rad = 7 * u; g.beginPath(); g.moveTo(0, h); g.lineTo(0, rad); g.quadraticCurveTo(0, 0, rad, 0); g.lineTo(w - rad, 0); g.quadraticCurveTo(w, 0, w, rad); g.lineTo(w, h); g.closePath();
    g.fillStyle = pal.pk; g.fill(); g.save(); g.clip();
    g.fillStyle = "rgba(0,0,0,.16)"; for (let x = 0; x < w; x += 7 * u) g.fillRect(x, 0, 3 * u, h * .5);
    g.fillStyle = pal.ink; g.font = "900 " + Math.round(12.5 * u) + 'px "Zen Kaku Gothic New", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("Tear here", w / 2, h * .66);
    g.fillStyle = "rgba(0,0,0,.45)"; for (let x = w * .03; x < w * .97; x += 6.5 * u) g.fillRect(x, h - 3.6 * u, 3.4 * u, 2 * u);
    if (crinkleCanvas) { g.globalAlpha = .6; g.globalCompositeOperation = "overlay"; g.drawImage(crinkleCanvas, 0, 0, 360, 360 * h / w, 0, 0, w, h); }
    g.restore();
    const url = c.toDataURL("image/png"), N = 30, sw = w / N;
    for (let k = 0; k < N; k++) {
      const s = document.createElement("div"); s.className = "slice"; s.style.left = (k * sw) + "px"; s.style.width = (sw + .8) + "px";
      s.innerHTML = '<i class="sf"></i><i class="sb"></i><i class="sh"></i>';
      const f = s.firstChild; f.style.backgroundImage = "url(" + url + ")"; f.style.backgroundSize = w + "px " + h + "px"; f.style.backgroundPosition = (-k * sw) + "px 0";
      strip.appendChild(s); this.slices.push({el: s, x0: k * sw, ew: sw + .8});
    }
  },
  set(p, dir) {
    this.p = p; this.dir = dir; const {w, h, slices} = this, step = w / slices.length, F = dir > 0 ? p * w : w - p * w;
    const torn = dir > 0 ? slices.filter((s) => s.x0 + step * .5 <= F).reverse() : slices.filter((s) => s.x0 + step * .5 >= F);
    const set = new Set(torn);
    slices.forEach((s) => { if (!set.has(s) && s.el.style.transform) { s.el.style.transform = ""; s.el.style.setProperty("--dk", 0); s.el.style.setProperty("--hl", 0); } });
    let ax = torn.length ? (dir > 0 ? torn[0].x0 + step : torn[0].x0) : F, ay = h; const k = 18 / slices.length, phi0 = 3 + p * 6, kap = (1.7 + p * 2.6) * k, thStep = (5.6 + p * 2.6) * k;
    torn.forEach((s, j) => {
      const ramp = Math.min(1, (j + 1) / 3), phi = Math.min(55, phi0 + j * kap) * ramp, th = Math.min(150, j * thStep) * ramp, r = phi * Math.PI / 180;
      if (dir > 0) { s.el.style.transformOrigin = "100% 100%"; s.el.style.transform = "translate(" + (ax - (s.x0 + s.ew)).toFixed(2) + "px," + (ay - h).toFixed(2) + "px) rotate(" + phi.toFixed(2) + "deg) rotateX(" + (-th).toFixed(1) + "deg)"; ax -= step * Math.cos(r); ay -= step * Math.sin(r); }
      else { s.el.style.transformOrigin = "0% 100%"; s.el.style.transform = "translate(" + (ax - s.x0).toFixed(2) + "px," + (ay - h).toFixed(2) + "px) rotate(" + (-phi).toFixed(2) + "deg) rotateX(" + (-th).toFixed(1) + "deg)"; ax += step * Math.cos(r); ay -= step * Math.sin(r); }
      s.el.style.setProperty("--dk", (Math.sin(Math.min(th, 90) * Math.PI / 180) * .34).toFixed(3)); s.el.style.setProperty("--hl", (phi / 55 * .24).toFixed(3));
    });
    $("mouth").style.opacity = Math.min(1, p * 1.8).toFixed(3);
  },
  /* each perforation bridge the front crosses gives one tiny tick */
  crossed(p, v) { const holes = Math.floor(p * this.w / (6.5 * this.w / 286)); let n = holes - this.holes; this.holes = holes; n = Math.min(n, 3); for (let i = 0; i < n; i++) Sfx.perf(.06 + Math.min(1, v) * .22); },
  async complete() {
    if (this.done) return; this.done = true; Flow.phase = "opening";
    hint(false); Sfx.tearStop(); Sfx.rip(); Sfx.buzz([14, 30, 22]);
    const dir = this.dir || 1, p0 = this.p;
    if (reduced) { await anim($("strip"), [{opacity: 1}, {opacity: 0}], {duration: 120}).finished; } else
    await tween(170, (k) => this.set(lerp(p0, 1, k), dir));
    const strip = $("strip"), r = strip.getBoundingClientRect();
    setTimeout(() => flakes(dir > 0 ? r.left + r.width * .3 : r.right - r.width * .3, r.top - 60, dir, paletteOf(Flow.P).pk), reduced ? 0 : 450);
    Sfx.flutter();
    if (Flow.P.series !== "woodcut" && !reduced) setTimeout(() => {
      const fx = document.createElement("div"); fx.className = "sfx-pop"; fx.textContent = "RIIIP!"; fx.style.color = paletteOf(Flow.P).tone || "#fff"; document.body.appendChild(fx);
      const fxw = fx.offsetWidth, fxX = clamp(r.left + r.width / 2 - fxw / 2, 10, innerWidth - fxw - 10), fxY = r.top - 70;
      anim(fx, [{transform: "translate(" + fxX + "px," + (fxY + 20) + "px) rotate(-12deg) scale(.4)", opacity: 0}, {transform: "translate(" + fxX + "px," + fxY + "px) rotate(-8deg) scale(1.08)", opacity: 1, offset: .25},
        {transform: "translate(" + fxX + "px," + (fxY - 6) + "px) rotate(-8deg) scale(1)", opacity: 1, offset: .7}, {transform: "translate(" + fxX + "px," + (fxY - 18) + "px) rotate(-8deg) scale(.96)", opacity: 0}], {duration: 900, easing: "cubic-bezier(.2,.9,.3,1)"}).finished.then(() => fx.remove());
    }, 380);
    if (reduced) { strip.style.opacity = 0; } else
    await anim(strip, [{transform: "translateZ(2px)", opacity: 1, offset: 0, easing: "cubic-bezier(.25,.6,.4,1)"}, {opacity: 1, offset: .55},
      {transform: "translateZ(40px) translate(" + (dir * -90) + "px,-520px) rotate(" + (dir * -42) + "deg) rotateX(160deg)", opacity: 0}], {duration: 760, easing: "linear"}).finished;
    strip.classList.add("gone");
    Sfx.fwump();
    Flow.opened();
  }
};
const zone = $("tearZone"); let tearing = null;
zone.addEventListener("pointerdown", (e) => {
  if (Flow.phase !== "intro" || Tear.done) return; e.stopPropagation();
  try { zone.setPointerCapture(e.pointerId); } catch (err) {}
  stopMotion(); hint(false); Sfx.resume(); Sfx.tearStart(); Sfx.buzz(6); $("headline").style.opacity = 0;
  tearing = {x0: e.clientX, y0: e.clientY, lx: e.clientX, lt: performance.now(), dir: Tear.p > 0 ? Tear.dir : 0, base: Tear.p, v: 0, moved: 0};
});
zone.addEventListener("pointermove", (e) => {
  if (!tearing) return;
  const dx = e.clientX - tearing.x0; tearing.moved = Math.max(tearing.moved, Math.abs(dx));
  if (!tearing.dir && Math.abs(dx) > 6) tearing.dir = Math.sign(dx);
  if (!tearing.dir) return;
  const now = performance.now(); tearing.v = Math.abs(e.clientX - tearing.lx) / Math.max(1, now - tearing.lt); tearing.lx = e.clientX; tearing.lt = now;
  const p = Math.max(Tear.p, clamp(tearing.base + tearing.dir * dx / (Tear.w * .8), 0, 1));
  if (p > Tear.p) { Tear.set(p, tearing.dir); Tear.crossed(p, tearing.v); }
  setTilt(p * 2.4, -tearing.dir * p * 6);
  Sfx.tearLevel(tearing.v * .9, p);
  if (p >= .97) { tearing = null; Tear.complete(); springBack(); }
});
const endTear = () => {
  if (!tearing) return; const t = tearing; tearing = null;
  if (t.moved < 6) { Sfx.tearStop(true); nudge(); return; }
  if (Tear.p > .62) { Tear.complete(); springBack(); return; }
  Sfx.tearStop(); springBack(); if (Tear.p > 0) $("hintline").innerHTML = "Keep swiping<small>The strip is still hanging on</small>"; hint(true);
};
zone.addEventListener("pointerup", endTear); zone.addEventListener("pointercancel", endTear);
zone.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && Flow.phase === "intro") { e.preventDefault(); autoTear(); } });
function nudge() { Sfx.tick(); anim($("strip"), [{transform: "translateZ(2px) rotate(0)"}, {transform: "translateZ(2px) rotate(-1.6deg) translateY(-3px)"}, {transform: "translateZ(2px) rotate(1.2deg)"}, {transform: "translateZ(2px) rotate(0)"}], {duration: 420, fill: "none"}); hint(true); }
async function autoTear() {
  if (Tear.done) return; hint(false); $("headline").style.opacity = 0; Sfx.resume(); Sfx.tearStart(); const dir = Tear.dir || 1, p0 = Tear.p;
  if (!reduced) await tween(720, (k) => { const p = lerp(p0, 1, k); Tear.set(p, dir); Tear.crossed(p, .7); Sfx.tearLevel(.7, p); }, easeIO);
  Tear.complete();
}

/* ================= the whole flow: intro, open, draw, hand ================= */
const cta = $("cta"), banner = $("banner"), mini = $("minihand");
let glowRGB = [255, 214, 10];
function glowTo(str, ms) {
  const to = str.split(",").map(Number), from = glowRGB.slice();
  if (reduced || !ms) { glowRGB = to; wrap.style.setProperty("--glowc", to.join(",")); return; }
  tween(ms, (e) => { glowRGB = from.map((v, i) => Math.round(lerp(v, to[i], e))); wrap.style.setProperty("--glowc", glowRGB.join(",")); });
}
const Flow = {
  P: null, n: 0, idx: 0, phase: "idle", inner: null, card: null, override: null, pullDist: 0, busy: false,
  view(P) { return this.override ? Object.assign({}, P, {series: this.override, palette: 0}) : P; },
  topRarity(from) { let r = 1; for (let i = from || 0; i < this.n; i++) r = Math.max(r, this.P.cards[i].rarity || 1); return r; },
  glowFor(r) { return r >= 5 ? "255,43,43" : r >= 4 ? "255,214,10" : r >= 3 ? "120,220,255" : "255,240,210"; },
  async start(P0) {
    const P = this.view(P0); this.P = P; this.n = P.cards.length; this.idx = 0; this.busy = false;
    const S = SERIES[P.series] || SERIES.chapter;
    body.classList.remove("view-hand", "view-binder"); setSeries(P.series); setPhase("intro"); this.phase = "intro";
    document.querySelectorAll(".tc.rv").forEach((e) => e.remove());
    applyPackColors(wrap, P); pack.classList.toggle("pk-wood", P.series === "woodcut");
    $("pprint").innerHTML = packPrintHTML(P); $("pptop").innerHTML = packTitleHTML(P);
    this.fillStack();
    mini.innerHTML = "<b></b>"; cta.classList.remove("on"); banner.style.opacity = 0;
    packMove.getAnimations().forEach((a) => a.cancel()); packMove.style.transform = ""; wrap.style.setProperty("--glow", 0); $("mouth").style.opacity = 0;
    const rays = $("rays"); rays.className = "rays" + (P.light === "halo" ? " halo" : P.light === "ring" ? " ring" : ""); drawRays();
    const boss = P.cards.some((c) => c.kind === "boss");
    $("hlTitle").textContent = (P.weekday ? P.weekday + ", " : "") + (P.month || "") + (P.day ? " " + P.day : "");
    $("hlSub").textContent = S.name + " " + pad(P.no || 1) + " · " + this.n + (this.n === 1 ? " card" : " cards") + (boss ? " · boss card inside" : "");
    $("headline").style.opacity = 1;
    $("hintline").innerHTML = "Swipe across the perforation<small>Tilt to catch the foil in the light</small>"; $("hintline").style.opacity = 1;
    wrap.classList.add("hidden");
    try { await Promise.race([document.fonts.load('400 100px "Dela Gothic One"').then(() => document.fonts.ready), sleep(2500)]); } catch (e) {}
    Tear.build(P);
    if (reduced) { wrap.classList.remove("hidden"); rays.style.opacity = .5; return; }
    anim(rays, [{opacity: 0}, {opacity: 1}], {duration: 1400, easing: "ease-out"});
    const dropKF = [{translate: "0 -75vh", rotate: "-9deg"}, {translate: "0 4%", rotate: "1.5deg", offset: .72}, {translate: "0 0", rotate: "0deg"}], dropO = {duration: 1050, easing: "cubic-bezier(.2,.8,.25,1)", fill: "none"};
    const drop = anim(packMove, dropKF, dropO); anim($("tearLayer"), dropKF, dropO);
    wrap.classList.remove("hidden");
    await drop.finished;
    const pr = pack.getBoundingClientRect();
    Sparks.burst(pr.left + pr.width / 2, pr.top + pr.height * .55, {n: 30, speed: 5, colors: ["#fff", "#ffe08a", paletteOf(P).pk], g: .03});
    anim($("psweep"), [{opacity: 0, transform: "translateX(-60%)"}, {opacity: 1, offset: .2}, {opacity: 0, transform: "translateX(60%)"}], {duration: 1100, easing: "ease-in-out", fill: "none"});
    Sparks.ambient(pr, ["#fff8dc", "#ffffff", "#ffe08a"], .22);
    Sfx.chime();
    if (this.phase === "intro") { breathe(); setTimeout(() => { if (this.phase === "intro" && !Tear.p) hint(true); }, 900); }
  },
  fillStack() {
    const left = this.n - this.idx, P = this.P;
    $("stack").innerHTML = Array.from({length: Math.min(3, Math.max(0, left - (this.inner ? 1 : 0)))}, () => '<div class="tcb s-' + P.series + '">' + backHTML(P) + "</div>").join("");
  },
  async opened() {
    const P = this.P; Store.markOpened(P); refreshBinderNum();
    setPhase("opened"); this.phase = "opened"; stopMotion(); setTilt(0, 0);
    $("headline").style.opacity = 0; $("hintline").style.opacity = 0;
    const r = this.topRarity(0); glowTo(this.glowFor(r), 0);
    const pr = pack.getBoundingClientRect();
    tween(500, (k) => wrap.style.setProperty("--glow", (k * .9).toFixed(3)));
    Sparks.burst(pr.left + pr.width / 2, pr.top + pr.height * .1, {n: 34, speed: 4.5, up: 2, colors: ["#fff", "rgb(" + this.glowFor(r) + ")", "#ffe08a"], g: .05});
    Sparks.ambient(null);
    live("Pack open. " + this.n + (this.n === 1 ? " card." : " cards."));
    await sleep(reduced ? 0 : 520);
    const target = innerHeight * .72, cur = pr.top + pr.height * .124, dy = target - cur;
    await anim(packMove, [{transform: "none"}, {transform: "translateY(" + dy.toFixed(0) + "px) scale(.94)"}], {duration: reduced ? 1 : 620, easing: "cubic-bezier(.3,.7,.2,1)"}).finished;
    packMove.style.transform = "translateY(" + dy.toFixed(0) + "px) scale(.94)"; packMove.getAnimations().forEach((a) => a.cancel());
    tween(400, (k) => wrap.style.setProperty("--glow", lerp(.9, .35, k).toFixed(3)));
    this.ready();
  },
  ready() {
    const P = this.P, c = P.cards[this.idx];
    setPhase("draw"); this.phase = "draw"; if (!$("strip").getAnimations().length) $("strip").innerHTML = "";
    this.inner = elFrom(cardHTML(P, c, this.idx, this.n)); const inner = this.inner;
    inner.classList.add("show-back"); inner.style.cssText = "position:absolute;left:8.5%;top:4.2%;width:83%;--flip:180deg;transform:translateZ(-.5px)";
    pack.insertBefore(inner, $("mouth"));
    this.fillStack();
    const ph = pack.clientHeight, cw = pack.clientWidth * .83; this.pullDist = cw / .716 + ph * .02;
    const r = c.rarity || 1; glowTo(this.glowFor(r), 320);
    tween(380, (k) => wrap.style.setProperty("--glow", lerp(parseFloat(wrap.style.getPropertyValue("--glow")) || 0, r >= 4 ? .95 : r >= 3 ? .6 : .32, k).toFixed(3)));
    if (r >= 4 && !reduced) { const pr = pack.getBoundingClientRect(); Sparks.ambient({left: pr.left, top: pr.top - pr.height * .1, width: pr.width, height: pr.height * .3}, ["#fff", "rgb(" + this.glowFor(r) + ")"], .35); } else Sparks.ambient(null);
    const left = this.n - this.idx;
    $("hlTitle").textContent = "Card " + (this.idx + 1) + " of " + this.n;
    $("hlSub").textContent = r >= 5 ? "Something glows red in there …" : r >= 4 ? "Something glitters in there …" : r >= 3 ? "Something shimmers" : "Pull it up out of the pack";
    $("headline").style.opacity = 1;
    cta.innerHTML = icon("draw", 2.4) + "Draw card<small>" + left + " left</small>"; cta.classList.add("on");
    this.updateMini();
  },
  pullTo(py) { if (this.inner) this.inner.style.transform = "translateZ(-.5px) translateY(" + (-py).toFixed(1) + "px)"; },
  async pull(from) {
    if (this.busy || this.phase !== "draw") return; this.busy = true; cta.classList.remove("on"); $("headline").style.opacity = 0;
    const P = this.P, c = P.cards[this.idx], inner = this.inner, r = c.rarity || 1;
    Sfx.slideOut();
    await tween(reduced ? 1 : 300, (k) => this.pullTo(lerp(from || 0, this.pullDist, k)), easeOut);
    const rect = inner.getBoundingClientRect();
    const el = elFrom(cardHTML(P, c, this.idx, this.n)); el.classList.add("rv"); this.card = el;
    const bb = barBottom(), packTop = pack.getBoundingClientRect().top + pack.clientHeight * .124 * .94;
    const availH = packTop + 24 - (bb + 60), RW = Math.min(innerWidth * .8, 320, availH * .716), RH = RW / .716;
    const x = (innerWidth - RW) / 2, y = Math.max(bb + 60, packTop + 24 - RH);
    el.style.width = RW + "px"; el.style.setProperty("--cw", RW + "px"); el.style.setProperty("--flip", "0deg"); el.style.visibility = "hidden";
    el.style.transformOrigin = "0 0"; el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
    document.body.appendChild(el);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    el.classList.add("show-back"); el.style.setProperty("--flip", "180deg"); el.style.visibility = ""; inner.remove(); this.inner = null;
    const s0 = rect.width / RW, from0 = "translate(" + rect.left.toFixed(1) + "px," + rect.top.toFixed(1) + "px) scale(" + s0.toFixed(4) + ")", to = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(1)";
    el.style.transformOrigin = "0 0"; el.style.transform = to;
    setPhase("reveal"); this.phase = "reveal";
    if (!reduced) {
      const mid = "translate(" + x.toFixed(1) + "px," + (y - 30).toFixed(1) + "px) scale(1.04) rotate(-2deg)";
      anim(el, [{transform: from0}, {transform: mid, offset: .6}, {transform: to}], {duration: 760, easing: "cubic-bezier(.25,.8,.3,1)", fill: "none"});
      await sleep(200); Sfx.flip();
      const ci = el.querySelector(".ci"), pp = (820 * RW / 300).toFixed(0);
      el.style.setProperty("--flip", "0deg"); el.classList.add("flipping");
      const fl = ci.animate([{transform: "perspective(" + pp + "px) rotateY(180deg)", easing: "cubic-bezier(.45,0,.55,1)"}, {transform: "perspective(" + pp + "px) rotateY(-5deg)", offset: .71, easing: "ease-out"}, {transform: "perspective(" + pp + "px) rotateY(0deg)"}], {duration: 590, fill: "none"});
      if (r >= 5) setTimeout(() => this.bossFlash(el), 210);
      setTimeout(() => this.landed(el, c, r, x, y, RW, RH), 357);
      try { await fl.finished; } catch (e) {}
      el.classList.remove("flipping", "show-back");
    } else { el.classList.remove("show-back"); el.style.setProperty("--flip", "0deg"); this.landed(el, c, r, x, y, RW, RH); }
    this.busy = false;
  },
  landed(el, c, r, x, y, RW, RH) {
    Sfx.reveal(r); if (r >= 5) Sfx.buzz([30, 40, 70]); else if (r >= 4) Sfx.buzz(18);
    const cx = x + RW / 2, cy = y + RH / 2;
    if (r >= 5 && !reduced) {
      const sh = {translate: ["0px 0px", "-9px 2px", "8px -1px", "-6px 1px", "4px 0px", "-2px 0px", "0px 0px"], rotate: ["0deg", "-1.6deg", "1.4deg", "-1deg", ".6deg", "-.2deg", "0deg"]};
      const shc = {translate: ["0px 0px", "-11px 2px", "10px -1px", "-7px 1px", "5px 0px", "-2px 0px", "0px 0px"], rotate: ["0deg", "-1.8deg", "1.6deg", "-1.1deg", ".6deg", "-.2deg", "0deg"]};
      anim(el.querySelector(".ci"), shc, {duration: 500, easing: "cubic-bezier(.36,.07,.19,.97)", fill: "none"}); anim(wrap, {translate: sh.translate}, {duration: 420, fill: "none"});
      Sparks.burst(cx, cy, {n: 46, speed: 7, colors: ["#ff2b2b", "#ffffff", "#ffb38a", "#111"], g: .08, size: 5});
    } else if (r >= 4) Sparks.burst(cx, cy, {n: 40, speed: 6, colors: ["#fff", "#ffe08a", "#ff8ad8", "#8eecff"], g: .05});
    else if (r >= 3) Sparks.burst(cx, cy, {n: 18, speed: 4, colors: ["#fff", "#8eecff"], g: .05});
    Sparks.ambient(null);
    banner.className = "banner r" + r; banner.querySelector("b").textContent = RARITY[r]; banner.querySelector("span").textContent = traitsOf(this.P, c).tier;
    banner.style.top = Math.max(barBottom() + 2, y - 52) + "px"; banner.style.right = Math.max(12, innerWidth - (x + RW) + 6) + "px";
    anim(banner, [{opacity: 0, transform: "translateY(10px) scale(.9)"}, {opacity: 1, transform: "none"}], {duration: 260, easing: "cubic-bezier(.2,.9,.3,1.3)"});
    live(cardSpeech(this.P, c, this.idx, this.n));
    const last = this.idx === this.n - 1;
    cta.innerHTML = icon("hand", 2.2) + (last ? "To hand · done" : "To hand"); cta.classList.add("on");
    bindTilt(el, {hover: true, enabled: () => this.phase === "reveal", onSwipeDown: (dx) => this.toHand(dx)});
    idleSway(el);
    tween(400, (k) => wrap.style.setProperty("--glow", lerp(parseFloat(wrap.style.getPropertyValue("--glow")) || 0, .25, k).toFixed(3)));
    if (last && !reduced) setTimeout(() => { if (this.phase === "reveal") Hand.build(this.P); }, 900);
  },
  bossFlash(el) {
    if (reduced) return;
    const fl = $("flash"); fl.style.background = "radial-gradient(circle at 50% 42%,rgba(255,240,230,.7) 0 12%,rgba(255,43,43,.55) 30%,rgba(120,0,0,.35) 60%,rgba(0,0,0,0))";
    anim(fl, [{opacity: 0}, {opacity: 1, offset: .12}, {opacity: 0}], {duration: 600, fill: "none"});
  },
  updateMini() {
    const P = this.P; let h = "";
    for (let i = 0; i < this.idx; i++) { const hu = HUES[hueOf(P, P.cards[i]).key]; h += '<i style="--h:' + hu + ";transform:rotate(" + ((i - (this.idx - 1) / 2) * 8).toFixed(1) + 'deg)"></i>'; }
    mini.innerHTML = h + "<b>" + this.idx + "/" + this.n + "</b>";
  },
  async toHand(dx) {
    if (this.busy || this.phase !== "reveal" || !this.card) return; this.busy = true;
    const el = this.card; this.card = null; cancelAnimationFrame(el._idle); cancelAnimationFrame(el._spr);
    cta.classList.remove("on"); if (reduced) { banner.getAnimations().forEach((a) => a.cancel()); banner.style.opacity = 0; } else anim(banner, [{opacity: 1}, {opacity: 0}], {duration: 180}); Sparks.clear();
    Sfx.tuck();
    const mr = mini.getBoundingClientRect(), w = el.getBoundingClientRect().width, s = 34 / w;
    const to = "translate(" + (mr.left + 4 + (dx || 0) * .05).toFixed(1) + "px," + (mr.top + 2).toFixed(1) + "px) scale(" + (32 / w).toFixed(4) + ") rotate(" + (this.idx * 3 - 6) + "deg)";
    await anim(el, [{transform: el.style.transform}, {transform: to, opacity: .9}], {duration: reduced ? 1 : 420, easing: "cubic-bezier(.5,0,.3,1)"}).finished;
    el.remove(); this.idx++; this.updateMini(); this.busy = false;
    if (this.idx >= this.n) this.finale(); else this.ready();
  },
  async finale() {
    setPhase("finale"); this.phase = "finale"; Sparks.ambient(null); Sparks.clear();
    Sfx.fanfare();
    const from = mini.getBoundingClientRect();
    anim(packMove, [{transform: packMove.style.transform}, {transform: "translateY(110vh) rotate(9deg)"}], {duration: reduced ? 1 : 560, easing: "cubic-bezier(.5,0,.75,0)"});
    this.finish(false, from);
  },
  finish(skipped, from) {
    const P = this.P || this.view(Store.today());
    this.phase = "hand"; stopMotion(); hint(false); Sparks.ambient(null); setPhase(null);
    if (this.inner) { this.inner.remove(); this.inner = null; }
    document.querySelectorAll(".tc.rv").forEach((e) => e.remove()); this.card = null;
    cta.classList.remove("on"); banner.style.opacity = 0;
    Store.markOpened(P); refreshBinderNum();
    Hand.show(P, {animate: !skipped && !reduced, from: from || mini.getBoundingClientRect()});
  },
  skip() { if (["intro", "opening", "opened", "draw", "reveal", "finale"].includes(this.phase)) { Sfx.tick(); this.finish(true); } }
};
const pz = $("pullZone"); let pulling = null;
pz.addEventListener("pointerdown", (e) => { if (Flow.phase !== "draw" || Flow.busy) return; try { pz.setPointerCapture(e.pointerId); } catch (err) {} pulling = {y0: e.clientY, ly: e.clientY, lt: performance.now(), py: 0, v: 0}; Sfx.resume(); Sfx.slideStart(); });
pz.addEventListener("pointermove", (e) => {
  if (!pulling) return; const now = performance.now(); pulling.v = (pulling.ly - e.clientY) / Math.max(1, now - pulling.lt); pulling.ly = e.clientY; pulling.lt = now;
  pulling.py = clamp(pulling.y0 - e.clientY, 0, Flow.pullDist * 1.02); Flow.pullTo(pulling.py); Sfx.slideLevel(Math.abs(pulling.v) * 1.2);
});
const endPull = () => {
  if (!pulling) return; const p = pulling; pulling = null; Sfx.slideStop();
  if (p.py < 6) { Flow.pull(0); return; }
  if (p.py > Flow.pullDist * .4 || p.v > .55) Flow.pull(p.py); else tween(220, (k) => Flow.pullTo(lerp(p.py, 0, k)));
};
pz.addEventListener("pointerup", endPull); pz.addEventListener("pointercancel", endPull);
cta.addEventListener("click", () => { if (Flow.phase === "draw") Flow.pull(0); else if (Flow.phase === "reveal") Flow.toHand(0); });
$("skip").addEventListener("click", () => Flow.skip());
const muteBtn = $("mute");
function syncMute() { muteBtn.setAttribute("aria-pressed", Sfx.muted ? "true" : "false"); muteBtn.setAttribute("aria-label", Sfx.muted ? "Sound on" : "Sound off"); }
muteBtn.addEventListener("click", () => { Sfx.setMuted(!Sfx.muted); syncMute(); if (!Sfx.muted) { Sfx.resume(); Sfx.tick(); } });
syncMute();

/* ================= the hand: a fan to swipe through, and the list at a glance ================= */
const fan = $("fan");
try { let fw = 0, fh = 0, rq = 0; new ResizeObserver((en) => { const r = en[0].contentRect; if (Math.abs(r.width - fw) < 2 && Math.abs(r.height - fh) < 2) return; fw = r.width; fh = r.height; Dbg.n("resize"); if (rq) return; rq = requestAnimationFrame(() => { rq = 0; if (body.classList.contains("view-hand") && Hand.els.length) { Hand.fit(); Hand.layout(); } }); }).observe(fan); } catch (e) {}
const Hand = {
  P: null, els: [], pos: 0, raf: 0, drag: null, lastTick: 0,
  show(P, o) {
    o = o || {}; this.P = P; setSeries(P.series); body.classList.remove("view-binder");
    if (o.animate) body.classList.add("entering");
    body.classList.add("view-hand");
    if (this.builtKey !== P.date + P.series) this.build(P);
    this.fit(); this.pos = o.start || 0; this.layout(); this.sync();
    setMode(body.classList.contains("mode-list") ? "list" : "hand");
    this.enter(o);
  },
  build(P) {
    this.P = P; this.builtKey = P.date + P.series;
    const S = SERIES[P.series] || SERIES.chapter, n = P.cards.length;
    $("handTitle").textContent = P.label || P.date;
    const notes = [];
    if (!P.cards.some((c) => c.kind === "mail") && !/mail/i.test(P.summary || "")) notes.push("no mail");
    if (!P.cards.some((c) => c.kind === "boss") && !/boss|exam|showdown/i.test(P.summary || "")) notes.push("no boss");
    $("handSum").textContent = [P.summary || n + (n === 1 ? " card" : " cards")].concat(notes).join(" · ");
    $("stand").textContent = S.name + " " + pad(P.no || 1) + " · Data from " + (P.stand || P.date) + (Store.live ? "" : " · demo data");
    fan.innerHTML = P.cards.map((c, i) => cardHTML(P, c, i, n)).join("");
    this.els = Array.from(fan.children);
    $("dots").innerHTML = P.cards.map((c) => "<i" + (c.kind === "boss" ? ' class="boss"' : "") + "></i>").join("");
    this.els.forEach((el) => this.bind(el));
    this.pos = 0; this.layout();
    List.render(P);
    renderPreview();
  },
  enter(o) {
    if (o.animate && o.from) {
      const fw = this.els[0].offsetWidth, fh = fw / .716, fr = fan.getBoundingClientRect(), s = 32 / fw, deckX = o.from.left + 20, deckY = o.from.top + 24;
      fan.classList.add("prep");
      requestAnimationFrame(() => requestAnimationFrame(() => { fan.classList.remove("prep"); body.classList.add("entering", "flying");
      this.els.forEach((el, i) => {
        const bx = fr.left + el.offsetLeft, by = fr.top + el.offsetTop, ox = bx + fw / 2, oy = by + fh * 1.75;
        const tx = deckX - ox, ty = deckY - oy + s * fh * 1.25;
        anim(el, [{transform: "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + s.toFixed(4) + ")", opacity: .9}, {transform: el.style.transform, opacity: 1}], {duration: 760, delay: i * 60, easing: "cubic-bezier(.4,.1,.2,1)", fill: "backwards"});
      });
      setTimeout(() => body.classList.remove("entering", "flying"), 60 + this.els.length * 60 + 780); }));
      anim($("hand").querySelector(".hand-head"), [{opacity: 0, transform: "translateY(-8px)"}, {opacity: 1, transform: "none"}], {duration: 500, delay: 300, fill: "backwards"});
      [".fan-nav", ".hand-actions", ".hand-foot"].forEach((q) => anim($("hand").querySelector(q), [{opacity: 0, transform: "translateY(6px)"}, {opacity: 1, transform: "none"}], {duration: 260, delay: 420, fill: "backwards"}));
    }
  },
  fw() { return this.els[0] ? this.els[0].offsetWidth : 300; },
  fit() { const h = fan.clientHeight, w = fan.clientWidth || innerWidth; if (!h) return; const fw = Math.max(180, Math.min(w * .8, 330, (h - 40) / 1.397)).toFixed(1) + "px"; if (fan.style.getPropertyValue("--fw") !== fw) fan.style.setProperty("--fw", fw); },
  layout() {
    const dv = Math.sign(this.pos - (this.lp == null ? this.pos : this.lp)); if (dv) this.vdir = dv; this.lp = this.pos;
    const n = this.els.length, step = clamp(44 / Math.max(1, n - 1), 5.5, 11);
    this.els.forEach((el, i) => {
      const d = i - this.pos, ad = Math.abs(d), lift = Math.max(0, 1 - ad);
      el.style.transform = "translate3d(0," + (-18 * lift).toFixed(1) + "px," + (lift * 30 - ad * 6).toFixed(1) + "px) rotateZ(" + (d * step).toFixed(2) + "deg) scale(" + (.9 + .1 * lift).toFixed(3) + ")";
      el.style.zIndex = String(1000 - Math.round(ad * 100) + (Math.sign(d) === this.vdir ? 1 : 0)); el.style.opacity = "1"; el.style.pointerEvents = "";
    });
    const k = clamp(Math.round(this.pos), 0, this.els.length - 1); if (k !== this.lastTick) { this.lastTick = k; if (this.drag || this.raf) Sfx.tick(); $("dots").querySelectorAll("i").forEach((dd, j) => dd.classList.toggle("on", j === k)); }
  },
  sync() {
    const k = clamp(Math.round(this.pos), 0, this.els.length - 1), P = this.P, c = P.cards[k];
    $("dots").querySelectorAll("i").forEach((d, i) => d.classList.toggle("on", i === k));
    this.els.forEach((el, i) => { el.setAttribute("aria-hidden", i === k ? "false" : "true"); el.classList.toggle("live", i === k); });
    const acts = [];
    if (c.link && c.link.href) acts.push('<a class="act" href="' + esc(c.link.href) + '" target="_blank" rel="noopener">' + esc(c.link.label || "Open") + icon("link", 2.4) + "</a>");
    if (!NO_DONE.includes(c.kind)) acts.push('<button class="act ghost" type="button" data-done="' + k + '">' + icon("check", 2.6) + (isDone(P, c) ? "Remove stamp" : "Done") + "</button>");
    const ah = acts.join(""); if (ah === this.actsHTML) { $("prev").disabled = k === 0; $("next").disabled = k === this.els.length - 1; return; }
    this.actsHTML = ah; $("handActions").innerHTML = ah; Dbg.n("actions");
    const b = $("handActions").querySelector("[data-done]"); if (b) b.addEventListener("click", () => { const on = Store.toggleDone(P, c); this.els[k].classList.toggle("is-done", isDone(P, c)); if (on) { Sfx.tuck(); stampFx(this.els[k]); } this.actsHTML = null; this.sync(); List.render(P); });
    $("prev").disabled = k === 0; $("next").disabled = k === this.els.length - 1;
  },
  go(i, snap) {
    const P = this.P; if (!P) return; i = clamp(i, 0, this.els.length - 1); const from = this.pos;
    cancelAnimationFrame(this.raf); if (reduced) { this.pos = i; this.layout(); this.sync(); return; }
    const t0 = performance.now(), ms = snap ? 420 : 380, back = (k) => { const c1 = 1.1, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
    const f = (t) => { const k = clamp((t - t0) / ms, 0, 1); this.pos = lerp(from, i, (snap ? back : easeOut)(k)); this.layout(); if (k < 1) this.raf = requestAnimationFrame(f); else { this.raf = 0; this.pos = i; this.layout(); this.sync(); } };
    this.raf = requestAnimationFrame(f); live(cardSpeech(P, P.cards[i], i, P.cards.length));
  },
  bind(el) {
    const i = +el.dataset.i;
    el.addEventListener("pointerdown", (e) => {
      cancelAnimationFrame(this.raf); this.raf = 0;
      this.drag = {x: e.clientX, y: e.clientY, lx: e.clientX, lt: performance.now(), v: 0, pos0: this.pos, mode: null, el, i};
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    });
    el.addEventListener("pointermove", (e) => {
      const d = this.drag; if (!d || d.el !== el) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.mode && Math.hypot(dx, dy) > 8) d.mode = Math.abs(dx) > Math.abs(dy) * 1.15 || Math.round(this.pos) !== i ? "pan" : "tilt";
      if (d.mode === "pan") {
        const now = performance.now(); d.v = (e.clientX - d.lx) / Math.max(1, now - d.lt); d.lx = e.clientX; d.lt = now;
        let p = d.pos0 - dx / (this.fw() * .34); const max = this.els.length - 1; if (p < 0) p = p * .35; if (p > max) p = max + (p - max) * .35;
        this.pos = p; this.layout();
      } else if (d.mode === "tilt") tiltCard(el, 16 * Math.tanh(-dy / 120), 22 * Math.tanh(dx / 120), Math.min(1, Math.hypot(dx, dy) / 90));
    });
    const up = () => {
      const d = this.drag; if (!d || d.el !== el) return; this.drag = null;
      if (d.mode === "pan") { const start = Math.round(d.pos0), moved = this.pos - d.pos0; let t = Math.round(this.pos); if (t === start && (Math.abs(d.v) > .22 || Math.abs(moved) > .2)) t = start + (moved > 0 ? 1 : -1); this.go(clamp(t, 0, this.els.length - 1), true); }
      else if (d.mode === "tilt") springCard(el);
      else { if (Math.round(this.pos) === i) Zoom.open(this.P, i); else this.go(i); }
    };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  }
};
function stampFx(el) { if (reduced) return; anim(el.querySelector(".stamp"), [{transform: "translate(-50%,-50%) rotate(-14deg) scale(1.8)", opacity: 0}, {transform: "translate(-50%,-50%) rotate(-14deg) scale(1)", opacity: 1}], {duration: 260, easing: "cubic-bezier(.3,1.4,.5,1)", fill: "none"}); }
$("prev").addEventListener("click", () => Hand.go(Math.round(Hand.pos) - 1));
$("next").addEventListener("click", () => Hand.go(Math.round(Hand.pos) + 1));
function setMode(m) { body.classList.toggle("mode-list", m === "list"); $("modeHand").setAttribute("aria-pressed", m === "hand"); $("modeList").setAttribute("aria-pressed", m === "list"); }
$("modeHand").addEventListener("click", () => { setMode("hand"); Sfx.tick(); });
$("modeList").addEventListener("click", () => { setMode("list"); Sfx.tick(); });
$("replay").addEventListener("click", () => { Sfx.resume(); Flow.start(Hand.P ? Store.sorted().find((p) => p.date === Hand.P.date) || Store.today() : Store.today()); });
const List = {
  render(P) {
    const n = P.cards.length;
    $("list").innerHTML = P.cards.map((c, i) => {
      const K = KIND[c.kind] || KIND.event, key = hueOf(P, c).key, sub = [c.line && c.line[0], c.rows && c.rows[0] && c.rows[0][1]].filter(Boolean).join(" · ");
      return '<button class="row' + (c.kind === "boss" ? " boss" : "") + (isDone(P, c) ? " done" : "") + '" role="listitem" type="button" data-i="' + i + '" style="--h:' + HUES[key] + '">' +
        '<span class="ri">' + icon(K.icon, 2.4) + "</span><span><b>" + esc(c.title) + "</b><span>" + esc(sub) + '</span></span><span class="rv">' + esc(c.value) + (c.valueSub ? "<small>" + esc(c.valueSub) + "</small>" : "") + "</span></button>";
    }).join("") + (n ? "" : '<p class="b-empty">No cards today.</p>') +
      (P.cards.some((c) => c.kind === "mail") ? "" : '<p class="b-empty">No mail is waiting on you.</p>') +
      (P.cards.some((c) => c.kind === "boss") ? "" : '<p class="b-empty">No boss fight in the next three weeks.</p>');
    $("list").querySelectorAll(".row").forEach((b) => b.addEventListener("click", () => { setMode("hand"); Hand.go(+b.dataset.i); }));
  }
};
const Dbg = {
  c: {}, opts: [["nofx", "Gloss off"], ["notilt", "Tilt off"], ["noshadow", "Shadows off"], ["notex", "Wear off"], ["nomask", "Masks off"], ["nolayer", "Layers off"], ["nobg", "Background off"], ["nosparks", "Sparks off"], ["nopack", "Pack foil off"], ["norays", "Rays off"]],
  on: [], n(k) { this.c[k] = (this.c[k] || 0) + 1; const o = $("dbgCount"); if (o) o.textContent = Object.entries(this.c).map(([a, b]) => a + " " + b).join(" · "); },
  init() { try { this.on = JSON.parse(localStorage.getItem("mb-dbg") || "[]"); } catch (e) { this.on = []; } this.apply(); },
  apply() { this.opts.forEach(([k]) => body.classList.toggle("dbg-" + k, this.on.includes(k))); try { localStorage.setItem("mb-dbg", JSON.stringify(this.on)); } catch (e) {} },
  html() { return '<div class="dbg"><b>Flicker diagnostics</b><span>also applies when you reopen (↻ at the top)</span>' + this.opts.map(([k, l]) => '<button type="button" data-d="' + k + '" aria-pressed="' + this.on.includes(k) + '">' + l + "</button>").join("") + '<small id="dbgCount"></small></div>'; },
  bind(box) { box.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.d; this.on = this.on.includes(k) ? this.on.filter((x) => x !== k) : this.on.concat(k); b.setAttribute("aria-pressed", this.on.includes(k)); this.apply(); })); }
};
function renderPreview() {
  const box = $("preview"); if (!PREVIEW) { box.hidden = true; return; }
  box.hidden = false;
  const cur = Flow.override || (Hand.P && Hand.P.series);
  box.innerHTML = "Preview, series: " + Object.keys(SERIES).map((k) => '<button type="button" data-s="' + k + '" aria-pressed="' + (k === cur) + '">' + SERIES[k].name + "</button>").join("") + Dbg.html(); Dbg.bind(box);
  box.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    Flow.override = b.dataset.s; const base = Store.sorted().find((p) => Hand.P && p.date === Hand.P.date) || Store.today();
    Hand.show(Flow.view(base), {start: Math.round(Hand.pos)}); Sfx.tick();
  }));
}

/* ================= zoom: one card, big, tiltable ================= */

const Zoom = {
  open(P, i) {
    const c = P.cards[i], n = P.cards.length, z = $("zoom");
    $("zc").innerHTML = cardHTML(P, c, i, n); const el = $("zc").firstElementChild; el.style.setProperty("--cw", "var(--zw)");
    bindTilt(el, {hover: true});
    const acts = [];
    if (c.link && c.link.href) acts.push('<a class="act" href="' + esc(c.link.href) + '" target="_blank" rel="noopener">' + esc(c.link.label || "Open") + icon("link", 2.4) + "</a>");
    if (!NO_DONE.includes(c.kind)) acts.push('<button class="act ghost" type="button" id="zDone">' + icon("check", 2.6) + (isDone(P, c) ? "Remove stamp" : "Done") + "</button>");
    const T = traitsOf(P, c);
    acts.unshift('<span class="act ghost cond">' + T.tier + " · " + T.float.toFixed(4) + "</span>");
    $("zact").innerHTML = acts.join("");
    const zd = $("zDone"); if (zd) zd.addEventListener("click", () => { const on = Store.toggleDone(P, c); el.classList.toggle("is-done", isDone(P, c)); if (on) { Sfx.tuck(); stampFx(el); } zd.innerHTML = icon("check", 2.6) + (isDone(P, c) ? "Remove stamp" : "Done"); refreshAfterStamp(P); });
    z.classList.add("on"); Sfx.flip();
    if (!reduced) anim(el, [{transform: "scale(.85)", opacity: 0}, {transform: "none", opacity: 1}], {duration: 260, easing: "cubic-bezier(.2,.9,.3,1.2)", fill: "none"});
    live(cardSpeech(P, c, i, n)); $("zoomClose").focus({preventScroll: true});
  },
  close() { $("zoom").classList.remove("on"); $("zc").innerHTML = ""; }
};
function refreshAfterStamp(P) { if (Hand.P && Hand.P.date === P.date) { Hand.els.forEach((el, i) => el.classList.toggle("is-done", isDone(P, P.cards[i]))); Hand.sync(); List.render(P); } if (body.classList.contains("view-binder") && Binder.cur) Binder.openPack(Binder.cur); }
$("zoomClose").addEventListener("click", () => Zoom.close());
$("zoom").addEventListener("click", (e) => { if (e.target === $("zoom")) Zoom.close(); });

/* ================= the binder: every day's pack and cards ================= */
function refreshBinderNum() { $("binderNum").textContent = Store.packs.length; }
const Binder = {
  cur: null, prev: null,
  open() { this.prev = body.classList.contains("view-hand") ? "hand" : "stage"; body.classList.add("view-binder"); this.cur = null; this.renderGrid(); $("binderBtn").innerHTML = icon("reply", 2.2) + "Back"; Sfx.tick(); },
  close() { body.classList.remove("view-binder"); $("binderBtn").innerHTML = BINDER_LABEL; refreshBinderNum(); Sfx.tick(); },
  stats() {
    const packs = Store.sorted(), opened = packs.filter((p) => Store.state.opened[p.date]), cards = opened.reduce((a, p) => a + p.cards.length, 0), st = Store.streak();
    $("bStats").innerHTML = '<span class="streak">' + icon("flame", 2.2) + st + (st === 1 ? " pack" : " packs") + " in a row</span><span>" + icon("cards", 2.2) + cards + (cards === 1 ? " card" : " cards") + " collected</span>";
  },
  miniPack(P) {
    const pal = paletteOf(P), opened = !!Store.state.opened[P.date], S = SERIES[P.series] || SERIES.chapter;
    return '<button class="b-pack' + (opened ? " opened" : "") + '" type="button" data-date="' + esc(P.date) + '"><div class="mini' + (P.series === "woodcut" ? " pk-wood" : "") + '" style="--pk:' + pal.pk + ";--pk-ink:" + pal.ink + ";--pk-day:" + (pal.day || "#fff") + ';--gx:30%;--gy:20%;--rx:0deg;--ry:0deg;--px:0px;--py:0px">' +
      '<div class="pack-body"><div class="pprint">' + packPrintHTML(P) + '</div><div class="crimp"></div><div class="foilx"></div><div class="foilx b"></div><div class="pglare"></div><div class="pprint pptop">' + packTitleHTML(P) + '</div></div><div class="mtop"></div>' +
      '<span class="chip">' + (opened ? P.cards.length + (P.cards.length === 1 ? " card" : " cards") : "Sealed") + "</span></div><b>" + esc(P.label || P.date) + "</b><span>" + S.name + " " + pad(P.no || 1) + " · " + (opened ? "opened" : "sealed") + "</span></button>";
  },
  renderGrid() {
    this.cur = null; $("bTitle").textContent = "Binder"; this.stats(); $("binderBtn").innerHTML = icon("reply", 2.2) + "Back";
    const packs = Store.sorted();
    $("bBody").innerHTML = packs.length ? '<div class="b-grid">' + packs.map((P) => this.miniPack(P)).join("") + "</div>" : '<p class="b-empty">No packs yet.</p>';
    $("bBody").querySelectorAll(".b-pack").forEach((b) => b.addEventListener("click", () => { const P = packs.find((p) => p.date === b.dataset.date); if (P) this.openPack(P); }));
    $("bBody").scrollTop = 0;
  },
  openPack(P0) {
    const P = Flow.view(P0); this.cur = P0; const S = SERIES[P.series] || SERIES.chapter, opened = !!Store.state.opened[P.date], n = P.cards.length;
    $("bTitle").textContent = P.label || P.date;
    let h = '<div class="b-page-h"><div><b>' + S.name + " " + pad(P.no || 1) + "</b><span>" + n + (n === 1 ? " card" : " cards") + " · data from " + esc(P.stand || P.date) + "</span></div></div>";
    $("binderBtn").innerHTML = icon("reply", 2.2) + "All packs";
    if (opened) h += '<div class="pockets">' + P.cards.map((c, i) => '<div class="pocket" data-i="' + i + '">' + cardHTML(P, c, i, n) + "</div>").join("") + "</div>";
    else h += '<div style="max-width:220px;margin:10px auto 18px">' + this.miniPack(P) + '</div><div style="text-align:center"><button class="act" type="button" id="bOpen">' + icon("draw", 2.4) + "Open now</button></div>";
    $("bBody").innerHTML = h; $("bBody").scrollTop = 0;
    $("bBody").querySelectorAll(".pocket").forEach((p) => p.addEventListener("click", () => Zoom.open(P, +p.dataset.i)));
    const bo = $("bOpen"); if (bo) bo.addEventListener("click", () => { this.close(); Flow.start(P0); });
    const bp = $("bBody").querySelector(".b-pack"); if (bp && !opened) bp.addEventListener("click", () => { this.close(); Flow.start(P0); });
  }
};
const BINDER_LABEL = $("binderBtn").innerHTML;
$("binderBtn").addEventListener("click", () => { if (body.classList.contains("view-binder")) { if (Binder.cur) { Binder.renderGrid(); Sfx.tick(); } else Binder.close(); } else Binder.open(); });

/* ================= keyboard ================= */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { if ($("zoom").classList.contains("on")) Zoom.close(); else if (body.classList.contains("view-binder")) Binder.close(); else Flow.skip(); return; }
  if ($("zoom").classList.contains("on") || body.classList.contains("view-binder")) return;
  if (body.classList.contains("view-hand") && !body.classList.contains("mode-list")) {
    if (e.key === "ArrowRight") { e.preventDefault(); Hand.go(Math.round(Hand.pos) + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); Hand.go(Math.round(Hand.pos) - 1); }
    return;
  }
  if ((e.key === "Enter" || e.key === " ") && document.activeElement && document.activeElement.tagName !== "BUTTON" && document.activeElement.tagName !== "A") {
    if (Flow.phase === "intro") { e.preventDefault(); autoTear(); } else if (Flow.phase === "draw" || Flow.phase === "reveal") { e.preventDefault(); cta.click(); }
  }
});

/* ================= boot ================= */
/* light show painted once into a small canvas: the GPU keeps a 640px texture instead of a 180vmax layer */
function drawRays() {
  const c = $("rays"), N = 640, g = c.getContext && c.getContext("2d"); if (!g) return;
  if (c.width !== N) { c.width = N; c.height = N; }
  const mode = c.classList.contains("halo") ? "halo" : c.classList.contains("ring") ? "ring" : "rays", R = N / 2;
  g.clearRect(0, 0, N, N); g.globalCompositeOperation = "source-over";
  if (mode === "halo") {
    const r = g.createRadialGradient(R, R, 0, R, R, R); r.addColorStop(0, "rgba(255,236,190,.28)"); r.addColorStop(.4, "rgba(255,236,190,.08)"); r.addColorStop(.62, "rgba(255,236,190,0)"); g.fillStyle = r; g.fillRect(0, 0, N, N); return;
  }
  if (mode === "rays" && g.createConicGradient) {
    const k = g.createConicGradient(-Math.PI / 2, R, R), col = (a) => "rgba(255,240,200," + a + ")";
    for (let p = 0; p < 15; p++) { const o = p / 15, d = 1 / 360; k.addColorStop(o, col(0)); k.addColorStop(o + 9 * d, col(0)); k.addColorStop(o + 12 * d, col(.16)); k.addColorStop(o + 15 * d, col(.16)); k.addColorStop(o + 18 * d, col(0)); }
    g.fillStyle = k; g.fillRect(0, 0, N, N);
  } else {
    const px = N / (1.8 * Math.max(innerWidth, innerHeight));
    for (let r0 = 0; r0 < R; r0 += 60 * px) { const r = g.createRadialGradient(R, R, r0 + 26 * px, R, R, r0 + 36 * px); r.addColorStop(0, "rgba(255,240,210,0)"); r.addColorStop(.4, "rgba(255,240,210,.12)"); r.addColorStop(.6, "rgba(255,240,210,.12)"); r.addColorStop(1, "rgba(255,240,210,0)"); g.fillStyle = r; g.beginPath(); g.arc(R, R, r0 + 36 * px, 0, 7); g.arc(R, R, r0 + 26 * px, 0, 7, true); g.fill(); }
  }
  g.globalCompositeOperation = "destination-in";
  const m = g.createRadialGradient(R, R, 0, R, R, R); m.addColorStop(.08, "#000"); m.addColorStop(.3, "rgba(0,0,0,.55)"); m.addColorStop(.62, "rgba(0,0,0,0)"); g.fillStyle = m; g.fillRect(0, 0, N, N);
  g.globalCompositeOperation = "source-over";
}
(async function boot() {
  ensureTones(); drawRays(); if (PREVIEW) Dbg.init();
  try { const q = new URLSearchParams(location.search).get("series"); if (q && SERIES[q]) Flow.override = q; } catch (e) {}
  $("hlTitle").textContent = "Your pack is on its way"; $("hlSub").textContent = ""; $("rays").style.opacity = .6;
  wrap.classList.add("hidden");
  await Store.init();
  refreshBinderNum();
  Store.onChange = () => {
    refreshBinderNum(); if (body.classList.contains("view-binder") && !Binder.cur) Binder.renderGrid();
    /* a newer pack arrived after the page was already showing an older one: switch to it */
    const N = Store.today(), cur = Hand.P || Flow.P;
    if (!cur || N.date <= cur.date || $("zoom").classList.contains("on") || body.classList.contains("view-binder")) return;
    if (!["hand", "intro"].includes(Flow.phase) && !body.classList.contains("view-hand")) return;
    if (Store.state.opened[N.date] || reduced) { Flow.P = Flow.view(N); Flow.n = N.cards.length; Hand.show(Flow.view(N), {}); } else Flow.start(N);
  };
  const P = Store.today(), seen = !!Store.state.opened[P.date];
  if (reduced || seen) { Flow.P = Flow.view(P); Flow.n = P.cards.length; Flow.phase = "hand"; $("rays").style.opacity = 0; Hand.show(Flow.view(P), {}); if (seen) toast("Already opened today"); return; }
  $("rays").style.opacity = "";
  Flow.start(P);
})();
addEventListener("resize", () => { if (Flow.phase === "intro" && !Tear.p && Flow.P) Tear.build(Flow.P); if (body.classList.contains("view-hand")) { Hand.fit(); Hand.layout(); } });
