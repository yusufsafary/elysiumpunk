/* ELYSIUM PUNKS - Seed Machine (index only)
   The collection's own generator, ported faithfully to JS and verified
   pixel-identical against the studio generator: same seed, same face.
   Plus hero parallax and a scroll-reactive text band. */
(function () {
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= seed engine (verified port) ================= */
  var SHA_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4f, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  function sha256Low32(str) {
    function rr(x, n) { return (x >>> n) | (x << (32 - n)); }
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var bytes = [], i;
    for (i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i) & 0xff);
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    bytes.push(0, 0, 0, 0, (bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff);
    var w = new Array(64);
    for (var block = 0; block < bytes.length; block += 64) {
      for (var t = 0; t < 16; t++) w[t] = (bytes[block + t * 4] << 24) | (bytes[block + t * 4 + 1] << 16) | (bytes[block + t * 4 + 2] << 8) | bytes[block + t * 4 + 3];
      for (t = 16; t < 64; t++) {
        var s0 = rr(w[t - 15], 7) ^ rr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rr(w[t - 2], 17) ^ rr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var temp1 = (h + S1 + ch + SHA_K[t] + w[t]) | 0;
        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var temp2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + temp1) | 0; d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H[7] >>> 0;
  }
  var SKINS = [[255,219,177],[241,194,146],[214,160,110],[172,118,74],[128,84,50],[96,58,36]];
  var HAIRC = [[20,20,20],[90,50,20],[180,120,40],[200,40,40],[40,90,200],[40,180,90],[230,230,230],[255,90,180]];
  var BGS = [[[247,214,120],[240,190,80]],[[168,216,234],[120,180,220]],[[58,58,66],[40,40,48]],[[30,24,60],[70,30,90]],[[240,230,200],[210,200,170]]];
  var SHIRTS = [[30,30,30],[160,30,40],[40,60,160],[30,120,70],[120,40,140],[220,170,30],[240,240,240]];
  var MOHAWK_C = [[230,40,60],[40,200,90],[60,120,255],[255,90,180],[255,140,20]];
  var TYPES = ["Mortal", "Blessed", "Saint"];
  var HAIRN = ["Mohawk", "Spikes", "Long sides", "Cap", "Flat top", "Bald", "Swept"];

  function renderSeed(seed) {
    seed = Math.floor(Math.abs(Number(seed) || 0));
    var state = sha256Low32(String(seed));
    function rnd(n) { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return (state >>> 8) % n; }
    var roll = seed % 1000;
    var typ = roll >= 970 ? 2 : (roll >= 700 ? 1 : 0);
    var traits = [];
    var g = [];
    function px(x, y, w, h, c) {
      for (var yy = y; yy < y + h; yy++) for (var xx = x; xx < x + w; xx++) {
        if (xx >= 0 && xx < 24 && yy >= 0 && yy < 24) g[yy * 24 + xx] = c;
      }
    }
    var bg = typ === 0 ? BGS[rnd(BGS.length)] : (typ === 2 ? BGS[0] : BGS[rnd(2)]);
    for (var y = 0; y < 24; y++) {
      var t = y / 23, c = [0, 1, 2].map(function (i) { return Math.floor(bg[0][i] + (bg[1][i] - bg[0][i]) * t); });
      px(0, y, 24, 1, c);
    }
    var skin = typ === 2 ? [255, 205, 90] : SKINS[rnd(SKINS.length)];
    if (typ === 2) traits.push("Gold skin");
    var dark = skin.map(function (v) { return Math.max(0, Math.floor(v * 0.72)); });
    var shirt = SHIRTS[rnd(SHIRTS.length)];
    px(10, 19, 4, 2, dark); px(6, 21, 12, 1, shirt); px(5, 22, 14, 1, shirt); px(4, 23, 16, 1, shirt);
    px(10, 21, 4, 1, dark);
    px(7, 6, 10, 13, skin); px(6, 8, 1, 6, skin); px(17, 8, 1, 6, skin);
    px(7, 18, 10, 1, dark);
    var halo = typ >= 1 && (typ === 2 || rnd(2) === 0);
    var hair = rnd(7), hc = HAIRC[rnd(HAIRC.length)];
    if (typ >= 1 && (hair === 0 || hair === 1)) hair = 5;
    traits.push(HAIRN[hair]);
    if (hair === 0) { var mc = MOHAWK_C[rnd(MOHAWK_C.length)]; px(11, 1, 2, 5, mc); px(10, 3, 4, 1, mc); }
    else if (hair === 1) { for (var x = 7; x < 17; x += 2) px(x, 3, 1, 3, hc); px(7, 5, 10, 1, hc); }
    else if (hair === 2) { px(7, 4, 10, 2, hc); px(7, 6, 2, 3, hc); px(15, 6, 2, 3, hc); }
    else if (hair === 3) { px(6, 5, 12, 1, [25, 25, 25]); px(8, 3, 8, 2, [25, 25, 25]); }
    else if (hair === 4) { px(7, 4, 10, 2, hc); }
    else if (hair === 6) { px(7, 3, 10, 2, hc); px(7, 5, 10, 1, hc); }
    if (halo) { px(9, 0, 6, 1, [255, 232, 110]); px(8, 0, 1, 1, [255, 226, 92]); px(15, 0, 1, 1, [255, 226, 92]); traits.push("Halo"); }
    else if (typ >= 1) { for (var lx = 6; lx < 18; lx += 2) px(lx, 4, 1, 1, [60, 170, 80]); traits.push("Laurel"); }
    var brow = [25, 20, 18];
    px(9, 9, 2, 1, brow); px(14, 9, 2, 1, brow);
    var eye = rnd(4);
    [9, 14].forEach(function (ex) {
      if (eye === 0) px(ex, 11, 2, 1, [25, 20, 18]);
      else if (eye === 1) px(ex, 11, 2, 2, [25, 20, 18]);
      else if (eye === 2) { px(ex, 10, 2, 1, [25, 20, 18]); px(ex, 12, 2, 1, skin); }
      else px(ex, 11, 1, 1, [25, 20, 18]);
    });
    var gl = rnd(5);
    if (gl === 0) { px(8, 10, 3, 2, [15, 15, 15]); px(13, 10, 3, 2, [15, 15, 15]); px(11, 10, 2, 1, [15, 15, 15]); traits.push("Shades"); }
    else if (gl === 1) { px(8, 10, 3, 3, [230, 190, 60]); px(9, 11, 1, 1, skin); px(13, 10, 3, 3, [230, 190, 60]); px(14, 11, 1, 1, skin); traits.push("Gold frames"); }
    px(11, 13, 2, 2, dark);
    var mouth = rnd(5);
    if (mouth === 0) px(10, 16, 4, 1, [120, 60, 50]);
    else if (mouth === 1) { px(10, 16, 4, 1, [120, 60, 50]); px(10, 17, 4, 1, [240, 240, 240]); traits.push("Wide grin"); }
    else if (mouth === 2) { px(11, 16, 2, 1, [120, 60, 50]); px(13, 17, 2, 1, [200, 200, 200]); traits.push("Cigarette"); }
    else if (mouth === 3) { px(10, 16, 4, 1, [120, 60, 50]); px(12, 16, 1, 1, [255, 205, 60]); traits.push("Gold tooth"); }
    else px(11, 16, 3, 1, [120, 60, 50]);
    if (rnd(3) === 0) {
      var bc = rnd(2) ? [42, 30, 20] : dark;
      px(7, 15, 1, 4, bc); px(16, 15, 1, 4, bc); px(8, 18, 8, 1, bc); px(9, 17, 1, 1, bc); px(14, 17, 1, 1, bc);
      traits.push("Beard");
    }
    if (rnd(2) === 0) { px(6, 12, 1, 2, [240, 200, 70]); traits.push("Gold earring"); }
    if (rnd(3) === 0) { px(9, 21, 6, 1, [240, 200, 70]); traits.push("Gold chain"); }
    if (typ === 2) { px(9, 21, 6, 1, [255, 240, 180]); if (traits.indexOf("Gold chain") < 0) traits.push("Gold chain"); }
    return { grid: g, type: TYPES[typ], typ: typ, roll: roll, traits: traits };
  }

  /* ================= seed machine UI ================= */
  var canvas = document.getElementById("seedCanvas");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var CELL = canvas.width / 24;
    var elSeed = document.getElementById("slSeed"), elRoll = document.getElementById("slRoll"),
        elType = document.getElementById("slType"), elTraits = document.getElementById("slTraits"),
        elCount = document.getElementById("slCount"), elSaints = document.getElementById("slSaints"),
        elBanner = document.getElementById("slSaint"), input = document.getElementById("seedInput"),
        btnGo = document.getElementById("seedGo"), btnRoll = document.getElementById("rollBtn");
    var rolls = 0, saints = 0, busy = false, started = false;

    function drawCells(grid, upto, order) {
      ctx.fillStyle = "#141310";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < upto; i++) {
        var idx = order[i], c = grid[idx];
        if (!c) continue;
        ctx.fillStyle = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
        ctx.fillRect((idx % 24) * CELL, Math.floor(idx / 24) * CELL, CELL, CELL);
      }
    }
    function burst(grid) {
      var parts = [];
      for (var i = 0; i < 46; i++) parts.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200, y: 60 + Math.random() * 60,
        vx: (Math.random() - 0.5) * 3.2, vy: -(1 + Math.random() * 2.6),
        s: 4 + Math.random() * 7, life: 1
      });
      var t0 = null;
      function frame(ts) {
        if (!t0) t0 = ts;
        var el = ts - t0;
        drawCells(grid, 576, identityOrder());
        parts.forEach(function (p) {
          p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.life -= 0.012;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = Math.random() > 0.3 ? "#F2C230" : "#D33A2C";
          ctx.fillRect(p.x, p.y, p.s, p.s);
        });
        ctx.globalAlpha = 1;
        if (el < 1150) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    function identityOrder() {
      var o = [];
      for (var i = 0; i < 576; i++) o.push(i);
      return o;
    }
    function show(seed, animate) {
      if (busy) return;
      var r = renderSeed(seed);
      rolls++;
      if (r.typ === 2) saints++;
      elSeed.textContent = Number(seed).toLocaleString("en-US");
      elRoll.textContent = r.roll;
      elType.textContent = r.type;
      elTraits.textContent = r.traits.join(" · ");
      elCount.textContent = rolls;
      elSaints.textContent = saints;
      elBanner.hidden = true;
      var order = identityOrder().sort(function (a, b) {
        var da = (a % 24) + Math.floor(a / 24), db = (b % 24) + Math.floor(b / 24);
        return (da + Math.random() * 4) - (db + Math.random() * 4);
      });
      if (!animate || reduced) {
        drawCells(r.grid, 576, identityOrder());
        if (r.typ === 2) { elBanner.hidden = false; }
        return;
      }
      busy = true;
      btnRoll.disabled = true; btnGo.disabled = true;
      var t0 = null, DUR = 620;
      function frame(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / DUR);
        drawCells(r.grid, Math.floor(576 * p), order);
        if (p < 1) requestAnimationFrame(frame);
        else {
          busy = false; btnRoll.disabled = false; btnGo.disabled = false;
          if (r.typ === 2) { elBanner.hidden = false; burst(r.grid); }
        }
      }
      requestAnimationFrame(frame);
    }
    btnRoll.addEventListener("click", function () {
      show(Math.floor(Math.random() * 900000000) + 1, true);
    });
    function goTyped() {
      var v = parseInt(input.value, 10);
      if (isNaN(v)) { input.focus(); return; }
      show(v, true);
    }
    btnGo.addEventListener("click", goTyped);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); goTyped(); } });
    // first draw when scrolled into view: the flagship seed
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting && !started) { started = true; show(970, true); io.disconnect(); }
        });
      }, { threshold: 0.35 });
      io.observe(canvas);
    } else { show(970, false); }

    /* stage tilt (fine pointers only) */
    var stage = document.getElementById("slStage");
    if (stage && window.matchMedia && window.matchMedia("(pointer: fine)").matches && !reduced) {
      stage.addEventListener("pointermove", function (e) {
        var r = stage.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
        stage.style.setProperty("--ry", (dx * 7).toFixed(2) + "deg");
        stage.style.setProperty("--rx", (-dy * 7).toFixed(2) + "deg");
      });
      stage.addEventListener("pointerleave", function () {
        stage.style.setProperty("--rx", "0deg"); stage.style.setProperty("--ry", "0deg");
      });
    }
  }

  /* ================= hero parallax ================= */
  var trio = document.querySelector(".hero-trio");
  if (trio && window.matchMedia && window.matchMedia("(pointer: fine)").matches && !reduced) {
    var hero = trio.closest("section") || trio.parentElement;
    var tx = 0, ty = 0, cx = 0, cy = 0, rafOn = false;
    function loop() {
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      trio.style.transform = "translate3d(" + (cx * 12).toFixed(1) + "px," + (cy * 9).toFixed(1) + "px,0) rotate(" + (cx * 0.7).toFixed(2) + "deg)";
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) requestAnimationFrame(loop);
      else rafOn = false;
    }
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!rafOn) { rafOn = true; requestAnimationFrame(loop); }
    });
    hero.addEventListener("pointerleave", function () {
      tx = 0; ty = 0;
      if (!rafOn) { rafOn = true; requestAnimationFrame(loop); }
    });
  }

  /* ================= scroll-reactive text band ================= */
  var band = document.querySelector(".textband-track");
  if (band && !reduced) {
    var boost = 1, lastY = window.scrollY, ticking = false;
    window.addEventListener("scroll", function () {
      var dy = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      boost = Math.min(3.6, boost + dy * 0.012);
      if (!ticking) { ticking = true; requestAnimationFrame(decay); }
    }, { passive: true });
    function decay() {
      boost += (1 - boost) * 0.06;
      var anims = band.getAnimations ? band.getAnimations() : [];
      if (anims.length) anims[0].playbackRate = boost;
      if (Math.abs(boost - 1) > 0.01) requestAnimationFrame(decay);
      else ticking = false;
    }
  }
})();
